import {
  createDefaultAgentExecutor,
  enhanceFreeTextPrompt,
  getFullWikiContext,
  type CopilotAgentOutput,
} from "@skygems/agent-runtime";
import {
  ArtifactPublicSchema,
  AuthSessionResponseSchema,
  buildDesignDisplayName,
  formatPromptBundlePreviewText,
  parsePromptBundleText,
  buildPromptSummary,
  buildSearchText,
  CadJobIdSchema,
  DevBootstrapRequestSchema,
  DevBootstrapResponseSchema,
  DevLoginRequestSchema,
  DevLoginResponseSchema,
  DesignDetailResponseSchema,
  DesignDnaSchema,
  DesignDnaPreviewSchema,
  DesignSelectResponseSchema,
  DesignSummarySchema,
  DesignIdSchema,
  GenerateDesignRequestSchema,
  GenerateDesignResponseSchema,
  GenerateQueuePayloadSchema,
  GenerationStatusResponseSchema,
  GallerySearchRequestSchema,
  GallerySearchResponseSchema,
  PairIdSchema,
  ProjectIdSchema,
  ProjectDesignsQuerySchema,
  ProjectDesignsResponseSchema,
  ProjectResponseSchema,
  PromptAgentOutputSchema,
  PromptBundleSchema,
  PromptEnhanceRequestSchema,
  PromptEnhanceResponseSchema,
  PromptPreviewRequestSchema,
  PromptPreviewResponseSchema,
  RefineRequestSchema,
  RefineResponseSchema,
  SpecAgentOutputSchema,
  SpecRequestSchema,
  SpecQueuePayloadSchema,
  StageStatusesSchema,
  SvgAgentOutputSchema,
  SvgRequestSchema,
  CadPrepAgentOutputSchema,
  CadRequestSchema,
  TechSheetAgentOutputSchema,
  TechnicalSheetRequestSchema,
  WorkflowStageResponseSchema,
  generatePrefixedId,
  type ArtifactPublic,
  type CadPrepAgentOutput,
  type GallerySearchResponse,
  type GenerateDesignResponse,
  type GenerationStatusResponse,
  type PromptAgentOutput,
  type RefineResponse,
  type ProjectResponse,
  type SpecAgentOutput,
  type StageStatuses,
  type SvgAgentOutput,
  type TechSheetAgentOutput,
} from "@skygems/shared";
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

import {
  ensureTenantAndUser,
  issueArtifactAccessToken,
  resolveAuthContext,
  type AuthContext,
  verifyArtifactAccessToken,
} from "./lib/auth.ts";
import { ensureDevBootstrap } from "./lib/bootstrap.ts";
import { resolveLocalDevAccount } from "./lib/bootstrap.ts";
import { selectProjectDesign } from "./lib/design-selection.ts";
import { asJsonText, executeStatement, nowIso, queryAll, queryFirst } from "./lib/d1.ts";
import { dispatchGenerateExecution, runGenerateExecution } from "./lib/generation.ts";
import { computeRequestHash, requireIdempotencyKey, withIdempotency } from "./lib/idempotency.ts";
import { errorResponse, handleApiError, HttpError, jsonResponse, parseJsonBody } from "./lib/http.ts";
import { resolvePromptWorkspace } from "./lib/projects.ts";
import {
  isLocalDevelopmentRequest,
  isDevBootstrapEnabled,
  requiresExplicitDevBootstrapIdentity,
  resolveGenerateExecutionMode,
  resolvePromptProviderSelection,
  type ApiEnv,
} from "./lib/runtime.ts";

