import type {
  DesignDetailResponse,
  DesignGenerationSummary,
  DesignSummary,
  DesignSelectResponse,
  DevBootstrapResponse,
  GallerySearchResponse,
  GenerateDesignResponse,
  GenerationStatusResponse,
  ProjectDesignsResponse,
  ProjectResponse,
  PromptPreviewResponse,
} from "@skygems/shared";

import type {
  ApiSource,
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
  stubCreateDrafts,
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

const DEFAULT_AUTH_HEADERS = {
  tenantId: "ten_01JQZZ90P4Q5R6S7T8V9W0X1YZ",
  userId: "usr_01JQZZ91Q5R6S7T8V9W0X1Y2ZA",
  authSubject: "auth0|skygems-dev-user",
  email: "designer@skygems.local",
  tenantName: "SkyGems Studio",
  tenantSlug: "skygems-studio",
  userName: "SkyGems Designer",
} as const;

const LIVE_GENERATION_CONTEXT_STORAGE_KEY = "skygems.live-generation-context.v1";
const DEV_BOOTSTRAP_SESSION_STORAGE_KEY = "skygems.dev-bootstrap-session.v1";
const LIVE_PROJECT_CACHE_STORAGE_KEY = "skygems.live-project-cache.v1";

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

interface DevBootstrapSessionRecord {
  sessionToken: string;
  sessionExpiresAt: string;
}

type RequestAuthMode = "none" | "cached" | "bootstrap";

interface RequestJsonOptions {
  authMode?: RequestAuthMode;
  bootstrapProjectName?: string;
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

function getApiMode() {
  return import.meta.env.VITE_API_MODE ?? "live";
}

function isLiveApiEnabled() {
  return getApiMode() !== "stub";
}

function readStorageItem(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value === null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures and keep the frontend operational.
  }
}

function readBootstrapSession() {
  const raw = readStorageItem(DEV_BOOTSTRAP_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DevBootstrapSessionRecord;
    const expiresAt = new Date(parsed.sessionExpiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      writeStorageItem(DEV_BOOTSTRAP_SESSION_STORAGE_KEY, null);
      return null;
    }

    return parsed;
  } catch {
    writeStorageItem(DEV_BOOTSTRAP_SESSION_STORAGE_KEY, null);
    return null;
  }
}

function writeBootstrapSession(session: DevBootstrapSessionRecord | null) {
  writeStorageItem(
    DEV_BOOTSTRAP_SESSION_STORAGE_KEY,
    session ? JSON.stringify(session) : null,
  );
}

function readCachedLiveProjects(): ProjectWorkspace[] {
  const raw = readStorageItem(LIVE_PROJECT_CACHE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ProjectWorkspace[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    writeStorageItem(LIVE_PROJECT_CACHE_STORAGE_KEY, null);
    return [];
  }
}

function writeCachedLiveProjects(projects: ProjectWorkspace[]) {
  writeStorageItem(LIVE_PROJECT_CACHE_STORAGE_KEY, JSON.stringify(projects));
}

function upsertCachedLiveProject(project: ProjectWorkspace) {
  const cachedProjects = readCachedLiveProjects();
  const existing = cachedProjects.find(
    (candidate) => candidate.projectId === project.projectId,
  );

  if (existing) {
    Object.assign(existing, project);
  } else {
    cachedProjects.unshift(project);
  }

  writeCachedLiveProjects(cachedProjects);
}

function buildDefaultDraft(projectId: string): CreateDraftState {
  return {
    projectId,
    inputs: DEFAULT_INPUT,
    inputRevision: 1,
    promptMode: "synced",
    promptValue: generatePromptPreview(DEFAULT_INPUT).prompt,
    previewStatus: "ready",
    previewRevision: 1,
  };
}

function syncProjectWorkspace(project: ProjectWorkspace) {
  const existingProject = stubProjects.find(
    (candidate) => candidate.projectId === project.projectId,
  );

  if (existingProject) {
    Object.assign(existingProject, project);
  } else {
    stubProjects.unshift(project);
  }

  if (!stubCreateDrafts[project.projectId]) {
    stubCreateDrafts[project.projectId] = buildDefaultDraft(project.projectId);
  }

  rememberLastActiveProject(project.projectId);
  upsertCachedLiveProject(project);
}

async function bootstrapLiveProject(projectName?: string): Promise<ProjectWorkspace | null> {
  if (!isLiveApiEnabled()) {
    return null;
  }

  const response = await fetch(buildApiUrl("/v1/dev/bootstrap"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      projectName ? { projectName } : {},
    ),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = (await response.json()) as DevBootstrapResponse;
  writeBootstrapSession({
    sessionToken: payload.sessionToken,
    sessionExpiresAt: payload.sessionExpiresAt,
  });

  const project: ProjectWorkspace = {
    projectId: payload.project.id,
    name: payload.project.name,
    description: payload.project.description,
    status: payload.project.status,
    currentGenerationId: null,
    selectedDesignId: null,
    designCount: 0,
    createdAt: formatDisplayTimestamp(payload.project.createdAt),
    updatedAt: formatDisplayTimestamp(payload.project.updatedAt),
  };
  syncProjectWorkspace(project);
  return project;
}

function buildAuthHeaders(): Record<string, string> {
  return {
    "x-skygems-tenant-id":
      (import.meta.env.VITE_SKYGEMS_TENANT_ID as string | undefined) ??
      DEFAULT_AUTH_HEADERS.tenantId,
    "x-skygems-user-id":
      (import.meta.env.VITE_SKYGEMS_USER_ID as string | undefined) ??
      DEFAULT_AUTH_HEADERS.userId,
    "x-skygems-auth-subject":
      (import.meta.env.VITE_SKYGEMS_AUTH_SUBJECT as string | undefined) ??
      DEFAULT_AUTH_HEADERS.authSubject,
    "x-skygems-user-email":
      (import.meta.env.VITE_SKYGEMS_USER_EMAIL as string | undefined) ??
      DEFAULT_AUTH_HEADERS.email,
    "x-skygems-tenant-name":
      (import.meta.env.VITE_SKYGEMS_TENANT_NAME as string | undefined) ??
      DEFAULT_AUTH_HEADERS.tenantName,
    "x-skygems-tenant-slug":
      (import.meta.env.VITE_SKYGEMS_TENANT_SLUG as string | undefined) ??
      DEFAULT_AUTH_HEADERS.tenantSlug,
    "x-skygems-user-name":
      (import.meta.env.VITE_SKYGEMS_USER_NAME as string | undefined) ??
      DEFAULT_AUTH_HEADERS.userName,
  };
}

function buildRequestHeaders(initHeaders?: HeadersInit): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...buildAuthHeaders(),
    ...(initHeaders ?? {}),
  } as Record<string, string>;
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

async function requestJson<T>(
  pathname: string,
  init?: RequestInit,
  options?: RequestJsonOptions,
): Promise<T> {
  const authMode = options?.authMode ?? "cached";
  const session =
    authMode === "bootstrap"
      ? await bootstrapLiveProject(options?.bootstrapProjectName)
          .then(() => readBootstrapSession())
          .catch(() => null)
      : authMode === "cached"
        ? readBootstrapSession()
        : null;
  const headers = buildRequestHeaders(init?.headers);

  if (session?.sessionToken) {
    headers.Authorization = `Bearer ${session.sessionToken}`;
  }

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

function mapLiveStageStatus(status: DesignSummary["stageStatuses"]["spec"]): Design["stages"]["spec"]["status"] {
  switch (status) {
    case "running":
      return "processing";
    case "succeeded":
      return "ready";
    default:
      return status;
  }
}

function buildLiveStageSnapshot(options: {
  stage: "spec" | "technicalSheet" | "svg" | "cad";
  status: DesignSummary["stageStatuses"]["spec"];
  selected: boolean;
  availableId: string | null;
}) {
  const status = mapLiveStageStatus(options.status);
  const stageLabel =
    options.stage === "technicalSheet"
      ? "technical sheet"
      : options.stage === "svg"
        ? "SVG package"
        : options.stage === "cad"
          ? "CAD export"
          : "specification";

  if (options.availableId) {
    return {
      status,
      summary: `Backend truth marks the ${stageLabel} stage as available for this design.`,
      versionLabel: options.availableId,
    };
  }

  if (!options.selected) {
    return {
      status: "absent" as const,
      summary: `Select this design to make ${stageLabel} the active downstream lane.`,
    };
  }

  switch (status) {
    case "queued":
      return {
        status,
        summary: `The ${stageLabel} stage is queued in the backend pipeline.`,
      };
    case "processing":
      return {
        status,
        summary: `The ${stageLabel} stage is actively being prepared.`,
      };
    case "failed":
      return {
        status,
        summary: `The ${stageLabel} stage failed and needs another run.`,
      };
    case "skipped":
      return {
        status,
        summary: `The ${stageLabel} stage was skipped for this design revision.`,
      };
    default:
      return {
        status,
        summary: `The ${stageLabel} stage has not been requested yet.`,
      };
  }
}

function mapRecentGenerationActivity(item: DesignGenerationSummary) {
  return {
    generationId: item.generationId,
    requestKind: item.requestKind,
    status: mapGenerationStatus(item.status),
    createdAt: formatDisplayTimestamp(item.createdAt),
    completedAt: item.completedAt ? formatDisplayTimestamp(item.completedAt) : undefined,
    errorMessage: item.error?.message ?? undefined,
  };
}

function mapDesignSummary(
  summary: DesignSummary,
  recentGenerations?: DesignGenerationSummary[],
): Design {
  const fallbackDesign = getDesignById(summary.designId);
  const context = summary.sourceGenerationId
    ? getLiveGenerationContext(summary.sourceGenerationId)
    : null;
  const selected = summary.selectionState === "selected";
  const sketch = summary.pair?.sketch;
  const render = summary.pair?.render;

  return {
    id: summary.designId,
    projectId: summary.projectId,
    parentDesignId: summary.parentDesignId ?? undefined,
    sourceKind: summary.sourceKind,
    sourceGenerationId:
      summary.sourceGenerationId ??
      recentGenerations?.[0]?.generationId ??
      fallbackDesign?.sourceGenerationId ??
      "",
    selectionState: summary.selectionState,
    displayName: summary.displayName,
    promptSummary:
      summary.promptSummary ||
      context?.promptSummary ||
      fallbackDesign?.promptSummary ||
      generatePromptPreview(
        getCreateDraftByProjectId(summary.projectId)?.inputs ?? DEFAULT_INPUT,
      ).summary,
    designDna: summary.designDna,
    latestPairId: summary.latestPairId ?? undefined,
    createdAt: formatDisplayTimestamp(summary.createdAt),
    selectedAt: summary.selectedAt ? formatDisplayTimestamp(summary.selectedAt) : undefined,
    updatedAt: formatDisplayTimestamp(summary.updatedAt),
    sketch: {
      artifactId: sketch?.artifactId ?? fallbackDesign?.sketch.artifactId ?? `${summary.designId}-sketch`,
      label: fallbackDesign?.sketch.label ?? "Pair Sketch",
      alt: fallbackDesign?.sketch.alt ?? "Generated design sketch",
      url: sketch?.signedUrl ?? fallbackDesign?.sketch.url ?? "",
      kind: "image",
    },
    render: {
      artifactId: render?.artifactId ?? fallbackDesign?.render.artifactId ?? `${summary.designId}-render`,
      label: fallbackDesign?.render.label ?? "Pair Render",
      alt: fallbackDesign?.render.alt ?? "Generated design render",
      url: render?.signedUrl ?? fallbackDesign?.render.url ?? "",
      kind: "image",
    },
    stages: {
      spec: buildLiveStageSnapshot({
        stage: "spec",
        status: summary.stageStatuses.spec,
        selected,
        availableId: summary.latestSpecId,
      }),
      technicalSheet: buildLiveStageSnapshot({
        stage: "technicalSheet",
        status: summary.stageStatuses.technicalSheet,
        selected,
        availableId: summary.latestTechnicalSheetId,
      }),
      svg: buildLiveStageSnapshot({
        stage: "svg",
        status: summary.stageStatuses.svg,
        selected,
        availableId: summary.latestSvgAssetId,
      }),
      cad: buildLiveStageSnapshot({
        stage: "cad",
        status: summary.stageStatuses.cad,
        selected,
        availableId: summary.latestCadJobId,
      }),
    },
    refinePresets:
      fallbackDesign?.refinePresets ?? [
        "Tighten silhouette",
        "Push gemstone hierarchy",
        "Reduce crown height",
        "Introduce temple detail",
      ],
    refineTargetGenerationId:
      recentGenerations?.[0]?.generationId ?? fallbackDesign?.refineTargetGenerationId,
    lineageNotes: [
      selected
        ? "This design is the active workspace truth for the project."
        : "This design remains available as a candidate until it is explicitly selected.",
      summary.sourceKind === "refine"
        ? "This revision came from a refinement cycle."
        : "This revision came from the primary create flow.",
      summary.latestPairId
        ? "Pair artifacts are available for review in the current workspace."
        : "Pair artifacts are still pending for this revision.",
    ],
    specData:
      fallbackDesign?.specData ?? {
        versionLabel: summary.latestSpecId ?? "Not generated",
        summary: selected
          ? "Specification fields will populate from backend artifacts as the downstream slice lands."
          : "Select this design before starting specification work.",
        geometry: [],
        materials: [],
        gemstones: [],
        constructionNotes: [],
        riskFlags: [],
        missingInformation: [],
      },
    technicalSheetData:
      fallbackDesign?.technicalSheetData ?? {
        versionLabel: summary.latestTechnicalSheetId ?? "Not generated",
        generatedAt: summary.latestTechnicalSheetId
          ? formatDisplayTimestamp(summary.updatedAt)
          : "Awaiting specification approval",
        geometryAndDimensions: [],
        materialsAndMetalDetails: [],
        gemstoneSchedule: [],
        constructionAndAssemblyNotes: [],
        tolerancesAndConstraints: [],
        riskFlags: [],
        missingInformation: [],
      },
    svgViews: fallbackDesign?.svgViews ?? [],
    cadJobs: fallbackDesign?.cadJobs ?? [],
    recentGenerations: recentGenerations?.map((item) => mapRecentGenerationActivity(item)),
  };
}

function buildLiveDesignFromGeneration(payload: GenerationStatusResponse): Design {
  return mapDesignSummary(payload.design);
}

function mapGenerationResponse(payload: GenerationStatusResponse): Generation {
  const context = getLiveGenerationContext(payload.generationId);
  const liveDesign = mapDesignSummary(payload.design);

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
    message: buildGenerationMessage(
      payload,
      context?.promptSummary ?? liveDesign.promptSummary,
    ),
    readyPairs: payload.pair ? 1 : 0,
    totalPairs: 1,
    reconnecting: false,
    pairs: payload.pair
      ? [
          {
            designId: payload.designId,
            pairLabel:
              payload.design.selectionState === "selected" ? "Active Pair" : "Hero Pair",
            designDna: liveDesign.designDna,
            status: "ready",
            sketchArtifactUrl: payload.pair.sketch.signedUrl,
            renderArtifactUrl: payload.pair.render.signedUrl,
            sourceGenerationId: payload.generationId,
            note: context
              ? `Generated from ${context.promptSummary}.`
              : payload.design.selectionState === "selected"
                ? "Already promoted into the active project workspace."
                : "Ready to be promoted into the active workspace.",
          },
        ]
      : [],
    source: "live",
    lastCheckedAt: new Date().toISOString(),
    projectSelectedDesignId: payload.projectSelectedDesignId,
    canSelect: payload.canSelect,
    designSelectionState: payload.design.selectionState,
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
  await delay(180);
  const liveProjects = readCachedLiveProjects();
  const projects = [...liveProjects];

  for (const stubProject of stubProjects) {
    if (!projects.some((candidate) => candidate.projectId === stubProject.projectId)) {
      projects.push(stubProject);
    }
  }

  return projects;
}

export async function fetchProject(projectId: string): Promise<ProjectWorkspace> {
  await delay(120);

  try {
    const payload = await requestJson<ProjectResponse>(`/v1/projects/${projectId}`);
    const project = mapProjectResponse(payload);
    syncProjectWorkspace(project);

    if (payload.selectedDesign) {
      stubDesigns[payload.selectedDesign.designId] = mapDesignSummary(payload.selectedDesign);
    }

    return project;
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
  await delay(40);
  return getLastActiveProjectId();
}

export async function fetchCreateDraft(projectId: string): Promise<CreateDraftState> {
  await delay(120);
  const draft = getCreateDraftByProjectId(projectId);
  if (!draft) throw new Error(`Create draft for ${projectId} not found`);
  rememberLastActiveProject(projectId);
  return draft;
}

export async function bootstrapProject(name?: string): Promise<ProjectWorkspace> {
  await delay(160);

  try {
    const liveProject = await bootstrapLiveProject(name);
    if (liveProject) {
      return liveProject;
    }
  } catch {
    // Fall through to the local bootstrap path.
  }

  const fallbackProject = bootstrapProjectWorkspace(name);
  rememberLastActiveProject(fallbackProject.projectId);
  return fallbackProject;
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
      upsertCachedLiveProject(project);
    } else {
      syncProjectWorkspace({
        projectId: input.projectId,
        name: `Project ${input.projectId.slice(-6)}`,
        description: "Live backend workspace in progress.",
        status: "active",
        currentGenerationId: payload.generationId,
        selectedDesignId: null,
        designCount: 0,
        createdAt: formatDisplayTimestamp(payload.createdAt),
        updatedAt: formatDisplayTimestamp(payload.createdAt),
      });
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
    stubDesigns[payload.designId] = liveDesign;
    stubGenerations[generationId] = mappedGeneration;
    const project = getProjectById(payload.projectId);
    if (project) {
      project.currentGenerationId = payload.generationId;
      project.selectedDesignId = payload.projectSelectedDesignId;
      project.updatedAt = formatDisplayTimestamp(
        payload.completedAt ?? payload.startedAt ?? payload.createdAt,
      );
    }
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
  await delay(160);
  return listGenerationsForProject(projectId).map((generation) => ({
    ...generation,
    source: generation.source ?? "fallback",
  }));
}

export async function fetchDesign(designId: string): Promise<Design> {
  try {
    const payload = await requestJson<DesignDetailResponse>(`/v1/designs/${designId}`);
    const design = mapDesignSummary(payload.design, payload.recentGenerations);
    stubDesigns[designId] = design;

    const project = getProjectById(payload.projectId);
    if (project) {
      project.selectedDesignId = payload.selectedDesignId;
    }

    return design;
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
    const project = mapProjectResponse(payload);
    syncProjectWorkspace(project);

    if (!payload.selectedDesign) {
      return null;
    }

    const design = mapDesignSummary(payload.selectedDesign);
    stubDesigns[design.id] = design;
    return design;
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
    const designs = payload.items.map((item) => mapDesignSummary(item));
    designs.forEach((design) => {
      stubDesigns[design.id] = design;
    });

    const project = getProjectById(projectId);
    if (project) {
      project.designCount = payload.total;
      project.selectedDesignId = payload.selectedDesignId;
    }

    return designs;
  } catch {
    await delay(160);
    return listDesignsForProject(projectId);
  }
}

export async function postSelectDesign(designId: string): Promise<Design> {
  const payload = await requestJson<DesignSelectResponse>(
    `/v1/designs/${designId}/select`,
    {
      method: "POST",
    },
  );
  const design = mapDesignSummary(payload.design, payload.recentGenerations);
  stubDesigns[designId] = design;

  const project = getProjectById(payload.projectId);
  if (project) {
    project.selectedDesignId = payload.selectedDesignId;
    project.updatedAt = design.updatedAt ?? project.updatedAt;
  }

  if (payload.previousSelectedDesignId && stubDesigns[payload.previousSelectedDesignId]) {
    stubDesigns[payload.previousSelectedDesignId] = {
      ...stubDesigns[payload.previousSelectedDesignId],
      selectionState: "superseded",
    };
  }

  return design;
}

export async function postRefineDesign(designId: string) {
  await delay(220);
  const design = getDesignById(designId);
  if (!design) {
    return { generationId: "" };
  }

  const generation = enqueueStubGeneration(design.projectId, "refine");
  design.refineTargetGenerationId = generation.id;
  return { generationId: generation.id };
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
