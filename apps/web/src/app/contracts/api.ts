import type {
  GallerySearchResponse,
  GenerateDesignResponse,
  GenerationStatusResponse,
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

function buildRequestHeaders(initHeaders?: HeadersInit) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...buildAuthHeaders(),
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
  const response = await fetch(buildApiUrl(pathname), {
    ...init,
    headers: buildRequestHeaders(init?.headers),
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
  await delay(180);
  return stubProjects;
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
  const project = bootstrapProjectWorkspace(name);
  rememberLastActiveProject(project.projectId);
  return project;
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
  await delay(160);
  return listGenerationsForProject(projectId).map((generation) => ({
    ...generation,
    source: generation.source ?? "fallback",
  }));
}

export async function fetchDesign(designId: string): Promise<Design> {
  await delay(160);
  const design = getDesignById(designId);
  if (!design) throw new Error(`Design ${designId} not found`);
  return design;
}

export async function fetchSelectedDesign(projectId: string): Promise<Design | null> {
  await delay(180);
  const project = getProjectById(projectId);
  if (!project?.selectedDesignId) return null;
  return getDesignById(project.selectedDesignId);
}

export async function fetchProjectDesigns(projectId: string): Promise<Design[]> {
  await delay(160);
  return listDesignsForProject(projectId);
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