interface ProjectRow {
  id: string;
  tenant_id: string;
  created_by_user_id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  selected_design_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DesignRow {
  id: string;
  tenant_id: string;
  project_id: string;
  created_by_user_id: string;
  parent_design_id: string | null;
  source_kind: "create" | "refine";
  selection_state: "candidate" | "selected" | "superseded" | "archived";
  display_name: string;
  prompt_summary: string;
  prompt_input_json: string;
  design_dna_json: string;
  latest_pair_id: string | null;
  latest_spec_id: string | null;
  latest_technical_sheet_id: string | null;
  latest_svg_asset_id: string | null;
  latest_cad_job_id: string | null;
  latest_workflow_run_id: string | null;
  search_text: string;
  created_at: string;
  selected_at: string | null;
  updated_at: string;
  archived_at: string | null;
}

interface GenerationRow {
  id: string;
  tenant_id: string;
  project_id: string;
  design_id: string;
  requested_by_user_id: string;
  base_design_id: string | null;
  request_kind: "create" | "refine";
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  pair_standard_version: "pair_v1";
  request_json: string;
  request_hash: string;
  idempotency_key: string;
  prompt_agent_output_json: string | null;
  error_code: string | null;
  error_message: string | null;
  execution_mode: "queue" | "local";
  execution_source:
    | "configured_queue"
    | "configured_local"
    | "default_auto"
    | "local_development"
    | "queue_send_failed_fallback";
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

interface GenerationPairRow {
  id: string;
  generation_id: string;
  sketch_artifact_id: string;
  render_artifact_id: string;
}

interface ArtifactRow {
  id: string;
  tenant_id: string;
  project_id: string;
  artifact_kind: ArtifactPublic["kind"];
  r2_key: string;
  file_name: string;
  content_type: string;
  byte_size: number | null;
  sha256: string;
}

interface WorkflowRow {
  id: string;
  requested_target_stage: "spec" | "technical_sheet" | "svg" | "cad";
  current_stage: "none" | "spec" | "technical_sheet" | "svg" | "cad" | "complete";
  workflow_status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  spec_status: StageStatuses["spec"];
  technical_sheet_status: StageStatuses["technicalSheet"];
  svg_status: StageStatuses["svg"];
  cad_status: StageStatuses["cad"];
  latest_spec_id: string | null;
  latest_technical_sheet_id: string | null;
  latest_svg_asset_id: string | null;
  latest_cad_job_id: string | null;
  updated_at: string;
}

interface DesignSpecRow {
  id: string;
  agent_output_json: string | null;
  risk_flags_json: string;
  unknowns_json: string;
  spec_version: number;
  completed_at: string | null;
  updated_at: string;
}

interface TechnicalSheetRow {
  id: string;
  sheet_json: string | null;
  tech_version: number;
  completed_at: string | null;
  updated_at: string;
}

interface CountRow {
  count: number;
}

interface ProjectMembershipRow {
  role: "owner" | "editor" | "viewer";
}

const projectRoleRank: Record<ProjectMembershipRow["role"], number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
};

const agentExecutor = createDefaultAgentExecutor();

function defaultStageStatuses(): StageStatuses {
  return StageStatusesSchema.parse({
    spec: "not_requested",
    technicalSheet: "not_requested",
    svg: "not_requested",
    cad: "not_requested",
  });
}

function resolvePublicOrigin(request: Request): string {
  const origin = request.headers.get("Origin")?.trim();
  if (origin && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

async function buildAuthSessionResponse(
  db: D1Database,
  auth: AuthContext,
) {
  const memberships = await queryAll<{ project_id: string; role: ProjectMembershipRow["role"] }>(
    db,
    `SELECT project_memberships.project_id, project_memberships.role
     FROM project_memberships
     INNER JOIN projects ON projects.id = project_memberships.project_id
     WHERE project_memberships.user_id = ?
       AND projects.tenant_id = ?
     ORDER BY project_memberships.project_id ASC`,
    [auth.userId, auth.tenantId],
  );

  const [accessibleProjectsRow] = await queryAll<CountRow>(
    db,
    `SELECT COUNT(*) AS count
     FROM projects
     WHERE tenant_id = ?
       AND id IN (SELECT project_id FROM project_memberships WHERE user_id = ?)`,
    [auth.tenantId, auth.userId],
  );

  const [ownedProjectsRow] = await queryAll<CountRow>(
    db,
    `SELECT COUNT(*) AS count
     FROM projects
     WHERE tenant_id = ? AND created_by_user_id = ?`,
    [auth.tenantId, auth.userId],
  );

  const [accessibleDesignsRow] = await queryAll<CountRow>(
    db,
    `SELECT COUNT(*) AS count
     FROM designs
     WHERE tenant_id = ?
       AND project_id IN (SELECT project_id FROM project_memberships WHERE user_id = ?)`,
    [auth.tenantId, auth.userId],
  );

  const [ownedDesignsRow] = await queryAll<CountRow>(
    db,
    `SELECT COUNT(*) AS count
     FROM designs
     WHERE tenant_id = ? AND created_by_user_id = ?`,
    [auth.tenantId, auth.userId],
  );

  const [accessibleArtifactsRow] = await queryAll<CountRow>(
    db,
    `SELECT COUNT(*) AS count
     FROM artifacts
     WHERE tenant_id = ?
       AND project_id IN (SELECT project_id FROM project_memberships WHERE user_id = ?)`,
    [auth.tenantId, auth.userId],
  );

  return AuthSessionResponseSchema.parse({
    authMode: auth.authMode,
    tenant: {
      id: auth.tenantId,
      slug: auth.tenantSlug,
      name: auth.tenantName,
    },
    user: {
      id: auth.userId,
      email: auth.email,
      displayName: auth.displayName,
      authSubject: auth.authSubject,
      role: auth.role,
      permissions: auth.permissions,
    },
    access: {
      memberships: memberships.map((membership) => ({
        projectId: membership.project_id,
        role: membership.role,
      })),
      accessibleProjectCount: accessibleProjectsRow?.count ?? 0,
      ownedProjectCount: ownedProjectsRow?.count ?? 0,
      accessibleDesignCount: accessibleDesignsRow?.count ?? 0,
      ownedDesignCount: ownedDesignsRow?.count ?? 0,
      accessibleArtifactCount: accessibleArtifactsRow?.count ?? 0,
    },
  });
}

function buildDesignDnaPreview(designDna: PromptAgentOutput["designDna"]) {
  return DesignDnaPreviewSchema.parse({
    jewelryType: designDna.jewelryType,
    metal: designDna.metal,
    gemstones: designDna.gemstones,
    style: designDna.style,
    complexity: designDna.complexity,
    bandStyle: designDna.bandStyle,
    settingType: designDna.settingType,
    stonePosition: designDna.stonePosition,
    profile: designDna.profile,
    motif: designDna.motif,
  });
}

async function rebuildPromptAgentOutputFromDesign(
  design: DesignRow,
  provider: "xai" | "google",
  apiEnv?: { XAI_API_KEY?: string },
): Promise<PromptAgentOutput> {
  const designDna = DesignDnaSchema.parse(JSON.parse(design.design_dna_json));
  const promptMode = design.source_kind === "refine" ? "refine" : "generate";
  const promptAgentRun = await agentExecutor.run<PromptAgentOutput>("prompt-agent", {
    mode: promptMode,
    projectId: design.project_id,
    designId: design.id,
    input: {
      projectId: design.project_id,
      jewelryType: designDna.jewelryType,
      metal: designDna.metal,
      gemstones: designDna.gemstones,
      style: designDna.style,
      complexity: designDna.complexity,
      pairStandardVersion: "pair_v1",
    },
    sourceDesignId: design.parent_design_id ?? undefined,
    provider,
  }, apiEnv ? { env: { XAI_API_KEY: apiEnv.XAI_API_KEY } } : undefined);

  return PromptAgentOutputSchema.parse({
    schemaVersion: "prompt_agent.v1",
    mode: promptMode,
    projectId: design.project_id,
    designId: design.id,
    sourceDesignId: design.parent_design_id ?? undefined,
    pairStandardVersion: "pair_v1",
    normalizedInput: {
      jewelryType: designDna.jewelryType,
      metal: designDna.metal,
      gemstones: designDna.gemstones,
      style: designDna.style,
      complexity: designDna.complexity,
      pairStandardVersion: "pair_v1",
    },
    designDna,
    promptBundle: promptAgentRun.output.promptBundle,
    blocked: false,
    blockReasons: [],
  });
}

function stageStatusesFromDesign(design: DesignRow, workflow: WorkflowRow | null): StageStatuses {
  if (workflow) {
    return StageStatusesSchema.parse({
      spec: workflow.spec_status,
      technicalSheet: workflow.technical_sheet_status,
      svg: workflow.svg_status,
      cad: workflow.cad_status,
    });
  }

  return StageStatusesSchema.parse({
    spec: design.latest_spec_id ? "succeeded" : "not_requested",
    technicalSheet: design.latest_technical_sheet_id ? "succeeded" : "not_requested",
    svg: design.latest_svg_asset_id ? "succeeded" : "not_requested",
    cad: design.latest_cad_job_id ? "succeeded" : "not_requested",
  });
}

async function requireProject(db: D1Database, tenantId: string, projectId: string): Promise<ProjectRow> {
  const project = await queryFirst<ProjectRow>(
    db,
    `SELECT id, tenant_id, created_by_user_id, name, description, status, selected_design_id, created_at, updated_at
     FROM projects
     WHERE id = ? AND tenant_id = ?`,
    [projectId, tenantId],
  );

  if (!project) {
    throw new HttpError(404, "not_found", "Project was not found for this tenant.");
  }

  return project;
}

async function requireProjectAccess(
  db: D1Database,
  auth: AuthContext,
  projectId: string,
): Promise<ProjectRow> {
  const project = await requireProject(db, auth.tenantId, projectId);
  const membership = await queryFirst<ProjectMembershipRow>(
    db,
    `SELECT role
     FROM project_memberships
     WHERE project_id = ? AND user_id = ?`,
    [project.id, auth.userId],
  );

  if (!membership) {
    throw new HttpError(403, "forbidden", "Project membership is required for this resource.");
  }

  return project;
}

async function requireProjectWriteAccess(
  db: D1Database,
  auth: AuthContext,
  projectId: string,
): Promise<ProjectRow> {
  const project = await requireProjectAccess(db, auth, projectId);
  const membership = await queryFirst<ProjectMembershipRow>(
    db,
    `SELECT role
     FROM project_memberships
     WHERE project_id = ? AND user_id = ?`,
    [project.id, auth.userId],
  );

  if (!membership || projectRoleRank[membership.role] < projectRoleRank.editor) {
    throw new HttpError(403, "forbidden", "Project editor membership is required for this mutation.");
  }

  if (project.status !== "active") {
    throw new HttpError(409, "conflict", "Project mutations are only allowed while the project is active.");
  }

  return project;
}

async function requireDesign(db: D1Database, tenantId: string, designId: string): Promise<DesignRow> {
  const design = await queryFirst<DesignRow>(
    db,
    `SELECT *
     FROM designs
     WHERE id = ? AND tenant_id = ?`,
    [designId, tenantId],
  );

  if (!design) {
    throw new HttpError(404, "not_found", "Design was not found for this tenant.");
  }

  return design;
}

async function loadWorkflow(db: D1Database, workflowRunId: string | null): Promise<WorkflowRow | null> {
  if (!workflowRunId) {
    return null;
  }

  return queryFirst<WorkflowRow>(
    db,
    `SELECT id, requested_target_stage, current_stage, workflow_status, spec_status, technical_sheet_status, svg_status, cad_status,
            latest_spec_id, latest_technical_sheet_id, latest_svg_asset_id, latest_cad_job_id, updated_at
     FROM design_workflow_runs
     WHERE id = ?`,
    [workflowRunId],
  );
}

async function loadLatestSpec(db: D1Database, specId: string | null) {
  if (!specId) {
    return null;
  }

  const spec = await queryFirst<DesignSpecRow>(
    db,
    `SELECT id, agent_output_json, risk_flags_json, unknowns_json, spec_version, completed_at, updated_at
     FROM design_specs
     WHERE id = ?`,
    [specId],
  );

  if (!spec?.agent_output_json) {
    return null;
  }

  return SpecAgentOutputSchema.parse(JSON.parse(spec.agent_output_json));
}

async function loadLatestTechSheet(db: D1Database, techSheetId: string | null) {
  if (!techSheetId) {
    return null;
  }

  const sheet = await queryFirst<TechnicalSheetRow>(
    db,
    `SELECT id, sheet_json, tech_version, completed_at, updated_at
     FROM technical_sheets
     WHERE id = ?`,
    [techSheetId],
  );

  if (!sheet?.sheet_json) {
    return null;
  }

  return TechSheetAgentOutputSchema.parse(JSON.parse(sheet.sheet_json));
}

async function loadLatestSvgAsset(db: D1Database, svgAssetId: string | null) {
  if (!svgAssetId) {
    return null;
  }

  const svgAsset = await queryFirst<{ id: string; agent_output_json: string | null; manifest_json: string | null; views_json: string | null }>(
    db,
    `SELECT id, agent_output_json, manifest_json, views_json
     FROM svg_assets
     WHERE id = ?`,
    [svgAssetId],
  );

  if (!svgAsset?.agent_output_json) {
    return null;
  }

  return SvgAgentOutputSchema.parse(JSON.parse(svgAsset.agent_output_json));
}

async function loadLatestCadJob(db: D1Database, cadJobId: string | null) {
  if (!cadJobId) {
    return null;
  }

  const cadJob = await queryFirst<{ id: string; agent_output_json: string | null; requested_formats_json: string | null; blockers_json: string | null }>(
    db,
    `SELECT id, agent_output_json, requested_formats_json, blockers_json
     FROM cad_jobs
     WHERE id = ?`,
    [cadJobId],
  );

  if (!cadJob?.agent_output_json) {
    return null;
  }

  return CadPrepAgentOutputSchema.parse(JSON.parse(cadJob.agent_output_json));
}

async function loadLatestGenerationForDesign(
  db: D1Database,
  designId: string,
  tenantId: string,
) {
  return queryFirst<GenerationRow>(
    db,
    `SELECT *
     FROM generations
     WHERE design_id = ? AND tenant_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [designId, tenantId],
  );
}

async function loadSourceGenerationId(db: D1Database, designId: string): Promise<string | null> {
  const generation = await queryFirst<{ id: string }>(
    db,
    `SELECT id
     FROM generations
     WHERE design_id = ?
     ORDER BY created_at ASC
     LIMIT 1`,
    [designId],
  );

  return generation?.id ?? null;
}

function canSelectDesign(design: DesignRow): boolean {
  return Boolean(design.latest_pair_id) && !design.archived_at && design.selection_state !== "archived";
}

function buildGenerationError(generation: Pick<GenerationRow, "error_code" | "error_message">) {
  return generation.error_code && generation.error_message
    ? {
        code: generation.error_code,
        message: generation.error_message,
      }
    : null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildArtifactPreviewDataUrl(artifact: Pick<ArtifactRow, "artifact_kind" | "file_name" | "id">): string {
  if (artifact.artifact_kind !== "pair_sketch_png" && artifact.artifact_kind !== "pair_render_png") {
    return `https://signed.skbg.invalid/${artifact.id}`;
  }

  const label = artifact.file_name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  const accent = artifact.artifact_kind === "pair_render_png" ? "#D4AF37" : "#C9B78E";
  const background = artifact.artifact_kind === "pair_render_png" ? "#0B0B0B" : "#F2E7CF";
  const body =
    artifact.artifact_kind === "pair_render_png" ? "rgba(255,255,255,0.7)" : "#5C5138";
  const title = artifact.artifact_kind === "pair_render_png" ? "#F6E6BB" : "#2A2418";
  const mode = artifact.artifact_kind === "pair_render_png" ? "Render" : "Sketch";
  const svg = `
    <svg width="1200" height="900" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="900" rx="44" fill="${background}" />
      <rect x="40" y="40" width="1120" height="820" rx="30" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
      <circle cx="600" cy="405" r="178" fill="none" stroke="${accent}" stroke-width="5" />
      <path d="M408 582 C510 308, 690 308, 792 582" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round" />
      <path d="M468 356 C525 282, 675 282, 732 356" fill="none" stroke="${body}" stroke-width="3" stroke-dasharray="10 10" />
      <text x="92" y="126" fill="${title}" font-size="40" font-family="Inter, Arial, sans-serif" font-weight="700">${escapeXml(label)}</text>
      <text x="92" y="174" fill="${body}" font-size="24" font-family="Inter, Arial, sans-serif">${escapeXml(mode)} placeholder served from backend truth</text>
      <text x="92" y="814" fill="${body}" font-size="20" font-family="Inter, Arial, sans-serif">Artifact ${escapeXml(artifact.id.slice(-8))}</text>
      <text x="1108" y="814" text-anchor="end" fill="${accent}" font-size="20" font-family="Inter, Arial, sans-serif">${escapeXml(mode.toUpperCase())}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function loadArtifact(
  env: ApiEnv,
  db: D1Database,
  artifactId: string | null,
  origin: string,
): Promise<ArtifactPublic | null> {
  if (!artifactId) {
    return null;
  }

  const artifact = await queryFirst<ArtifactRow>(
    db,
    `SELECT id, tenant_id, project_id, artifact_kind, r2_key, file_name, content_type, byte_size, sha256
     FROM artifacts
     WHERE id = ?`,
    [artifactId],
  );

  if (!artifact) {
    return null;
  }

  // Route persisted images through a short-lived signed URL so browser <img> tags
  // can load them without manually attaching Authorization headers.
  const signedUrl = artifact.content_type.startsWith("image/")
    ? new URL(
        `/v1/artifacts/${artifact.id}/image?token=${encodeURIComponent(
          await issueArtifactAccessToken(
            {
              artifactId: artifact.id,
              tenantId: artifact.tenant_id,
              projectId: artifact.project_id,
            },
            env,
            { allowLocalFallback: true, ttlMinutes: 60 * 24 },
          ),
        )}`,
        origin,
      ).toString()
    : buildArtifactPreviewDataUrl(artifact);

  return ArtifactPublicSchema.parse({
    artifactId: artifact.id,
    kind: artifact.artifact_kind,
    contentType: artifact.content_type,
    byteSize: artifact.byte_size ?? 0,
    sha256: artifact.sha256,
    signedUrl,
  });
}

async function loadPairById(
  env: ApiEnv,
  db: D1Database,
  pairId: string | null,
  selectionState: DesignRow["selection_state"],
  origin: string,
) {
  if (!pairId) {
    return null;
  }

  const pair = await queryFirst<GenerationPairRow>(
    db,
    `SELECT id, generation_id, sketch_artifact_id, render_artifact_id
     FROM generation_pairs
     WHERE id = ?`,
    [pairId],
  );

  if (!pair) {
    return null;
  }

  const sketch = await loadArtifact(env, db, pair.sketch_artifact_id, origin);
  const render = await loadArtifact(env, db, pair.render_artifact_id, origin);

  if (!sketch || !render || sketch.kind !== "pair_sketch_png" || render.kind !== "pair_render_png") {
    return null;
  }

  return {
    pairId: PairIdSchema.parse(pair.id),
    selectionState,
    sketch,
    render,
  };
}

async function buildDesignSummary(
  env: ApiEnv,
  db: D1Database,
  design: DesignRow,
  workflow: WorkflowRow | null,
  origin: string,
  currentUserId: string,
) {
  const sourceGenerationId = await loadSourceGenerationId(db, design.id);

  return DesignSummarySchema.parse({
    designId: design.id,
    projectId: design.project_id,
    createdByUserId: design.created_by_user_id,
    ownedByCurrentUser: design.created_by_user_id === currentUserId,
    parentDesignId: design.parent_design_id,
    sourceKind: design.source_kind,
    sourceGenerationId,
    displayName: design.display_name,
    promptSummary: design.prompt_summary,
    designDna: DesignDnaSchema.parse(JSON.parse(design.design_dna_json)),
    selectionState: design.selection_state,
    latestPairId: design.latest_pair_id,
    pair: await loadPairById(env, db, design.latest_pair_id, design.selection_state, origin),
    latestSpecId: design.latest_spec_id,
    latestTechnicalSheetId: design.latest_technical_sheet_id,
    latestSvgAssetId: design.latest_svg_asset_id,
    latestCadJobId: design.latest_cad_job_id ? CadJobIdSchema.parse(design.latest_cad_job_id) : null,
    stageStatuses: stageStatusesFromDesign(design, workflow),
    createdAt: design.created_at,
    selectedAt: design.selected_at,
    updatedAt: design.updated_at,
    archivedAt: design.archived_at,
  });
}

function buildDesignGenerationSummary(generation: GenerationRow) {
  return {
    generationId: generation.id,
    requestKind: generation.request_kind,
    status: generation.status,
    executionMode: generation.execution_mode,
    executionSource: generation.execution_source,
    pairStandardVersion: generation.pair_standard_version,
    createdAt: generation.created_at,
    startedAt: generation.started_at,
    completedAt: generation.completed_at,
    error: buildGenerationError(generation),
  };
}

async function loadRecentDesignGenerations(
  db: D1Database,
  design: DesignRow,
  limit = 10,
) {
  const generations = await queryAll<GenerationRow>(
    db,
    `SELECT *
     FROM generations
     WHERE design_id = ? AND project_id = ? AND tenant_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [design.id, design.project_id, design.tenant_id, limit],
  );

  return generations.map((generation) => buildDesignGenerationSummary(generation));
}

async function loadCoverImageForDesign(
  env: ApiEnv,
  db: D1Database,
  design: DesignRow,
  origin: string,
): Promise<ArtifactPublic | null> {
  if (!design.latest_pair_id) {
    return null;
  }

  const pair = await queryFirst<GenerationPairRow>(
    db,
    `SELECT id, generation_id, sketch_artifact_id, render_artifact_id
     FROM generation_pairs
     WHERE id = ?`,
    [design.latest_pair_id],
  );

  if (!pair) {
    return null;
  }

  return loadArtifact(env, db, pair.render_artifact_id, origin);
}

async function loadGalleryPairImages(
  env: ApiEnv,
  db: D1Database,
  design: DesignRow,
  origin: string,
): Promise<{ sketch: ArtifactPublic | null; render: ArtifactPublic | null }> {
  if (!design.latest_pair_id) {
    return { sketch: null, render: null };
  }

  const pair = await queryFirst<GenerationPairRow>(
    db,
    `SELECT id, generation_id, sketch_artifact_id, render_artifact_id
     FROM generation_pairs
     WHERE id = ?`,
    [design.latest_pair_id],
  );

  if (!pair) {
    return { sketch: null, render: null };
  }

  const [sketch, render] = await Promise.all([
    loadArtifact(env, db, pair.sketch_artifact_id, origin),
    loadArtifact(env, db, pair.render_artifact_id, origin),
  ]);

  return { sketch, render };
}

async function buildProjectResponse(
  env: ApiEnv,
  db: D1Database,
  project: ProjectRow,
  origin: string,
  currentUserId: string,
): Promise<ProjectResponse> {
  const [{ count }] = await queryAll<CountRow>(
    db,
    `SELECT COUNT(*) AS count
     FROM designs
     WHERE project_id = ? AND tenant_id = ?`,
    [project.id, project.tenant_id],
  );

  const recentDesigns = await queryAll<Pick<DesignRow, "id" | "display_name" | "selection_state" | "updated_at">>(
    db,
    `SELECT id, display_name, selection_state, updated_at
     FROM designs
     WHERE project_id = ? AND tenant_id = ?
     ORDER BY updated_at DESC
     LIMIT 10`,
    [project.id, project.tenant_id],
  );

  const recentGenerations = await queryAll<Pick<GenerationRow, "id" | "design_id" | "status" | "created_at">>(
    db,
    `SELECT id, design_id, status, created_at
     FROM generations
     WHERE project_id = ? AND tenant_id = ?
     ORDER BY created_at DESC
     LIMIT 10`,
    [project.id, project.tenant_id],
  );

  const selectedDesign = project.selected_design_id
    ? await requireDesign(db, project.tenant_id, project.selected_design_id)
    : null;
  const selectedWorkflow = selectedDesign
    ? await loadWorkflow(db, selectedDesign.latest_workflow_run_id)
    : null;

  return ProjectResponseSchema.parse({
    project: {
      id: project.id,
      tenantId: project.tenant_id,
      name: project.name,
      description: project.description,
      status: project.status,
      selectedDesignId: project.selected_design_id,
      designCount: count,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    },
    selectedDesign: selectedDesign
      ? await buildDesignSummary(env, db, selectedDesign, selectedWorkflow, origin, currentUserId)
      : null,
    recentDesigns: recentDesigns.map((design) => ({
      designId: DesignIdSchema.parse(design.id),
      displayName: design.display_name,
      selectionState: design.selection_state,
      updatedAt: design.updated_at,
    })),
    recentGenerations: recentGenerations.map((generation) => ({
      generationId: generation.id,
      designId: generation.design_id,
      status: generation.status,
      createdAt: generation.created_at,
    })),
  });
}

async function buildProjectDesignsResponse(
  env: ApiEnv,
  db: D1Database,
  project: ProjectRow,
  origin: string,
  currentUserId: string,
  ownerScope: "all" | "mine",
) {
  const ownerFilterSql = ownerScope === "mine" ? "AND created_by_user_id = ?" : "";
  const queryBindings =
    ownerScope === "mine"
      ? [project.id, project.tenant_id, currentUserId, project.selected_design_id]
      : [project.id, project.tenant_id, project.selected_design_id];
  const designs = await queryAll<DesignRow>(
    db,
    `SELECT *
     FROM designs
     WHERE project_id = ? AND tenant_id = ?
     ${ownerFilterSql}
     ORDER BY
       CASE WHEN id = ? THEN 0 ELSE 1 END,
       COALESCE(selected_at, updated_at) DESC,
       created_at DESC`,
    queryBindings,
  );

  const items = await Promise.all(
    designs.map(async (design) => {
      const workflow = await loadWorkflow(db, design.latest_workflow_run_id);
      return buildDesignSummary(env, db, design, workflow, origin, currentUserId);
    }),
  );

  return ProjectDesignsResponseSchema.parse({
    projectId: project.id,
    selectedDesignId: project.selected_design_id,
    total: items.length,
    items,
  });
}

async function buildDesignDetailResponse(
  env: ApiEnv,
  db: D1Database,
  project: ProjectRow,
  design: DesignRow,
  origin: string,
  currentUserId: string,
) {
  const workflow = await loadWorkflow(db, design.latest_workflow_run_id);
  const latestSpec = await loadLatestSpec(db, design.latest_spec_id);
  const latestTechSheet = await loadLatestTechSheet(db, design.latest_technical_sheet_id);
  const latestSvgAsset = await loadLatestSvgAsset(db, design.latest_svg_asset_id);
  const latestCadJob = await loadLatestCadJob(db, design.latest_cad_job_id);

  return DesignDetailResponseSchema.parse({
    projectId: project.id,
    selectedDesignId: project.selected_design_id,
    canSelect: canSelectDesign(design),
    design: await buildDesignSummary(env, db, design, workflow, origin, currentUserId),
    latestSpec,
    latestTechSheet,
    latestSvgAsset,
    latestCadJob,
    recentGenerations: await loadRecentDesignGenerations(db, design),
  });
}

async function handlePromptPreview(request: Request, env: ApiEnv, auth: AuthContext): Promise<Response> {
  const payload = await parseJsonBody(request, PromptPreviewRequestSchema);
  const resolvedWorkspace = await resolvePromptWorkspace(env.SKYGEMS_DB, auth, payload.projectId);
  const resolvedPayload = PromptPreviewRequestSchema.parse({
    ...payload,
    projectId: resolvedWorkspace.project.id,
  });
  const promptProvider = resolvePromptProviderSelection(env);
  const promptAgentRun = await agentExecutor.run<PromptAgentOutput>("prompt-agent", {
    mode: "generate",
    projectId: resolvedPayload.projectId,
    designId: generatePrefixedId("dsn"),
    input: resolvedPayload,
    provider: promptProvider.active,
  }, { env: { XAI_API_KEY: env.XAI_API_KEY } });

  return jsonResponse(
    PromptPreviewResponseSchema.parse({
      projectId: resolvedPayload.projectId,
      promptPreviewVersion: "prompt_preview.v1",
      pairStandardVersion: promptAgentRun.output.pairStandardVersion,
      normalizedInput: promptAgentRun.output.normalizedInput,
      designDnaPreview: buildDesignDnaPreview(promptAgentRun.output.designDna),
      promptSummary: buildPromptSummary(resolvedPayload),
      promptText: formatPromptBundlePreviewText(promptAgentRun.output.promptBundle),
    }),
    200,
    {
      "x-skygems-prompt-pack-version": promptAgentRun.promptPackVersion,
      "x-skygems-prompt-provider": promptProvider.active,
      "x-skygems-prompt-provider-source": promptProvider.source,
    },
  );
}

async function handlePromptEnhance(request: Request, env: ApiEnv, auth: AuthContext): Promise<Response> {
  const payload = await parseJsonBody(request, PromptEnhanceRequestSchema);
  const resolvedWorkspace = await resolvePromptWorkspace(env.SKYGEMS_DB, auth, payload.projectId);
  const resolvedPayload = PromptEnhanceRequestSchema.parse({
    ...payload,
    projectId: resolvedWorkspace.project.id,
  });

  const apiKey = env.XAI_API_KEY?.trim();
  if (apiKey) {
    const wikiContext = getFullWikiContext();
    const result = await enhanceFreeTextPrompt(resolvedPayload.freeText, wikiContext, apiKey);
    if (result) {
      return jsonResponse(
        PromptEnhanceResponseSchema.parse({
          projectId: resolvedPayload.projectId,
          originalText: resolvedPayload.freeText,
          enhancedText: result.enhancedText,
          source: "live",
        }),
      );
    }
  }

  const fallbackEnhanced = `${resolvedPayload.freeText}. Professional studio jewelry photography, soft overhead lighting with rim lights, clean neutral background, full piece visible, nothing cropped, hyper-detailed textures, 8k resolution, photorealistic.`;
  return jsonResponse(
    PromptEnhanceResponseSchema.parse({
      projectId: resolvedPayload.projectId,
      originalText: resolvedPayload.freeText,
      enhancedText: fallbackEnhanced,
      source: "fallback",
      errorMessage: apiKey ? "LLM enhancement failed" : "API key not configured",
    }),
  );
}

async function handleGenerateDesign(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  ctx: ExecutionContext | undefined,
): Promise<Response> {
  const payload = await parseJsonBody(request, GenerateDesignRequestSchema);
  const idempotencyKey = requireIdempotencyKey(request);
  const resolvedWorkspace = await resolvePromptWorkspace(env.SKYGEMS_DB, auth, payload.projectId, {
    requireWriteAccess: true,
  });
  const resolvedPayload = GenerateDesignRequestSchema.parse({
    ...payload,
    projectId: resolvedWorkspace.project.id,
  });
  const requestHash = await computeRequestHash(resolvedPayload, {}, auth.tenantId);
  const promptProvider = resolvePromptProviderSelection(env);
  const initialExecution = resolveGenerateExecutionMode(request, env);

  const idempotentResult = await withIdempotency<GenerateDesignResponse>(
    env.SKYGEMS_DB,
    auth.tenantId,
    "generate_design",
    idempotencyKey,
    requestHash,
    async () => {
      const designId = generatePrefixedId("dsn");
      const generationId = generatePrefixedId("gen");
      const createdAt = nowIso();
      const promptAgentRun = await agentExecutor.run<PromptAgentOutput>("prompt-agent", {
        mode: "generate",
        projectId: resolvedPayload.projectId,
        designId,
        input: resolvedPayload,
        provider: promptProvider.active,
      }, { env: { XAI_API_KEY: env.XAI_API_KEY } });
      const promptAgentOutput = PromptAgentOutputSchema.parse(promptAgentRun.output);
      const persistedPromptBundle = resolvedPayload.promptTextOverride
        ? parsePromptBundleText(resolvedPayload.promptTextOverride, {
            fallbackNegativePrompt: promptAgentOutput.promptBundle.negativePrompt,
          })
        : PromptBundleSchema.parse(promptAgentOutput.promptBundle);
      const persistedPromptAgentOutput = PromptAgentOutputSchema.parse({
        ...promptAgentOutput,
        promptBundle: persistedPromptBundle,
      });
      const designDna = DesignDnaSchema.parse(persistedPromptAgentOutput.designDna);
      // Use the actual LLM-crafted render prompt so the gallery shows real prompts
      const promptSummary = persistedPromptBundle.renderPrompt || buildPromptSummary(resolvedPayload);

      await executeStatement(
        env.SKYGEMS_DB,
        `INSERT INTO designs (
           id, tenant_id, project_id, created_by_user_id, parent_design_id, source_kind, selection_state,
           display_name, prompt_summary, prompt_input_json, design_dna_json,
           latest_pair_id, latest_spec_id, latest_technical_sheet_id, latest_svg_asset_id, latest_cad_job_id,
           latest_workflow_run_id, search_text, created_at, selected_at, updated_at, archived_at
         ) VALUES (?, ?, ?, ?, NULL, 'create', 'candidate', ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, NULL, ?, NULL)`,
        [
          designId,
          auth.tenantId,
          resolvedPayload.projectId,
          auth.userId,
          buildDesignDisplayName(designDna),
          promptSummary,
          asJsonText(resolvedPayload),
          asJsonText(designDna),
          buildSearchText(designDna, promptSummary, resolvedPayload.userNotes),
          createdAt,
          createdAt,
        ],
      );

      await executeStatement(
        env.SKYGEMS_DB,
        `INSERT INTO generations (
           id, tenant_id, project_id, design_id, requested_by_user_id, base_design_id, request_kind, status,
           pair_standard_version, request_json, request_hash, idempotency_key, prompt_agent_output_json,
           execution_mode, execution_source,
           error_code, error_message, created_at, started_at, completed_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, NULL, 'create', 'queued', 'pair_v1', ?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, ?)`,
        [
          generationId,
          auth.tenantId,
          resolvedPayload.projectId,
          designId,
          auth.userId,
          asJsonText(resolvedPayload),
          requestHash,
          idempotencyKey,
          asJsonText(persistedPromptAgentOutput),
          initialExecution.mode,
          initialExecution.source,
          createdAt,
          createdAt,
        ],
      );

      await executeStatement(
        env.SKYGEMS_DB,
        `UPDATE projects
         SET updated_at = ?
         WHERE id = ?`,
        [createdAt, resolvedPayload.projectId],
      );

      const queuePayload = GenerateQueuePayloadSchema.parse({
        schemaVersion: "generate_queue.v1",
        generationId,
        designId,
        projectId: resolvedPayload.projectId,
        tenantId: auth.tenantId,
        requestedByUserId: auth.userId,
        idempotencyKey,
        requestHash,
        queuedAt: createdAt,
        input: GenerateDesignRequestSchema.omit({
          projectId: true,
          promptTextOverride: true,
        }).parse({
          jewelryType: resolvedPayload.jewelryType,
          metal: resolvedPayload.metal,
          gemstones: resolvedPayload.gemstones,
          style: resolvedPayload.style,
          complexity: resolvedPayload.complexity,
          variationOverrides: resolvedPayload.variationOverrides,
          userNotes: resolvedPayload.userNotes,
          pairStandardVersion: resolvedPayload.pairStandardVersion,
        }),
        promptTextOverride: resolvedPayload.promptTextOverride,
      });

      const dispatch = await dispatchGenerateExecution({
        request,
        env,
        ctx,
        payload: queuePayload,
      });

      return {
        status: 202,
        body: GenerateDesignResponseSchema.parse({
          generationId,
          designId,
          projectId: resolvedPayload.projectId,
          status: "queued",
          executionMode: dispatch.executionMode,
          executionSource: dispatch.executionSource,
          pairStandardVersion: "pair_v1",
          createdAt,
        }),
        primaryResourceType: "generation",
        primaryResourceId: generationId,
      };
    },
  );

  return jsonResponse(idempotentResult.body, idempotentResult.status);
}

async function handleRefineDesign(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  designId: string,
  ctx: ExecutionContext | undefined,
): Promise<Response> {
  const sourceDesign = await requireDesign(env.SKYGEMS_DB, auth.tenantId, designId);
  await requireProjectWriteAccess(env.SKYGEMS_DB, auth, sourceDesign.project_id);

  if (!sourceDesign.latest_pair_id) {
    throw new HttpError(409, "conflict", "The source design must have a completed pair before refine.");
  }

  const payload = await parseJsonBody(request, RefineRequestSchema);
  const idempotencyKey = requireIdempotencyKey(request);
  const requestHash = await computeRequestHash(payload, { designId }, auth.tenantId);
  const promptProvider = resolvePromptProviderSelection(env);
  const initialExecution = resolveGenerateExecutionMode(request, env);
  const createdAt = nowIso();

  const storedInput = GenerateDesignRequestSchema.parse(JSON.parse(sourceDesign.prompt_input_json));
  const createInput = PromptPreviewRequestSchema.parse({
    projectId: sourceDesign.project_id,
    jewelryType: storedInput.jewelryType,
    metal: storedInput.metal,
    gemstones: storedInput.gemstones,
    style: storedInput.style,
    complexity: storedInput.complexity,
    variationOverrides: storedInput.variationOverrides,
    userNotes: storedInput.userNotes,
    pairStandardVersion: storedInput.pairStandardVersion,
  });

  const idempotentResult = await withIdempotency<RefineResponse>(
    env.SKYGEMS_DB,
    auth.tenantId,
    "refine_design",
    idempotencyKey,
    requestHash,
    async () => {
      const refinedDesignId = generatePrefixedId("dsn");
      const generationId = generatePrefixedId("gen");
      const promptAgentRun = await agentExecutor.run<PromptAgentOutput>("prompt-agent", {
        mode: "refine",
        projectId: sourceDesign.project_id,
        designId: refinedDesignId,
        input: createInput,
        sourceDesignId: sourceDesign.id,
        provider: promptProvider.active,
        refinementInstruction: payload.instruction,
      }, { env: { XAI_API_KEY: env.XAI_API_KEY } });
      const promptAgentOutput = PromptAgentOutputSchema.parse(promptAgentRun.output);
      const designDna = DesignDnaSchema.parse(promptAgentOutput.designDna);
      const promptSummary = `${buildPromptSummary(createInput)} refined`;
      const displayName = `${sourceDesign.display_name} Refined`;

      await executeStatement(
        env.SKYGEMS_DB,
        `INSERT INTO designs (
           id, tenant_id, project_id, created_by_user_id, parent_design_id, source_kind, selection_state,
           display_name, prompt_summary, prompt_input_json, design_dna_json,
           latest_pair_id, latest_spec_id, latest_technical_sheet_id, latest_svg_asset_id, latest_cad_job_id,
           latest_workflow_run_id, search_text, created_at, selected_at, updated_at, archived_at
         ) VALUES (?, ?, ?, ?, ?, 'refine', 'candidate', ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, NULL, ?, NULL)`,
        [
          refinedDesignId,
          auth.tenantId,
          sourceDesign.project_id,
          auth.userId,
          sourceDesign.id,
          displayName,
          promptSummary,
          asJsonText(createInput),
          asJsonText(designDna),
          buildSearchText(designDna, promptSummary, promptAgentOutput.normalizedInput.userNotes),
          createdAt,
          createdAt,
        ],
      );

      await executeStatement(
        env.SKYGEMS_DB,
        `INSERT INTO generations (
           id, tenant_id, project_id, design_id, requested_by_user_id, base_design_id, request_kind, status,
           pair_standard_version, request_json, request_hash, idempotency_key, prompt_agent_output_json,
           execution_mode, execution_source,
           error_code, error_message, created_at, started_at, completed_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, 'refine', 'queued', 'pair_v1', ?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, ?)`,
        [
          generationId,
          auth.tenantId,
          sourceDesign.project_id,
          refinedDesignId,
          auth.userId,
          sourceDesign.id,
          asJsonText(payload),
          requestHash,
          idempotencyKey,
          asJsonText(promptAgentOutput),
          initialExecution.mode,
          initialExecution.source,
          createdAt,
          createdAt,
        ],
      );

      await executeStatement(
        env.SKYGEMS_DB,
        `UPDATE projects
         SET updated_at = ?
         WHERE id = ?`,
        [createdAt, sourceDesign.project_id],
      );

      const queuePayload = GenerateQueuePayloadSchema.parse({
        schemaVersion: "generate_queue.v1",
        generationId,
        designId: refinedDesignId,
        projectId: sourceDesign.project_id,
        tenantId: auth.tenantId,
        requestedByUserId: auth.userId,
        idempotencyKey,
        requestHash,
        queuedAt: createdAt,
        input: {
          jewelryType: createInput.jewelryType,
          metal: createInput.metal,
          gemstones: createInput.gemstones,
          style: createInput.style,
          complexity: createInput.complexity,
          variationOverrides: createInput.variationOverrides,
          userNotes: createInput.userNotes,
          pairStandardVersion: createInput.pairStandardVersion,
        },
      });

      const dispatch = await dispatchGenerateExecution({
        request,
        env,
        ctx,
        payload: queuePayload,
      });

      return {
        status: dispatch.executionMode === "local" ? 202 : 202,
        body: RefineResponseSchema.parse({
          generationId,
          sourceDesignId: sourceDesign.id,
          refinedDesignId,
          status: "queued",
          createdAt,
        }),
        primaryResourceType: "generation",
        primaryResourceId: generationId,
      };
    },
  );

  return jsonResponse(idempotentResult.body, idempotentResult.status);
}

async function handleSpecStage(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  designId: string,
): Promise<Response> {
  const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, designId);
  const project = await requireProjectWriteAccess(env.SKYGEMS_DB, auth, design.project_id);
  const payload = await parseJsonBody(request, SpecRequestSchema);
  const promptProvider = resolvePromptProviderSelection(env);

  if (!design.latest_pair_id) {
    throw new HttpError(409, "conflict", "A completed generation pair is required before spec generation.");
  }

  if (design.latest_spec_id && !payload.forceRegenerate) {
    const workflow = await loadWorkflow(env.SKYGEMS_DB, design.latest_workflow_run_id);
    return jsonResponse(
      WorkflowStageResponseSchema.parse({
        workflowRunId: design.latest_workflow_run_id,
        designId: design.id,
        projectId: project.id,
        selectionState: design.selection_state,
        requestedTargetStage: "spec",
        currentStage: workflow?.current_stage ?? "spec",
        workflowStatus: workflow?.workflow_status ?? "succeeded",
        stageStatuses: stageStatusesFromDesign(design, workflow),
        latestSpecId: design.latest_spec_id,
        latestTechnicalSheetId: design.latest_technical_sheet_id,
        latestSvgAssetId: design.latest_svg_asset_id,
        latestCadJobId: design.latest_cad_job_id,
        updatedAt: workflow?.updated_at ?? design.updated_at,
      }),
    );
  }

  const latestGeneration = await loadLatestGenerationForDesign(env.SKYGEMS_DB, design.id, auth.tenantId);
  if (!latestGeneration) {
    throw new HttpError(409, "conflict", "Prompt agent output is required before spec generation.");
  }
  let promptAgentOutput: PromptAgentOutput;
  try {
    if (!latestGeneration.prompt_agent_output_json) {
      throw new Error("missing prompt agent output");
    }
    promptAgentOutput = PromptAgentOutputSchema.parse(
      JSON.parse(latestGeneration.prompt_agent_output_json),
    );
  } catch {
    promptAgentOutput = await rebuildPromptAgentOutputFromDesign(
      design,
      promptProvider.active,
    );
  }

  const workflowRunId = generatePrefixedId("wfr");
  const specId = generatePrefixedId("spc");
  const now = nowIso();
  const versionRow = await queryFirst<{ version: number }>(
    env.SKYGEMS_DB,
    `SELECT COALESCE(MAX(spec_version), 0) AS version
     FROM design_specs
     WHERE design_id = ? AND tenant_id = ?`,
    [design.id, auth.tenantId],
  );
  const specVersion = (versionRow?.version ?? 0) + 1;

  await executeStatement(
    env.SKYGEMS_DB,
    `INSERT INTO design_workflow_runs (
       id, tenant_id, project_id, design_id, requested_by_user_id, requested_target_stage, current_stage,
       workflow_status, spec_status, technical_sheet_status, svg_status, cad_status,
       latest_spec_id, latest_technical_sheet_id, latest_svg_asset_id, latest_cad_job_id,
       force_regenerate, last_error_code, last_error_message, created_at, started_at, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, 'spec', 'spec', 'running', 'running', 'not_requested', 'not_requested', 'not_requested', NULL, NULL, NULL, NULL, ?, NULL, NULL, ?, ?, NULL, ?)`,
    [
      workflowRunId,
      auth.tenantId,
      project.id,
      design.id,
      auth.userId,
      payload.forceRegenerate ? 1 : 0,
      now,
      now,
      now,
    ],
  );

  await executeStatement(
    env.SKYGEMS_DB,
    `INSERT INTO design_specs (
       id, tenant_id, project_id, design_id, workflow_run_id, source_pair_id, spec_version,
       status, spec_standard_version, agent_output_json, risk_flags_json, unknowns_json, created_at, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'running', 'spec_v1', NULL, '[]', '[]', ?, NULL, ?)`,
    [
      specId,
      auth.tenantId,
      project.id,
      design.id,
      workflowRunId,
      design.latest_pair_id,
      specVersion,
      now,
      now,
    ],
  );

  const specAgentRun = await agentExecutor.run<SpecAgentOutput>("spec-agent", {
    promptAgentOutput,
    pairId: design.latest_pair_id,
  }, { env: { XAI_API_KEY: env.XAI_API_KEY } });
  const specOutput = SpecAgentOutputSchema.parse(specAgentRun.output);
  const completedAt = nowIso();

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE design_specs
     SET status = 'succeeded',
         agent_output_json = ?,
         risk_flags_json = ?,
         unknowns_json = ?,
         completed_at = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      asJsonText(specOutput),
      asJsonText(specOutput.riskFlags),
      asJsonText(specOutput.unknowns),
      completedAt,
      completedAt,
      specId,
    ],
  );

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE design_workflow_runs
     SET current_stage = 'complete',
         workflow_status = 'succeeded',
         spec_status = 'succeeded',
         latest_spec_id = ?,
         completed_at = ?,
         updated_at = ?
     WHERE id = ?`,
    [specId, completedAt, completedAt, workflowRunId],
  );

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE designs
     SET latest_spec_id = ?,
         latest_workflow_run_id = ?,
         updated_at = ?
     WHERE id = ?`,
    [specId, workflowRunId, completedAt, design.id],
  );

  return jsonResponse(
    WorkflowStageResponseSchema.parse({
      workflowRunId,
      designId: design.id,
      projectId: project.id,
      selectionState: design.selection_state,
      requestedTargetStage: "spec",
      currentStage: "complete",
      workflowStatus: "succeeded",
      stageStatuses: {
        spec: "succeeded",
        technicalSheet: "not_requested",
        svg: "not_requested",
        cad: "not_requested",
      },
      latestSpecId: specId,
      latestTechnicalSheetId: null,
      latestSvgAssetId: null,
      latestCadJobId: null,
      updatedAt: completedAt,
    }),
  );
}

