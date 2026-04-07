import type {
  DesignDetailResponse,
  DesignSelectResponse,
  GallerySearchResponse,
  GenerateDesignResponse,
  GenerationStatusResponse,
  ProjectDesignsResponse,
  ProjectResponse,
  PromptPreviewResponse,
} from "@skygems/shared";

import type {
  ApiSource,
  ArtifactRef,
  CreateDraftState,
  CreateInput,
  Design,
  GallerySearchResult,
  Generation,
  ProjectWorkspace,
} from "./types";
import {
  bootstrapProjectWorkspace,
  enqueueStubGeneration,
  getCreateDraftByProjectId,
  getDesignById,
  getGenerationById,
  getLastActiveProjectId,
  getProjectById,
  listDesignsForProject,
  listGenerationsForProject,
  rememberLastActiveProject,
  searchGalleryResults,
  stubDesigns,
  stubGenerations,
  stubProjects,
} from "./stubs";
import { buildDesignDna } from "../domain/variationEngine";
import { generatePromptPreview } from "../domain/promptGenerator";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_INPUT: CreateInput = {
  jewelryType: "ring",
  metal: "gold",
  gemstones: ["diamond"],
  style: "contemporary",
  complexity: 44,
};

// ── Dev bootstrap session management ──

const DEV_SESSION_KEY = "skygems.dev-session.v1";

interface DevSession {
  token: string;
  expiresAt: string;
  projectId: string;
}