async function handleTechSheetStage(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  designId: string,
): Promise<Response> {
  const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, designId);
  const project = await requireProjectWriteAccess(env.SKYGEMS_DB, auth, design.project_id);
  const payload = await parseJsonBody(request, TechnicalSheetRequestSchema);

  if (!design.latest_spec_id) {
    throw new HttpError(409, "conflict", "A completed spec is required before technical sheet generation.");
  }

  if (design.latest_technical_sheet_id && !payload.forceRegenerate) {
    const workflow = await loadWorkflow(env.SKYGEMS_DB, design.latest_workflow_run_id);
    return jsonResponse(
      WorkflowStageResponseSchema.parse({
        workflowRunId: design.latest_workflow_run_id,
        designId: design.id,
        projectId: project.id,
        selectionState: design.selection_state,
        requestedTargetStage: "technical_sheet",
        currentStage: workflow?.current_stage ?? "technical_sheet",
        workflowStatus: workflow?.workflow_status ?? "succeeded",
        stageStatuses: stageStatusesFromDesign(design, workflow),
        latestSpecId: design.latest_spec_id,
        latestTechnicalSheetId: design.latest_technical_sheet_id,
        latestSvgAssetId: design.latest_svg_asset_id,
        latestCadJobId: design.latest_cad_job_id,
        updatedAt: workflow?.updated_at ?? design.updated_at,
      }),
    );
  }

  // Load the spec output
  const specOutput = await loadLatestSpec(env.SKYGEMS_DB, design.latest_spec_id);
  if (!specOutput) {
    throw new HttpError(409, "conflict", "Spec agent output is required before technical sheet generation.");
  }

  // Load design DNA
  const designDna = DesignDnaSchema.parse(JSON.parse(design.design_dna_json));

  const workflowRunId = generatePrefixedId("wfr");
  const techSheetId = generatePrefixedId("tch");
  const now = nowIso();
  const versionRow = await queryFirst<{ version: number }>(
    env.SKYGEMS_DB,
    `SELECT COALESCE(MAX(tech_version), 0) AS version
     FROM technical_sheets
     WHERE design_id = ? AND tenant_id = ?`,
    [design.id, auth.tenantId],
  );
  const techVersion = (versionRow?.version ?? 0) + 1;

  // Create workflow run
  await executeStatement(
    env.SKYGEMS_DB,
    `INSERT INTO design_workflow_runs (
       id, tenant_id, project_id, design_id, requested_by_user_id, requested_target_stage, current_stage,
       workflow_status, spec_status, technical_sheet_status, svg_status, cad_status,
       latest_spec_id, latest_technical_sheet_id, latest_svg_asset_id, latest_cad_job_id,
       force_regenerate, last_error_code, last_error_message, created_at, started_at, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, 'technical_sheet', 'technical_sheet', 'running', 'succeeded', 'running', 'not_requested', 'not_requested', ?, NULL, NULL, NULL, ?, NULL, NULL, ?, ?, NULL, ?)`,
    [
      workflowRunId,
      auth.tenantId,
      project.id,
      design.id,
      auth.userId,
      design.latest_spec_id,
      payload.forceRegenerate ? 1 : 0,
      now,
      now,
      now,
    ],
  );

  // Create technical_sheets row (running)
  await executeStatement(
    env.SKYGEMS_DB,
    `INSERT INTO technical_sheets (
       id, tenant_id, project_id, design_id, workflow_run_id, source_spec_id, tech_version,
       status, tech_standard_version, sheet_json, json_artifact_id, pdf_artifact_id, created_at, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'running', 'tech_v1', NULL, NULL, NULL, ?, NULL, ?)`,
    [
      techSheetId,
      auth.tenantId,
      project.id,
      design.id,
      workflowRunId,
      design.latest_spec_id,
      techVersion,
      now,
      now,
    ],
  );

  // Run tech-sheet agent
  const techSheetRun = await agentExecutor.run<TechSheetAgentOutput>("tech-sheet-agent", {
    specOutput,
    designDna,
    specId: design.latest_spec_id,
  }, { env: { XAI_API_KEY: env.XAI_API_KEY } });
  const techSheetOutput = TechSheetAgentOutputSchema.parse(techSheetRun.output);
  const completedAt = nowIso();

  // Update technical_sheets row with result
  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE technical_sheets
     SET status = 'succeeded',
         sheet_json = ?,
         completed_at = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      asJsonText(techSheetOutput),
      completedAt,
      completedAt,
      techSheetId,
    ],
  );

  // Update workflow run
  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE design_workflow_runs
     SET current_stage = 'complete',
         workflow_status = 'succeeded',
         technical_sheet_status = 'succeeded',
         latest_technical_sheet_id = ?,
         completed_at = ?,
         updated_at = ?
     WHERE id = ?`,
    [techSheetId, completedAt, completedAt, workflowRunId],
  );

  // Update designs row
  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE designs
     SET latest_technical_sheet_id = ?,
         latest_workflow_run_id = ?,
         updated_at = ?
     WHERE id = ?`,
    [techSheetId, workflowRunId, completedAt, design.id],
  );

  return jsonResponse(
    WorkflowStageResponseSchema.parse({
      workflowRunId,
      designId: design.id,
      projectId: project.id,
      selectionState: design.selection_state,
      requestedTargetStage: "technical_sheet",
      currentStage: "complete",
      workflowStatus: "succeeded",
      stageStatuses: {
        spec: "succeeded",
        technicalSheet: "succeeded",
        svg: "not_requested",
        cad: "not_requested",
      },
      latestSpecId: design.latest_spec_id,
      latestTechnicalSheetId: techSheetId,
      latestSvgAssetId: null,
      latestCadJobId: null,
      updatedAt: completedAt,
    }),
  );
}

async function handleSvgStage(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  designId: string,
): Promise<Response> {
  const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, designId);
  const project = await requireProjectWriteAccess(env.SKYGEMS_DB, auth, design.project_id);
  const payload = await parseJsonBody(request, SvgRequestSchema);

  if (!design.latest_technical_sheet_id) {
    throw new HttpError(409, "conflict", "A completed technical sheet is required before SVG generation.");
  }

  if (!design.latest_spec_id) {
    throw new HttpError(409, "conflict", "A completed spec is required before SVG generation.");
  }

  if (design.latest_svg_asset_id && !payload.forceRegenerate) {
    const workflow = await loadWorkflow(env.SKYGEMS_DB, design.latest_workflow_run_id);
    return jsonResponse(
      WorkflowStageResponseSchema.parse({
        workflowRunId: design.latest_workflow_run_id,
        designId: design.id,
        projectId: project.id,
        selectionState: design.selection_state,
        requestedTargetStage: "svg",
        currentStage: workflow?.current_stage ?? "svg",
        workflowStatus: workflow?.workflow_status ?? "succeeded",
        stageStatuses: stageStatusesFromDesign(design, workflow),
        latestSpecId: design.latest_spec_id,
        latestTechnicalSheetId: design.latest_technical_sheet_id,
        latestSvgAssetId: design.latest_svg_asset_id,
        latestCadJobId: design.latest_cad_job_id,
        updatedAt: workflow?.updated_at ?? design.updated_at,
      }),
    );
  }

  const techSheetOutput = await loadLatestTechSheet(env.SKYGEMS_DB, design.latest_technical_sheet_id);
  if (!techSheetOutput) {
    throw new HttpError(409, "conflict", "Tech sheet agent output is required before SVG generation.");
  }

  const designDna = DesignDnaSchema.parse(JSON.parse(design.design_dna_json));

  const workflowRunId = generatePrefixedId("wfr");
  const svgAssetId = generatePrefixedId("svg");
  const now = nowIso();
  const versionRow = await queryFirst<{ version: number }>(
    env.SKYGEMS_DB,
    `SELECT COALESCE(MAX(svg_version), 0) AS version
     FROM svg_assets
     WHERE design_id = ? AND tenant_id = ?`,
    [design.id, auth.tenantId],
  );
  const svgVersion = (versionRow?.version ?? 0) + 1;

  await executeStatement(
    env.SKYGEMS_DB,
    `INSERT INTO design_workflow_runs (
       id, tenant_id, project_id, design_id, requested_by_user_id, requested_target_stage, current_stage,
       workflow_status, spec_status, technical_sheet_status, svg_status, cad_status,
       latest_spec_id, latest_technical_sheet_id, latest_svg_asset_id, latest_cad_job_id,
       force_regenerate, last_error_code, last_error_message, created_at, started_at, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, 'svg', 'svg', 'running', 'succeeded', 'succeeded', 'running', 'not_requested', ?, ?, NULL, NULL, ?, NULL, NULL, ?, ?, NULL, ?)`,
    [
      workflowRunId, auth.tenantId, project.id, design.id, auth.userId,
      design.latest_spec_id, design.latest_technical_sheet_id,
      payload.forceRegenerate ? 1 : 0, now, now, now,
    ],
  );

  await executeStatement(
    env.SKYGEMS_DB,
    `INSERT INTO svg_assets (
       id, tenant_id, project_id, design_id, workflow_run_id, source_technical_sheet_id, svg_version,
       status, svg_standard_version, agent_output_json, manifest_json, views_json, created_at, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'running', 'svg_v1', NULL, NULL, NULL, ?, NULL, ?)`,
    [
      svgAssetId, auth.tenantId, project.id, design.id, workflowRunId,
      design.latest_technical_sheet_id, svgVersion, now, now,
    ],
  );

  const svgAgentRun = await agentExecutor.run<SvgAgentOutput>("svg-agent", {
    techSheetOutput, designDna,
    specId: design.latest_spec_id,
    techSheetId: design.latest_technical_sheet_id,
  }, { env: { XAI_API_KEY: env.XAI_API_KEY } });
  const svgOutput = SvgAgentOutputSchema.parse(svgAgentRun.output);
  const completedAt = nowIso();

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE svg_assets
     SET status = 'succeeded', agent_output_json = ?, manifest_json = ?, views_json = ?,
         completed_at = ?, updated_at = ?
     WHERE id = ?`,
    [asJsonText(svgOutput), asJsonText(svgOutput.manifestJson), asJsonText(svgOutput.views), completedAt, completedAt, svgAssetId],
  );

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE design_workflow_runs
     SET current_stage = 'complete', workflow_status = 'succeeded', svg_status = 'succeeded',
         latest_svg_asset_id = ?, completed_at = ?, updated_at = ?
     WHERE id = ?`,
    [svgAssetId, completedAt, completedAt, workflowRunId],
  );

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE designs SET latest_svg_asset_id = ?, latest_workflow_run_id = ?, updated_at = ? WHERE id = ?`,
    [svgAssetId, workflowRunId, completedAt, design.id],
  );

  return jsonResponse(
    WorkflowStageResponseSchema.parse({
      workflowRunId, designId: design.id, projectId: project.id,
      selectionState: design.selection_state,
      requestedTargetStage: "svg", currentStage: "complete", workflowStatus: "succeeded",
      stageStatuses: { spec: "succeeded", technicalSheet: "succeeded", svg: "succeeded", cad: "not_requested" },
      latestSpecId: design.latest_spec_id, latestTechnicalSheetId: design.latest_technical_sheet_id,
      latestSvgAssetId: svgAssetId, latestCadJobId: null, updatedAt: completedAt,
    }),
  );
}

async function handleCadStage(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  designId: string,
): Promise<Response> {
  const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, designId);
  const project = await requireProjectWriteAccess(env.SKYGEMS_DB, auth, design.project_id);
  const payload = await parseJsonBody(request, CadRequestSchema);

  if (!design.latest_svg_asset_id) {
    throw new HttpError(409, "conflict", "A completed SVG asset is required before CAD generation.");
  }
  if (!design.latest_spec_id) {
    throw new HttpError(409, "conflict", "A completed spec is required before CAD generation.");
  }
  if (!design.latest_technical_sheet_id) {
    throw new HttpError(409, "conflict", "A completed technical sheet is required before CAD generation.");
  }

  if (design.latest_cad_job_id && !payload.forceRegenerate) {
    const workflow = await loadWorkflow(env.SKYGEMS_DB, design.latest_workflow_run_id);
    return jsonResponse(
      WorkflowStageResponseSchema.parse({
        workflowRunId: design.latest_workflow_run_id,
        designId: design.id, projectId: project.id,
        selectionState: design.selection_state,
        requestedTargetStage: "cad",
        currentStage: workflow?.current_stage ?? "cad",
        workflowStatus: workflow?.workflow_status ?? "succeeded",
        stageStatuses: stageStatusesFromDesign(design, workflow),
        latestSpecId: design.latest_spec_id,
        latestTechnicalSheetId: design.latest_technical_sheet_id,
        latestSvgAssetId: design.latest_svg_asset_id,
        latestCadJobId: design.latest_cad_job_id,
        updatedAt: workflow?.updated_at ?? design.updated_at,
      }),
    );
  }

  const svgAssetRow = await queryFirst<{ agent_output_json: string | null }>(
    env.SKYGEMS_DB,
    `SELECT agent_output_json FROM svg_assets WHERE id = ?`,
    [design.latest_svg_asset_id],
  );
  if (!svgAssetRow?.agent_output_json) {
    throw new HttpError(409, "conflict", "SVG agent output is required before CAD generation.");
  }
  const svgAgentOutput = SvgAgentOutputSchema.parse(JSON.parse(svgAssetRow.agent_output_json));

  const specOutput = await loadLatestSpec(env.SKYGEMS_DB, design.latest_spec_id);
  if (!specOutput) {
    throw new HttpError(409, "conflict", "Spec agent output is required before CAD generation.");
  }

  const designDna = DesignDnaSchema.parse(JSON.parse(design.design_dna_json));

  const workflowRunId = generatePrefixedId("wfr");
  const cadJobId = generatePrefixedId("cad");
  const now = nowIso();
  const versionRow = await queryFirst<{ version: number }>(
    env.SKYGEMS_DB,
    `SELECT COALESCE(MAX(cad_version), 0) AS version
     FROM cad_jobs
     WHERE design_id = ? AND tenant_id = ?`,
    [design.id, auth.tenantId],
  );
  const cadVersion = (versionRow?.version ?? 0) + 1;

  await executeStatement(
    env.SKYGEMS_DB,
    `INSERT INTO design_workflow_runs (
       id, tenant_id, project_id, design_id, requested_by_user_id, requested_target_stage, current_stage,
       workflow_status, spec_status, technical_sheet_status, svg_status, cad_status,
       latest_spec_id, latest_technical_sheet_id, latest_svg_asset_id, latest_cad_job_id,
       force_regenerate, last_error_code, last_error_message, created_at, started_at, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, 'cad', 'cad', 'running', 'succeeded', 'succeeded', 'succeeded', 'running', ?, ?, ?, NULL, ?, NULL, NULL, ?, ?, NULL, ?)`,
    [
      workflowRunId, auth.tenantId, project.id, design.id, auth.userId,
      design.latest_spec_id, design.latest_technical_sheet_id, design.latest_svg_asset_id,
      payload.forceRegenerate ? 1 : 0, now, now, now,
    ],
  );

  await executeStatement(
    env.SKYGEMS_DB,
    `INSERT INTO cad_jobs (
       id, tenant_id, project_id, design_id, workflow_run_id, source_svg_asset_id, cad_version,
       status, requested_formats_json, agent_output_json, blockers_json, created_at, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'running', ?, NULL, '[]', ?, NULL, ?)`,
    [
      cadJobId, auth.tenantId, project.id, design.id, workflowRunId,
      design.latest_svg_asset_id, cadVersion, asJsonText(payload.formats), now, now,
    ],
  );

  const cadPrepRun = await agentExecutor.run<CadPrepAgentOutput>("cad-prep-agent", {
    svgAgentOutput, specOutput, designDna,
    specId: design.latest_spec_id,
    techSheetId: design.latest_technical_sheet_id,
    svgAssetId: design.latest_svg_asset_id,
    requestedFormats: payload.formats,
  }, { env: { XAI_API_KEY: env.XAI_API_KEY } });
  const cadOutput = CadPrepAgentOutputSchema.parse(cadPrepRun.output);
  const completedAt = nowIso();

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE cad_jobs
     SET status = 'succeeded', agent_output_json = ?, blockers_json = ?,
         completed_at = ?, updated_at = ?
     WHERE id = ?`,
    [asJsonText(cadOutput), asJsonText(cadOutput.blockers), completedAt, completedAt, cadJobId],
  );

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE design_workflow_runs
     SET current_stage = 'complete', workflow_status = 'succeeded', cad_status = 'succeeded',
         latest_cad_job_id = ?, completed_at = ?, updated_at = ?
     WHERE id = ?`,
    [cadJobId, completedAt, completedAt, workflowRunId],
  );

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE designs SET latest_cad_job_id = ?, latest_workflow_run_id = ?, updated_at = ? WHERE id = ?`,
    [cadJobId, workflowRunId, completedAt, design.id],
  );

  return jsonResponse(
    WorkflowStageResponseSchema.parse({
      workflowRunId, designId: design.id, projectId: project.id,
      selectionState: design.selection_state,
      requestedTargetStage: "cad", currentStage: "complete", workflowStatus: "succeeded",
      stageStatuses: { spec: "succeeded", technicalSheet: "succeeded", svg: "succeeded", cad: "succeeded" },
      latestSpecId: design.latest_spec_id, latestTechnicalSheetId: design.latest_technical_sheet_id,
      latestSvgAssetId: design.latest_svg_asset_id, latestCadJobId: cadJobId, updatedAt: completedAt,
    }),
  );
}