function getStoredSession(): DevSession | null {
  try {
    const raw = sessionStorage.getItem(DEV_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as DevSession;
    if (new Date(session.expiresAt) <= new Date()) {
      sessionStorage.removeItem(DEV_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function storeSession(session: DevSession) {
  sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
}

async function ensureDevSession(): Promise<DevSession> {
  const existing = getStoredSession();
  if (existing) return existing;

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/v1/dev/bootstrap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Dev bootstrap failed: ${response.status}`);
  }

  const data = await response.json() as {
    sessionToken: string;
    sessionExpiresAt: string;
    project: { id: string };
  };

  const session: DevSession = {
    token: data.sessionToken,
    expiresAt: data.sessionExpiresAt,
    projectId: data.project.id,
  };

  storeSession(session);
  return session;
}

let _bootstrapPromise: Promise<DevSession> | null = null;

async function getDevSession(): Promise<DevSession> {
  if (!_bootstrapPromise) {
    _bootstrapPromise = ensureDevSession().catch((err) => {
      _bootstrapPromise = null;
      throw err;
    });
  }
  return _bootstrapPromise;
}

const LIVE_GENERATION_CONTEXT_STORAGE_KEY = "skygems.live-generation-context.v1";

interface LiveGenerationContext {
  generationId: string;
  designId: string;
  projectId: string;
  inputs: CreateInput;
  promptMode: CreateDraftState["promptMode"];
  promptSummary: string;
  promptText: string;
  createdAt: string;
}

export interface PromptPreviewResult {
  promptText: string;
  promptSummary: string;
  source: ApiSource;
  errorMessage?: string;
}

export interface GenerateDesignResult {
  generationId: string;
  source: ApiSource;
  errorMessage?: string;
}

function getApiBaseUrl() {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  return configured ? configured.replace(/\/$/, "") : "";
}

function buildApiUrl(pathname: string) {
  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}${pathname}` : pathname;
}

async function buildRequestHeaders(initHeaders?: HeadersInit) {
  const session = await getDevSession();
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.token}`,
    ...(initHeaders ?? {}),
  };
}

function formatDisplayTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
    };
    if (payload.error?.message) {
      return payload.error.message;
    }
  } catch {
    // Ignore JSON parsing errors and fall through to the HTTP status text.
  }

  return `${response.status} ${response.statusText}`.trim();
}

async function requestJson<T>(pathname: string, init?: RequestInit): Promise<T> {
  const headers = await buildRequestHeaders(init?.headers);
  const response = await fetch(buildApiUrl(pathname), {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as T;
}

function readLiveGenerationContexts(): Record<string, LiveGenerationContext> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(LIVE_GENERATION_CONTEXT_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as Record<string, LiveGenerationContext>;
  } catch {
    return {};
  }
}

function writeLiveGenerationContexts(contexts: Record<string, LiveGenerationContext>) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    LIVE_GENERATION_CONTEXT_STORAGE_KEY,
    JSON.stringify(contexts),
  );
}

function rememberLiveGenerationContext(context: LiveGenerationContext) {
  const contexts = readLiveGenerationContexts();
  contexts[context.generationId] = context;
  writeLiveGenerationContexts(contexts);
}

function getLiveGenerationContext(generationId: string) {
  return readLiveGenerationContexts()[generationId] ?? null;
}

function buildFallbackPreview(input: CreateInput, errorMessage?: string): PromptPreviewResult {
  const preview = generatePromptPreview(input);
  return {
    promptText: preview.prompt,
    promptSummary: preview.summary,
    source: "fallback",
    errorMessage,
  };
}

function buildPlaceholderImageDataUrl(label: string) {
  const safeLabel = label.replace(/[<&>]/g, "");
  const svg = `
    <svg width="800" height="1000" viewBox="0 0 800 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="1000" rx="40" fill="#111111" />
      <rect x="32" y="32" width="736" height="936" rx="28" stroke="rgba(212,175,55,0.22)" stroke-width="2" />
      <circle cx="400" cy="430" r="150" stroke="#D4AF37" stroke-width="5" fill="none" />
      <path d="M250 620 C320 400, 480 400, 550 620" stroke="#F5DEB3" stroke-width="8" fill="none" stroke-linecap="round" />
      <text x="400" y="840" text-anchor="middle" fill="#E5E5E5" font-size="32" font-family="Inter, Arial, sans-serif">${safeLabel}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildPlaceholderArtifactRef(label: string, alt: string): ArtifactRef {
  return {
    artifactId: `placeholder-${label.toLowerCase().replace(/\s+/g, "-")}`,
    label,
    alt,
    url: buildPlaceholderImageDataUrl(label),
    kind: "image",
  };
}

function mapArtifactRef(
  artifact: { artifactId: string; contentType: string; signedUrl: string } | null | undefined,
  label: string,
  alt: string,
): ArtifactRef {
  if (!artifact) {
    return buildPlaceholderArtifactRef(label, alt);
  }

  return {
    artifactId: artifact.artifactId,
    label,
    alt,
    url: artifact.signedUrl,
    kind: artifact.contentType.includes("svg") ? "vector" : "image",
  };
}

function buildStageSnapshot(
  status: Design["stages"]["spec"]["status"],
  summary: string,
  versionLabel?: string,
): Design["stages"]["spec"] {
  return {
    status,
    summary,
    versionLabel,
  };
}

function summarizeStage(
  label: string,
  status: Design["stages"]["spec"]["status"],
  hasArtifact: boolean,
): string {
  switch (status) {
    case "ready":
    case "succeeded":
      return `${label} is available for review.`;
    case "running":
    case "processing":
      return `${label} is currently processing.`;
    case "queued":
      return `${label} has been queued.`;
    case "failed":
      return `${label} failed and needs another run.`;
    case "stale":
      return `${label} is stale and should be regenerated.`;
    case "skipped":
      return `${label} was skipped in the latest run.`;
    case "not_requested":
    case "absent":
    default:
      return hasArtifact
        ? `${label} has partial data available.`
        : `${label} has not been requested yet.`;
  }
}

type DesignSummaryPayload =
  | NonNullable<ProjectResponse["selectedDesign"]>
  | ProjectDesignsResponse["items"][number]
  | DesignDetailResponse["design"];

function mapDesignSummaryToDesign(
  summary: DesignSummaryPayload,
  options?: {
    recentGenerationId?: string | null;
  },
): Design {
  const sourceGenerationId =
    summary.sourceGenerationId ?? options?.recentGenerationId ?? "";

  const specStatus = summary.stageStatuses.spec === "succeeded" ? "ready" : summary.stageStatuses.spec;
  const technicalSheetStatus =
    summary.stageStatuses.technicalSheet === "succeeded"
      ? "ready"
      : summary.stageStatuses.technicalSheet;
  const svgStatus = summary.stageStatuses.svg === "succeeded" ? "ready" : summary.stageStatuses.svg;
  const cadStatus = summary.stageStatuses.cad === "succeeded" ? "ready" : summary.stageStatuses.cad;

  return {
    id: summary.designId,
    projectId: summary.projectId,
    parentDesignId: summary.parentDesignId,
    sourceKind: summary.sourceKind,
    sourceGenerationId,
    selectionState: summary.selectionState,
    displayName: summary.displayName,
    promptSummary: summary.promptSummary,
    designDna: summary.designDna,
    latestPairId: summary.latestPairId ?? undefined,
    createdAt: formatDisplayTimestamp(summary.createdAt),
    selectedAt: summary.selectedAt ? formatDisplayTimestamp(summary.selectedAt) : undefined,
    sketch: mapArtifactRef(summary.pair?.sketch, "Pair Sketch", "Generated design sketch"),
    render: mapArtifactRef(summary.pair?.render, "Pair Render", "Generated design render"),
    stages: {
      spec: buildStageSnapshot(
        specStatus,
        summarizeStage("Specification", specStatus, Boolean(summary.latestSpecId)),
        summary.latestSpecId ? "Latest spec" : "Not generated",
      ),
      technicalSheet: buildStageSnapshot(
        technicalSheetStatus,
        summarizeStage(
          "Technical sheet",
          technicalSheetStatus,
          Boolean(summary.latestTechnicalSheetId),
        ),
        summary.latestTechnicalSheetId ? "Latest technical sheet" : "Not generated",
      ),
      svg: buildStageSnapshot(
        svgStatus,
        summarizeStage("SVG package", svgStatus, Boolean(summary.latestSvgAssetId)),
        summary.latestSvgAssetId ? "Latest SVG package" : "Not generated",
      ),
      cad: buildStageSnapshot(
        cadStatus,
        summarizeStage("CAD package", cadStatus, Boolean(summary.latestCadJobId)),
        summary.latestCadJobId ? "Latest CAD package" : "Not generated",
      ),
    },
    refinePresets: [
      "Tighten silhouette",
      "Push gemstone hierarchy",
      "Reduce crown height",
      "Introduce temple detail",
    ],
    refineTargetGenerationId: options?.recentGenerationId ?? summary.sourceGenerationId ?? undefined,
    lineageNotes: [
      summary.parentDesignId
        ? "This design was created as a refinement of an earlier concept."
        : "This design originated from a create-generation request.",
      summary.selectionState === "selected"
        ? "This design is the active project selection."
        : "This design remains available as a candidate within the project.",
    ],
    specData: {
      versionLabel: summary.latestSpecId ? "Latest generated spec" : "Not generated",
      summary: summarizeStage("Specification", specStatus, Boolean(summary.latestSpecId)),
      geometry: [],
      materials: [],
      gemstones: [],
      constructionNotes: [],
      riskFlags: [],
      missingInformation: [],
    },
    technicalSheetData: {
      versionLabel: summary.latestTechnicalSheetId ? "Latest technical sheet" : "Not generated",
      generatedAt: formatDisplayTimestamp(summary.updatedAt),
      geometryAndDimensions: [],
      materialsAndMetalDetails: [],
      gemstoneSchedule: [],
      constructionAndAssemblyNotes: [],
      tolerancesAndConstraints: [],
      riskFlags: [],
      missingInformation: [],
    },
    svgViews: [],
    cadJobs: [],
  };
}

function mapGenerationStatus(status: GenerationStatusResponse["status"]): Generation["status"] {
  switch (status) {
    case "running":
      return "processing";
    case "succeeded":
      return "completed";
    default:
      return status;
  }
}

function buildGenerationMessage(
  payload: GenerationStatusResponse,
  promptSummary?: string,
) {
  if (payload.error?.message) {
    return payload.error.message;
  }

  switch (payload.status) {
    case "queued":
      return "Generation request accepted and queued for execution.";
    case "running":
      return promptSummary
        ? `Generating a hero pair for ${promptSummary}.`
        : "Generating the current design pair.";
    case "succeeded":
      return promptSummary
        ? `Hero pair ready for ${promptSummary}.`
        : "Hero pair is ready.";
    case "failed":
      return "Generation failed before a pair was finalized.";
    case "canceled":
      return "Generation was canceled before completion.";
  }
}

function buildLiveDesignFromGeneration(payload: GenerationStatusResponse): Design | null {
  if (!payload.pair) {
    return null;
  }

  const context = getLiveGenerationContext(payload.generationId);
  const draftInput = context?.inputs ?? getCreateDraftByProjectId(payload.projectId)?.inputs ?? DEFAULT_INPUT;
  const designDna = buildDesignDna(draftInput);
  const selectedAt =
    payload.status === "succeeded"
      ? formatDisplayTimestamp(payload.completedAt ?? payload.createdAt)
      : undefined;

  return {
    id: payload.designId,
    projectId: payload.projectId,
    parentDesignId: null,
    sourceKind: payload.requestKind,
    sourceGenerationId: payload.generationId,
    selectionState: payload.pair.selectionState,
    displayName: `${designDna.style} ${designDna.jewelryType} concept`,
    promptSummary:
      context?.promptSummary ??
      generatePromptPreview(draftInput).summary,
    designDna,
    latestPairId: payload.pair.pairId,
    createdAt: formatDisplayTimestamp(payload.createdAt),
    selectedAt,
    sketch: {
      artifactId: payload.pair.sketch.artifactId,
      label: "Pair Sketch",
      alt: "Generated design sketch",
      url: payload.pair.sketch.signedUrl,
      kind: "image",
    },
    render: {
      artifactId: payload.pair.render.artifactId,
      label: "Pair Render",
      alt: "Generated design render",
      url: payload.pair.render.signedUrl,
      kind: "image",
    },
    stages: {
      spec: {
        status: "not_requested",
        summary: "Specification has not been requested for this live design yet.",
      },
      technicalSheet: {
        status: "not_requested",
        summary: "Technical sheet is waiting on spec approval.",
      },
      svg: {
        status: "not_requested",
        summary: "SVG generation is waiting on the technical sheet stage.",
      },
      cad: {
        status: "not_requested",
        summary: "CAD export has not been started for this live design yet.",
      },
    },
    refinePresets: [
      "Tighten silhouette",
      "Push gemstone hierarchy",
      "Reduce crown height",
      "Introduce temple detail",
    ],
    refineTargetGenerationId: undefined,
    lineageNotes: [
      "Live generation response promoted this pair into the selected-design workspace.",
      "Downstream stages remain untouched until spec work begins.",
    ],
    specData: {
      versionLabel: "Not generated",
      summary: "Specification is pending for this live design.",
      geometry: [],
      materials: [],
      gemstones: [],
      constructionNotes: [],
      riskFlags: [],
      missingInformation: [],
    },
    technicalSheetData: {
      versionLabel: "Not generated",
      generatedAt: "Awaiting specification approval",
      geometryAndDimensions: [],
      materialsAndMetalDetails: [],
      gemstoneSchedule: [],
      constructionAndAssemblyNotes: [],
      tolerancesAndConstraints: [],
      riskFlags: [],
      missingInformation: [],
    },
    svgViews: [],
    cadJobs: [],
  };
}

function mapGenerationResponse(payload: GenerationStatusResponse): Generation {
  const context = getLiveGenerationContext(payload.generationId);
  const designDna = context
    ? buildDesignDna(context.inputs)
    : getDesignById(payload.designId)?.designDna ??
      buildDesignDna(getCreateDraftByProjectId(payload.projectId)?.inputs ?? DEFAULT_INPUT);

  return {
    id: payload.generationId,
    projectId: payload.projectId,
    requestKind: payload.requestKind,
    status: mapGenerationStatus(payload.status),
    pairStandardVersion: payload.pairStandardVersion,
    createdAt: formatDisplayTimestamp(payload.createdAt),
    completedAt: payload.completedAt
      ? formatDisplayTimestamp(payload.completedAt)
      : undefined,
    errorMessage: payload.error?.message ?? undefined,
    message: buildGenerationMessage(payload, context?.promptSummary),
    readyPairs: payload.pair ? 1 : 0,
    totalPairs: 1,
    reconnecting: false,
    pairs: payload.pair
      ? [
          {
            designId: payload.designId,
            pairLabel: "Hero Pair",
            designDna,
            status: "ready",
            sketchArtifactUrl: payload.pair.sketch.signedUrl,
            renderArtifactUrl: payload.pair.render.signedUrl,
            sourceGenerationId: payload.generationId,
            note: context
              ? `Generated from ${context.promptSummary}.`
              : "Live generation response.",
          },
        ]
      : [],
    source: "live",
    lastCheckedAt: new Date().toISOString(),
  };
}

function mapProjectResponse(payload: ProjectResponse): ProjectWorkspace {
  return {
    projectId: payload.project.id,
    name: payload.project.name,
    description: payload.project.description,
    status: payload.project.status,
    currentGenerationId: payload.recentGenerations[0]?.generationId ?? null,
    selectedDesignId:
      payload.selectedDesign?.designId ?? payload.project.selectedDesignId ?? null,
    designCount: payload.project.designCount,
    createdAt: formatDisplayTimestamp(payload.project.createdAt),
    updatedAt: formatDisplayTimestamp(payload.project.updatedAt),
  };
}

function mapGalleryResponse(payload: GallerySearchResponse): GallerySearchResult[] {
  return payload.items.map((item) => {
    const stubDesign = getDesignById(item.designId);
    const draftInput = getCreateDraftByProjectId(item.projectId)?.inputs ?? DEFAULT_INPUT;

    return {
      designId: item.designId,
      projectId: item.projectId,
      displayName: item.displayName,
      summary: item.promptSummary,
      selectionState: item.selectionState,
      designDna: stubDesign?.designDna ?? buildDesignDna(draftInput),
      sketchThumbnailUrl: stubDesign?.sketch.url,
      renderThumbnailUrl: item.coverImage?.signedUrl ?? stubDesign?.render.url,
      createdAt: formatDisplayTimestamp(item.updatedAt),
    };
  });
}

function buildIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function fetchProjects(): Promise<ProjectWorkspace[]> {
  // Ensure session exists so we have a real project
  const session = await getDevSession();
  try {
    const project = await requestJson<ProjectResponse>(`/v1/projects/${session.projectId}`);
    return [mapProjectResponse(project)];
  } catch {
    await delay(180);
    return stubProjects;
  }
}

export async function fetchProject(projectId: string): Promise<ProjectWorkspace> {
  await delay(120);

  try {
    const payload = await requestJson<ProjectResponse>(`/v1/projects/${projectId}`);
    rememberLastActiveProject(projectId);
    return mapProjectResponse(payload);
  } catch {
    const project = getProjectById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    rememberLastActiveProject(projectId);
    return project;
  }
}

export async function fetchLastActiveProjectId() {
  const session = await getDevSession();
  return session.projectId;
}

export async function fetchCreateDraft(projectId: string): Promise<CreateDraftState> {
  await delay(120);
  const draft = getCreateDraftByProjectId(projectId);
  if (draft) {
    rememberLastActiveProject(projectId);
    return draft;
  }

  // Create a fresh draft for real projects that don't have stubs
  rememberLastActiveProject(projectId);
  const preview = generatePromptPreview(DEFAULT_INPUT);
  return {
    projectId,
    inputs: { ...DEFAULT_INPUT },
    promptMode: "synced",
    promptValue: preview.prompt,
    inputRevision: 0,
    previewRevision: 0,
    previewStatus: "ready",
  };
}

export async function bootstrapProject(name?: string): Promise<ProjectWorkspace> {
  try {
    const session = await getDevSession();
    const project = await fetchProject(session.projectId);
    rememberLastActiveProject(project.projectId);
    return project;
  } catch {
    await delay(160);
    const project = bootstrapProjectWorkspace(name);
    rememberLastActiveProject(project.projectId);
    return project;
  }
}

export async function postPromptPreview(input: {
  projectId: string;
  inputs: CreateInput;
}): Promise<PromptPreviewResult> {
  const previewPayload = {
    projectId: input.projectId,
    ...input.inputs,
    pairStandardVersion: "pair_v1" as const,
  };

  try {
    const payload = await requestJson<PromptPreviewResponse>("/v1/prompt-preview", {
      method: "POST",
      body: JSON.stringify(previewPayload),
    });

    return {
      promptText: payload.promptText,
      promptSummary: payload.promptSummary,
      source: "live",
    };
  } catch (error) {
    return buildFallbackPreview(
      input.inputs,
      error instanceof Error ? error.message : "Live prompt preview unavailable.",
    );
  }
}

export async function postGenerateDesign(input: {
  projectId: string;
  draft: CreateDraftState;
  latestPreviewSummary?: string;
}): Promise<GenerateDesignResult> {
  const localPreview = generatePromptPreview(input.draft.inputs);
  const promptSummary = input.latestPreviewSummary ?? localPreview.summary;
  const requestBody: Record<string, unknown> = {
    projectId: input.projectId,
    ...input.draft.inputs,
    pairStandardVersion: "pair_v1",
  };

  if (input.draft.promptMode === "override") {
    requestBody.promptTextOverride = input.draft.promptValue;
  }

  try {
    const payload = await requestJson<GenerateDesignResponse>("/v1/generate-design", {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey(),
      },
      body: JSON.stringify(requestBody),
    });

    rememberLiveGenerationContext({
      generationId: payload.generationId,
      designId: payload.designId,
      projectId: payload.projectId,
      inputs: input.draft.inputs,
      promptMode: input.draft.promptMode,
      promptSummary,
      promptText: input.draft.promptValue,
      createdAt: payload.createdAt,
    });
    stubGenerations[payload.generationId] = {
      id: payload.generationId,
      projectId: payload.projectId,
      requestKind: "create",
      status: "queued",
      pairStandardVersion: payload.pairStandardVersion,
      createdAt: formatDisplayTimestamp(payload.createdAt),
      message: "Generation request accepted and queued for execution.",
      readyPairs: 0,
      totalPairs: 1,
      reconnecting: false,
      pairs: [],
      source: "live",
      lastCheckedAt: new Date().toISOString(),
    };
    const project = getProjectById(input.projectId);
    if (project) {
      project.currentGenerationId = payload.generationId;
      project.updatedAt = formatDisplayTimestamp(payload.createdAt);
    }
    rememberLastActiveProject(input.projectId);

    return {
      generationId: payload.generationId,
      source: "live",
    };
  } catch (error) {
    const generation = enqueueStubGeneration(input.projectId, "create");
    return {
      generationId: generation.id,
      source: "fallback",
      errorMessage:
        error instanceof Error ? error.message : "Live generation unavailable.",
    };
  }
}

export async function fetchGeneration(generationId: string): Promise<Generation> {
  try {
    const payload = await requestJson<GenerationStatusResponse>(
      `/v1/generations/${generationId}`,
    );
    const mappedGeneration = mapGenerationResponse(payload);
    const liveDesign = buildLiveDesignFromGeneration(payload);
    if (liveDesign) {
      stubDesigns[payload.designId] = liveDesign;
    }
    stubGenerations[generationId] = mappedGeneration;
    return mappedGeneration;
  } catch {
    await delay(220);
    const generation = getGenerationById(generationId);
    if (!generation) throw new Error(`Generation ${generationId} not found`);
    return {
      ...generation,
      source: "fallback",
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

export async function fetchProjectGenerations(projectId: string): Promise<Generation[]> {
  try {
    const payload = await requestJson<ProjectResponse>(`/v1/projects/${projectId}`);
    return payload.recentGenerations.map((generation) => ({
      id: generation.generationId,
      projectId,
      requestKind: "create",
      status: mapGenerationStatus(generation.status),
      pairStandardVersion: "pair_v1",
      createdAt: formatDisplayTimestamp(generation.createdAt),
      message:
        generation.status === "succeeded"
          ? "Generation completed."
          : generation.status === "running"
            ? "Generation is in progress."
            : generation.status === "queued"
              ? "Generation is queued."
              : "Generation needs attention.",
      readyPairs: 0,
      totalPairs: 1,
      reconnecting: false,
      pairs: [],
      source: "live",
    }));
  } catch {
    await delay(160);
    return listGenerationsForProject(projectId).map((generation) => ({
      ...generation,
      source: generation.source ?? "fallback",
    }));
  }
}

export async function fetchDesign(designId: string): Promise<Design> {
  try {
    const payload = await requestJson<DesignDetailResponse>(`/v1/designs/${designId}`);
    const mapped = mapDesignSummaryToDesign(payload.design, {
      recentGenerationId:
        payload.recentGenerations[0]?.generationId ?? payload.design.sourceGenerationId,
    });
    stubDesigns[designId] = mapped;
    return mapped;
  } catch {
    await delay(160);
    const design = getDesignById(designId);
    if (!design) throw new Error(`Design ${designId} not found`);
    return design;
  }
}

export async function fetchSelectedDesign(projectId: string): Promise<Design | null> {
  try {
    const payload = await requestJson<ProjectResponse>(`/v1/projects/${projectId}`);
    if (!payload.selectedDesign) {
      return null;
    }

    const mapped = mapDesignSummaryToDesign(payload.selectedDesign, {
      recentGenerationId: payload.recentGenerations[0]?.generationId ?? null,
    });
    stubDesigns[mapped.id] = mapped;
    return mapped;
  } catch {
    await delay(180);
    const project = getProjectById(projectId);
    if (!project?.selectedDesignId) return null;
    return getDesignById(project.selectedDesignId);
  }
}

export async function fetchProjectDesigns(projectId: string): Promise<Design[]> {
  try {
    const payload = await requestJson<ProjectDesignsResponse>(
      `/v1/projects/${projectId}/designs`,
    );
    const mapped = payload.items.map((item) => mapDesignSummaryToDesign(item));
    for (const design of mapped) {
      stubDesigns[design.id] = design;
    }
    return mapped;
  } catch {
    await delay(160);
    return listDesignsForProject(projectId);
  }
}

export async function postSelectDesign(designId: string): Promise<Design> {
  try {
    const payload = await requestJson<DesignSelectResponse>(
      `/v1/designs/${designId}/select`,
      {
        method: "POST",
      },
    );
    const mapped = mapDesignSummaryToDesign(payload.design, {
      recentGenerationId: payload.recentGenerations[0]?.generationId ?? payload.design.sourceGenerationId,
    });
    stubDesigns[designId] = mapped;
    return mapped;
  } catch {
    const design = getDesignById(designId);
    if (!design) {
      throw new Error(`Design ${designId} not found`);
    }
    return design;
  }
}

export async function postRefineDesign(input: {
  designId: string;
  instruction: string;
  promptOverride?: string;
}) {
  try {
    const instruction = input.promptOverride?.trim()
      ? `${input.instruction.trim()}\n\nPrompt override to respect: ${input.promptOverride.trim()}`
      : input.instruction.trim();

    const payload = await requestJson<{
      generationId: string;
      sourceDesignId: string;
      refinedDesignId: string;
      status: "queued" | "running";
      createdAt: string;
    }>(`/v1/designs/${input.designId}/refine`, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey(),
      },
      body: JSON.stringify({
        instruction,
        preserve: [],
        pairStandardVersion: "pair_v1",
      }),
    });

    return {
      generationId: payload.generationId,
      refinedDesignId: payload.refinedDesignId,
      source: "live" as const,
    };
  } catch {
    await delay(220);
    const design = getDesignById(input.designId);
    if (!design) {
      return { generationId: "", refinedDesignId: "", source: "fallback" as const };
    }

    const generation = enqueueStubGeneration(design.projectId, "refine");
    design.refineTargetGenerationId = generation.id;
    return {
      generationId: generation.id,
      refinedDesignId: design.id,
      source: "fallback" as const,
    };
  }
}

export async function postGallerySearch(input: {
  query?: string;
}): Promise<GallerySearchResult[]> {
  try {
    const payload = await requestJson<GallerySearchResponse>("/v1/gallery/search", {
      method: "POST",
      body: JSON.stringify({
        query: input.query ?? "",
        filters: {},
        page: 1,
        pageSize: 24,
        sort: "newest",
      }),
    });

    return mapGalleryResponse(payload);
  } catch {
    await delay(160);
    return searchGalleryResults(input.query ?? "");
  }
}