async function handleCopilot(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  designId: string,
): Promise<Response> {
  const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, designId);
  await requireProjectAccess(env.SKYGEMS_DB, auth, design.project_id);

  const body = await request.json() as { message?: string };
  if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
    throw new HttpError(400, "invalid_request", "Request body must include a non-empty 'message' string.");
  }

  const designDna = DesignDnaSchema.parse(JSON.parse(design.design_dna_json));

  const copilotResult = await agentExecutor.run<CopilotAgentOutput>("copilot-agent", {
    message: body.message.trim(),
    designContext: {
      designId: design.id,
      displayName: design.display_name,
      jewelryType: designDna.jewelryType,
      metal: designDna.metal,
      gemstones: designDna.gemstones,
      style: designDna.style,
      selectionState: design.selection_state,
      hasSpec: Boolean(design.latest_spec_id),
      hasTechnicalSheet: Boolean(design.latest_technical_sheet_id),
    },
  }, { env: { XAI_API_KEY: env.XAI_API_KEY } });

  return jsonResponse(copilotResult.output);
}

async function handleGenerationStatus(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  generationId: string,
) {
  const origin = resolvePublicOrigin(request);
  const generation = await queryFirst<GenerationRow>(
    env.SKYGEMS_DB,
    `SELECT *
     FROM generations
     WHERE id = ? AND tenant_id = ?`,
    [generationId, auth.tenantId],
  );

  if (!generation) {
    throw new HttpError(404, "not_found", "Generation was not found for this tenant.");
  }

  const project = await requireProjectAccess(env.SKYGEMS_DB, auth, generation.project_id);
  const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, generation.design_id);
  const workflow = await loadWorkflow(env.SKYGEMS_DB, design.latest_workflow_run_id);
  const pair = await loadPairById(
    env,
    env.SKYGEMS_DB,
    design.latest_pair_id,
    design.selection_state,
    origin,
  );

  const response = GenerationStatusResponseSchema.parse({
    generationId: generation.id,
    designId: generation.design_id,
    projectId: generation.project_id,
    requestKind: generation.request_kind,
    status: generation.status,
    executionMode: generation.execution_mode,
    executionSource: generation.execution_source,
    pairStandardVersion: generation.pair_standard_version,
    createdAt: generation.created_at,
    startedAt: generation.started_at,
    completedAt: generation.completed_at,
    error: buildGenerationError(generation),
    pair,
    projectSelectedDesignId: project.selected_design_id,
    canSelect: canSelectDesign(design),
    design: await buildDesignSummary(env, env.SKYGEMS_DB, design, workflow, origin, auth.userId),
  });

  return jsonResponse(response);
}

async function handleGallerySearch(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  const payload = await parseJsonBody(request, GallerySearchRequestSchema);
  const whereClauses = [
    "tenant_id = ?",
    "project_id IN (SELECT project_id FROM project_memberships WHERE user_id = ?)",
  ];
  const bindings: Array<string | number | null> = [auth.tenantId, auth.userId];

  if (payload.projectId) {
    await requireProjectAccess(env.SKYGEMS_DB, auth, payload.projectId);
    whereClauses.push("project_id = ?");
    bindings.push(payload.projectId);
  }

  if (payload.ownerScope === "mine") {
    whereClauses.push("created_by_user_id = ?");
    bindings.push(auth.userId);
  }

  if (payload.query) {
    whereClauses.push("search_text LIKE ?");
    bindings.push(`%${payload.query.toLowerCase()}%`);
  }

  if (payload.updatedAfter) {
    whereClauses.push("updated_at > ?");
    bindings.push(payload.updatedAfter);
  }

  if (payload.filters.jewelryTypes?.length) {
    whereClauses.push(
      `json_extract(design_dna_json, '$.jewelryType') IN (${payload.filters.jewelryTypes
        .map(() => "?")
        .join(", ")})`,
    );
    bindings.push(...payload.filters.jewelryTypes);
  }

  if (payload.filters.metals?.length) {
    whereClauses.push(
      `json_extract(design_dna_json, '$.metal') IN (${payload.filters.metals.map(() => "?").join(", ")})`,
    );
    bindings.push(...payload.filters.metals);
  }

  if (payload.filters.styles?.length) {
    whereClauses.push(
      `json_extract(design_dna_json, '$.style') IN (${payload.filters.styles.map(() => "?").join(", ")})`,
    );
    bindings.push(...payload.filters.styles);
  }

  if (payload.filters.selectionStates?.length) {
    whereClauses.push(
      `selection_state IN (${payload.filters.selectionStates.map(() => "?").join(", ")})`,
    );
    bindings.push(...payload.filters.selectionStates);
  }

  if (payload.filters.readiness?.length) {
    const readinessClauses = payload.filters.readiness.map((readiness) => {
      switch (readiness) {
        case "pair_ready":
          return "latest_pair_id IS NOT NULL";
        case "spec_ready":
          return "latest_spec_id IS NOT NULL";
        case "technical_sheet_ready":
          return "latest_technical_sheet_id IS NOT NULL";
        case "svg_ready":
          return "latest_svg_asset_id IS NOT NULL";
        case "cad_ready":
          return "latest_cad_job_id IS NOT NULL";
      }
    });
    whereClauses.push(`(${readinessClauses.join(" OR ")})`);
  }

  const whereSql = whereClauses.join(" AND ");
  const sortSql =
    payload.sort === "selected"
      ? "ORDER BY COALESCE(selected_at, updated_at) DESC"
      : payload.sort === "updated"
        ? "ORDER BY updated_at DESC"
        : "ORDER BY created_at DESC";
  const offset = (payload.page - 1) * payload.pageSize;

  const totalRow = await queryFirst<CountRow>(
    env.SKYGEMS_DB,
    `SELECT COUNT(*) AS count FROM designs WHERE ${whereSql}`,
    bindings,
  );

  const designs = await queryAll<DesignRow>(
    env.SKYGEMS_DB,
    `SELECT *
     FROM designs
     WHERE ${whereSql}
     ${sortSql}
     LIMIT ? OFFSET ?`,
    [...bindings, payload.pageSize, offset],
  );

  const items: GallerySearchResponse["items"] = [];
  const origin = resolvePublicOrigin(request);
  for (const design of designs) {
    const workflow = await loadWorkflow(env.SKYGEMS_DB, design.latest_workflow_run_id);
    items.push(await buildDesignSummary(env, env.SKYGEMS_DB, design, workflow, origin, auth.userId));
  }

  return jsonResponse(
    GallerySearchResponseSchema.parse({
      page: payload.page,
      pageSize: payload.pageSize,
      total: totalRow?.count ?? 0,
      items,
    }),
  );
}

async function handleProject(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  projectId: string,
): Promise<Response> {
  const project = await requireProjectAccess(env.SKYGEMS_DB, auth, projectId);
  const response = await buildProjectResponse(
    env,
    env.SKYGEMS_DB,
    project,
    resolvePublicOrigin(request),
    auth.userId,
  );
  return jsonResponse(ProjectResponseSchema.parse(response));
}

async function handleProjectDesigns(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  projectId: string,
): Promise<Response> {
  const project = await requireProjectAccess(env.SKYGEMS_DB, auth, projectId);
  const ownerScope = ProjectDesignsQuerySchema.parse({
    ownerScope: new URL(request.url).searchParams.get("ownerScope") ?? undefined,
  }).ownerScope;
  const response = await buildProjectDesignsResponse(
    env,
    env.SKYGEMS_DB,
    project,
    resolvePublicOrigin(request),
    auth.userId,
    ownerScope,
  );
  return jsonResponse(ProjectDesignsResponseSchema.parse(response));
}

async function handleDesignDetail(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  designId: string,
): Promise<Response> {
  const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, designId);
  const project = await requireProjectAccess(env.SKYGEMS_DB, auth, design.project_id);
  const response = await buildDesignDetailResponse(
    env,
    env.SKYGEMS_DB,
    project,
    design,
    resolvePublicOrigin(request),
    auth.userId,
  );
  return jsonResponse(DesignDetailResponseSchema.parse(response));
}

async function handleSelectDesign(
  request: Request,
  env: ApiEnv,
  auth: AuthContext,
  designId: string,
): Promise<Response> {
  const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, designId);
  const project = await requireProjectWriteAccess(env.SKYGEMS_DB, auth, design.project_id);
  const selection = await selectProjectDesign(env.SKYGEMS_DB, {
    tenantId: auth.tenantId,
    projectId: project.id,
    designId: design.id,
    requirePair: true,
  });
  const refreshedProject = await requireProject(env.SKYGEMS_DB, auth.tenantId, project.id);
  const refreshedDesign = await requireDesign(env.SKYGEMS_DB, auth.tenantId, design.id);
  const detail = await buildDesignDetailResponse(
    env,
    env.SKYGEMS_DB,
    refreshedProject,
    refreshedDesign,
    resolvePublicOrigin(request),
    auth.userId,
  );

  return jsonResponse(
    DesignSelectResponseSchema.parse({
      ...detail,
      previousSelectedDesignId: selection.previousSelectedDesignId,
      selectionChanged: selection.selectionChanged,
    }),
  );
}

function stubbedRoute(message: string): Response {
  return errorResponse(501, "workflow_failed", message);
}

async function routeRequest(
  request: Request,
  env: ApiEnv,
  ctx: ExecutionContext | undefined,
): Promise<Response> {
  const url = new URL(request.url);
  const artifactImageMatch = url.pathname.match(
    /^\/v1\/artifacts\/(art_[0-9A-HJKMNP-TV-Z]{26})\/image$/,
  );

  if (request.method === "GET" && artifactImageMatch && url.searchParams.get("token")) {
    const artifactId = artifactImageMatch[1];
    const token = url.searchParams.get("token")!;
    const access = await verifyArtifactAccessToken(token, env, {
      allowLocalFallback: isLocalDevelopmentRequest(request),
    });

    const artifact = await queryFirst<{
      project_id: string;
      tenant_id: string;
      r2_key: string;
      content_type: string;
    }>(
      env.SKYGEMS_DB,
      `SELECT project_id, tenant_id, r2_key, content_type
       FROM artifacts
       WHERE id = ?`,
      [artifactId],
    );

    if (!artifact || !artifact.r2_key) {
      return errorResponse(404, "not_found", "Artifact not found.");
    }

    if (
      access.artifactId !== artifactId ||
      access.projectId !== artifact.project_id ||
      access.tenantId !== artifact.tenant_id
    ) {
      throw new HttpError(403, "forbidden", "Artifact access token scope mismatch.");
    }

    const object = await env.SKYGEMS_ARTIFACTS.get(artifact.r2_key);
    if (!object) {
      return errorResponse(404, "not_found", "Artifact file not found in storage.");
    }

    return new Response(await object.arrayBuffer(), {
      headers: {
        "Content-Type": artifact.content_type || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  }

  if (request.method === "POST" && url.pathname === "/v1/dev/login") {
    if (!isDevBootstrapEnabled(request, env)) {
      throw new HttpError(404, "not_found", "Local dev login is not enabled for this environment.");
    }

    const payload = await parseJsonBody(request, DevLoginRequestSchema);
    const account = resolveLocalDevAccount(payload.username, payload.password);
    if (!account) {
      throw new HttpError(401, "unauthorized", "Invalid local development credentials.");
    }

    const bootstrap = await ensureDevBootstrap(env, {
      tenantSlug: account.tenantSlug,
      tenantName: account.tenantName,
      email: account.email,
      displayName: account.displayName,
      projectName: account.projectName,
      projectDescription: account.projectDescription,
    });

    return jsonResponse(
      DevLoginResponseSchema.parse({
        mode: "dev_bootstrap",
        sessionToken: bootstrap.sessionToken,
        sessionExpiresAt: bootstrap.sessionExpiresAt,
        tenant: {
          id: bootstrap.auth.tenantId,
          slug: bootstrap.auth.tenantSlug,
          name: bootstrap.auth.tenantName,
        },
        user: {
          id: bootstrap.auth.userId,
          email: bootstrap.auth.email,
          displayName: bootstrap.auth.displayName,
          authSubject: bootstrap.auth.authSubject,
        },
        project: {
          id: bootstrap.project.id,
          name: bootstrap.project.name,
          description: bootstrap.project.description,
          status: bootstrap.project.status,
          createdAt: bootstrap.project.created_at,
          updatedAt: bootstrap.project.updated_at,
        },
        created: bootstrap.created,
      }),
    );
  }

  if (request.method === "POST" && url.pathname === "/v1/dev/bootstrap") {
    if (!isDevBootstrapEnabled(request, env)) {
      throw new HttpError(404, "not_found", "Dev bootstrap is not enabled for this environment.");
    }

    const payload = await parseJsonBody(request, DevBootstrapRequestSchema);
    if (requiresExplicitDevBootstrapIdentity(request, env) && !payload.email?.trim()) {
      throw new HttpError(
        400,
        "invalid_request",
        "Dev bootstrap now requires an explicit email so local authentication cannot be bypassed implicitly.",
      );
    }
    const bootstrap = await ensureDevBootstrap(env, payload);

    return jsonResponse(
      DevBootstrapResponseSchema.parse({
        mode: "dev_bootstrap",
        sessionToken: bootstrap.sessionToken,
        sessionExpiresAt: bootstrap.sessionExpiresAt,
        tenant: {
          id: bootstrap.auth.tenantId,
          slug: bootstrap.auth.tenantSlug,
          name: bootstrap.auth.tenantName,
        },
        user: {
          id: bootstrap.auth.userId,
          email: bootstrap.auth.email,
          displayName: bootstrap.auth.displayName,
          authSubject: bootstrap.auth.authSubject,
        },
        project: {
          id: bootstrap.project.id,
          name: bootstrap.project.name,
          description: bootstrap.project.description,
          status: bootstrap.project.status,
          createdAt: bootstrap.project.created_at,
          updatedAt: bootstrap.project.updated_at,
        },
        created: bootstrap.created,
      }),
    );
  }

  const identity = await resolveAuthContext(request, env);
  const { auth } = await ensureTenantAndUser(env.SKYGEMS_DB, identity);

  if (request.method === "GET" && url.pathname === "/v1/auth/session") {
    return jsonResponse(await buildAuthSessionResponse(env.SKYGEMS_DB, auth));
  }

  if (request.method === "POST" && url.pathname === "/v1/prompt-preview") {
    return handlePromptPreview(request, env, auth);
  }

  if (request.method === "POST" && url.pathname === "/v1/prompt-enhance") {
    return handlePromptEnhance(request, env, auth);
  }

  if (request.method === "POST" && url.pathname === "/v1/generate-design") {
    return handleGenerateDesign(request, env, auth, ctx);
  }

  const generationMatch = url.pathname.match(/^\/v1\/generations\/(gen_[0-9A-HJKMNP-TV-Z]{26})$/);
  if (request.method === "GET" && generationMatch) {
    return handleGenerationStatus(request, env, auth, generationMatch[1]);
  }

  const projectMatch = url.pathname.match(/^\/v1\/projects\/(prj_[0-9A-HJKMNP-TV-Z]{26})$/);
  if (request.method === "GET" && projectMatch) {
    return handleProject(request, env, auth, ProjectIdSchema.parse(projectMatch[1]));
  }

  const projectDesignsMatch = url.pathname.match(
    /^\/v1\/projects\/(prj_[0-9A-HJKMNP-TV-Z]{26})\/designs$/,
  );
  if (request.method === "GET" && projectDesignsMatch) {
    return handleProjectDesigns(request, env, auth, ProjectIdSchema.parse(projectDesignsMatch[1]));
  }

  if (request.method === "POST" && url.pathname === "/v1/gallery/search") {
    return handleGallerySearch(request, env, auth);
  }

  const designMatch = url.pathname.match(/^\/v1\/designs\/(dsn_[0-9A-HJKMNP-TV-Z]{26})$/);
  if (request.method === "GET" && designMatch) {
    return handleDesignDetail(request, env, auth, DesignIdSchema.parse(designMatch[1]));
  }

  const designSelectMatch = url.pathname.match(
    /^\/v1\/designs\/(dsn_[0-9A-HJKMNP-TV-Z]{26})\/select$/,
  );
  if (request.method === "POST" && designSelectMatch) {
    return handleSelectDesign(request, env, auth, DesignIdSchema.parse(designSelectMatch[1]));
  }

  const refineMatch = url.pathname.match(/^\/v1\/designs\/(dsn_[0-9A-HJKMNP-TV-Z]{26})\/refine$/);
  if (request.method === "POST" && refineMatch) {
    return handleRefineDesign(
      request,
      env,
      auth,
      DesignIdSchema.parse(refineMatch[1]),
      ctx,
    );
  }

  const downstreamMatch = url.pathname.match(
    /^\/v1\/designs\/(dsn_[0-9A-HJKMNP-TV-Z]{26})\/(spec|technical-sheet|svg|cad)$/,
  );
  if (request.method === "POST" && downstreamMatch) {
    const design = await requireDesign(
      env.SKYGEMS_DB,
      auth.tenantId,
      DesignIdSchema.parse(downstreamMatch[1]),
    );
    await requireProjectWriteAccess(env.SKYGEMS_DB, auth, design.project_id);
    if (downstreamMatch[2] === "spec") {
      return handleSpecStage(request, env, auth, design.id);
    }
    if (downstreamMatch[2] === "technical-sheet") {
      return handleTechSheetStage(request, env, auth, design.id);
    }
    if (downstreamMatch[2] === "svg") {
      return handleSvgStage(request, env, auth, design.id);
    }
    if (downstreamMatch[2] === "cad") {
      return handleCadStage(request, env, auth, design.id);
    }
    return stubbedRoute(
      "Unknown downstream workflow stage.",
    );
  }

  // ── AI Copilot ──
  const copilotMatch = url.pathname.match(
    /^\/v1\/designs\/(dsn_[0-9A-HJKMNP-TV-Z]{26})\/copilot$/,
  );
  if (request.method === "POST" && copilotMatch) {
    return handleCopilot(request, env, auth, DesignIdSchema.parse(copilotMatch[1]));
  }

  // ── Serve artifact images from R2 ──
  if (request.method === "GET" && artifactImageMatch) {
    const artifactId = artifactImageMatch[1];
    const artifact = await queryFirst<{
      project_id: string;
      tenant_id: string;
      r2_key: string;
      content_type: string;
    }>(
      env.SKYGEMS_DB,
      `SELECT project_id, tenant_id, r2_key, content_type
       FROM artifacts
       WHERE id = ? AND tenant_id = ?`,
      [artifactId, auth.tenantId],
    );

    if (!artifact || !artifact.r2_key) {
      return errorResponse(404, "not_found", "Artifact not found.");
    }

    await requireProjectAccess(env.SKYGEMS_DB, auth, artifact.project_id);

    const object = await env.SKYGEMS_ARTIFACTS.get(artifact.r2_key);
    if (!object) {
      return errorResponse(404, "not_found", "Artifact image not found in storage.");
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": artifact.content_type || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return errorResponse(404, "not_found", "No matching v1 route was found.");
}

type DesignPipelineWorkflowPayload = {
  designId: string;
  targetStage: string;
};

export class DesignPipelineWorkflow extends WorkflowEntrypoint<Env, DesignPipelineWorkflowPayload> {
  async run(event: WorkflowEvent<DesignPipelineWorkflowPayload>, step: WorkflowStep) {
    return step.do("phase-2a-foundation-stub", async () => ({
      workflow: "design-pipeline",
      designId: event.payload.designId,
      targetStage: event.payload.targetStage,
      status: "stubbed",
    }));
  }
}

async function handleQuickGenerate(request: Request, env: ApiEnv): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!isDevBootstrapEnabled(request, env)) {
    return Response.json(
      { error: "Quick generate is available only in local/dev bootstrap environments." },
      { status: 404, headers: corsHeaders },
    );
  }

  const body = await request.json() as { prompt?: string };
  if (!body.prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400, headers: corsHeaders });
  }

  const apiKey = env.XAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: "XAI_API_KEY not configured" }, { status: 500, headers: corsHeaders });
  }

  const xaiResponse = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-imagine-image-pro",
      prompt: body.prompt,
      n: 1,
      response_format: "url",
    }),
  });

  if (!xaiResponse.ok) {
    const errText = await xaiResponse.text().catch(() => "");
    return Response.json(
      { error: `xAI API error (${xaiResponse.status}): ${errText.slice(0, 200)}` },
      { status: 502, headers: corsHeaders },
    );
  }

  const result = await xaiResponse.json() as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };

  const imageData = result.data?.[0];
  if (!imageData) {
    return Response.json({ error: "xAI returned no image" }, { status: 502, headers: corsHeaders });
  }

  const imageUrl = imageData.url ?? (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : null);
  if (!imageUrl) {
    return Response.json({ error: "No image URL in response" }, { status: 502, headers: corsHeaders });
  }

  return Response.json({ imageUrl }, { headers: corsHeaders });
}

export default {
  async fetch(request: Request, env: ApiEnv, ctx: ExecutionContext): Promise<Response> {
    // Simple quick-generate endpoint for the prototype UI (no auth needed)
    const url = new URL(request.url);
    if (url.pathname === "/api/quick-generate") {
      return handleQuickGenerate(request, env);
    }

    try {
      return await routeRequest(request, env, ctx);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async queue(batch: MessageBatch<unknown>, env: ApiEnv): Promise<void> {
    for (const message of batch.messages) {
      if (batch.queue !== "skygems-generate") {
        message.ack();
        continue;
      }

      const result = await runGenerateExecution(env, message.body);
      if (!result.ok) {
        console.error("SkyGems queued generation execution failed.", result.error);
      }

      message.ack();
    }
  },
};
