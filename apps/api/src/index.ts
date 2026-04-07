import {
  ArtifactPublicSchema,
  buildDesignDisplayName,
  buildDesignDna,
  buildPromptBundle,
  buildPromptPreviewWithOptions,
  buildPromptSummary,
  buildSearchText,
  CadJobIdSchema,
  DevBootstrapRequestSchema,
  DevBootstrapResponseSchema,
  DesignDetailResponseSchema,
  DesignDnaSchema,
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
  ProjectDesignsResponseSchema,
  ProjectResponseSchema,
  PromptAgentOutputSchema,
  PromptPreviewRequestSchema,
  PromptPreviewResponseSchema,
  RefineRequestSchema,
  RefineResponseSchema,
  SpecQueuePayloadSchema,
  StageStatusesSchema,
  WorkflowStageResponseSchema,
  generatePrefixedId,
  type ArtifactPublic,
  type GallerySearchResponse,
  type GenerateDesignResponse,
  type GenerationStatusResponse,
  type ProjectResponse,
  type StageStatuses,
} from "@skygems/shared";
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

import { ensureTenantAndUser, resolveAuthContext, type AuthContext } from "./lib/auth.ts";
import { ensureDevBootstrap } from "./lib/bootstrap.ts";
import { selectProjectDesign } from "./lib/design-selection.ts";
import { asJsonText, executeStatement, nowIso, queryAll, queryFirst } from "./lib/d1.ts";
import { dispatchGenerateExecution, runGenerateExecution } from "./lib/generation.ts";
import { computeRequestHash, requireIdempotencyKey, withIdempotency } from "./lib/idempotency.ts";
import { errorResponse, handleApiError, HttpError, jsonResponse, parseJsonBody } from "./lib/http.ts";
import {
  isDevBootstrapEnabled,
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

function defaultStageStatuses(): StageStatuses {
  return StageStatusesSchema.parse({
    spec: "not_requested",
    technicalSheet: "not_requested",
    svg: "not_requested",
    cad: "not_requested",
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

async function loadArtifact(db: D1Database, artifactId: string | null): Promise<ArtifactPublic | null> {
  if (!artifactId) {
    return null;
  }

  const artifact = await queryFirst<ArtifactRow>(
    db,
    `SELECT id, artifact_kind, r2_key, file_name, content_type, byte_size, sha256
     FROM artifacts
     WHERE id = ?`,
    [artifactId],
  );

  if (!artifact) {
    return null;
  }

  return ArtifactPublicSchema.parse({
    artifactId: artifact.id,
    kind: artifact.artifact_kind,
    contentType: artifact.content_type,
    byteSize: artifact.byte_size ?? 0,
    sha256: artifact.sha256,
    signedUrl: buildArtifactPreviewDataUrl(artifact),
  });
}

async function loadPairById(
  db: D1Database,
  pairId: string | null,
  selectionState: DesignRow["selection_state"],
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

  const sketch = await loadArtifact(db, pair.sketch_artifact_id);
  const render = await loadArtifact(db, pair.render_artifact_id);

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

async function buildDesignSummary(db: D1Database, design: DesignRow, workflow: WorkflowRow | null) {
  const sourceGenerationId = await loadSourceGenerationId(db, design.id);

  return DesignSummarySchema.parse({
    designId: design.id,
    projectId: design.project_id,
    parentDesignId: design.parent_design_id,
    sourceKind: design.source_kind,
    sourceGenerationId,
    displayName: design.display_name,
    promptSummary: design.prompt_summary,
    designDna: DesignDnaSchema.parse(JSON.parse(design.design_dna_json)),
    selectionState: design.selection_state,
    latestPairId: design.latest_pair_id,
    pair: await loadPairById(db, design.latest_pair_id, design.selection_state),
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

async function loadCoverImageForDesign(db: D1Database, design: DesignRow): Promise<ArtifactPublic | null> {
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

  return loadArtifact(db, pair.render_artifact_id);
}

async function buildProjectResponse(db: D1Database, project: ProjectRow): Promise<ProjectResponse> {
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
    selectedDesign: selectedDesign ? await buildDesignSummary(db, selectedDesign, selectedWorkflow) : null,
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

async function buildProjectDesignsResponse(db: D1Database, project: ProjectRow) {
  const designs = await queryAll<DesignRow>(
    db,
    `SELECT *
     FROM designs
     WHERE project_id = ? AND tenant_id = ?
     ORDER BY
       CASE WHEN id = ? THEN 0 ELSE 1 END,
       COALESCE(selected_at, updated_at) DESC,
       created_at DESC`,
    [project.id, project.tenant_id, project.selected_design_id],
  );

  const items = await Promise.all(
    designs.map(async (design) => {
      const workflow = await loadWorkflow(db, design.latest_workflow_run_id);
      return buildDesignSummary(db, design, workflow);
    }),
  );

  return ProjectDesignsResponseSchema.parse({
    projectId: project.id,
    selectedDesignId: project.selected_design_id,
    total: items.length,
    items,
  });
}

async function buildDesignDetailResponse(db: D1Database, project: ProjectRow, design: DesignRow) {
  const workflow = await loadWorkflow(db, design.latest_workflow_run_id);

  return DesignDetailResponseSchema.parse({
    projectId: project.id,
    selectedDesignId: project.selected_design_id,
    canSelect: canSelectDesign(design),
    design: await buildDesignSummary(db, design, workflow),
    recentGenerations: await loadRecentDesignGenerations(db, design),
  });
}

async function handlePromptPreview(request: Request, env: ApiEnv, auth: AuthContext): Promise<Response> {
  const payload = await parseJsonBody(request, PromptPreviewRequestSchema);
  await requireProjectAccess(env.SKYGEMS_DB, auth, payload.projectId);
  const promptProvider = resolvePromptProviderSelection(env);

  const preview = await buildPromptPreviewWithOptions(payload, {
    provider: promptProvider.active,
  });

  return jsonResponse(
    PromptPreviewResponseSchema.parse({
      projectId: payload.projectId,
      promptPreviewVersion: "prompt_preview.v1",
      pairStandardVersion: "pair_v1",
      ...preview,
    }),
    200,
    {
      "x-skygems-prompt-pack-version": promptProvider.promptPackVersion,
      "x-skygems-prompt-provider": promptProvider.active,
      "x-skygems-prompt-provider-source": promptProvider.source,
    },
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
  const requestHash = await computeRequestHash(payload, {}, auth.tenantId);
  const promptProvider = resolvePromptProviderSelection(env);
  const initialExecution = resolveGenerateExecutionMode(request, env);

  await requireProjectWriteAccess(env.SKYGEMS_DB, auth, payload.projectId);

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
      const designDna = await buildDesignDna(payload);
      const promptBundle = buildPromptBundle(designDna, payload.userNotes, {
        provider: promptProvider.active,
      });
      const promptSummary = buildPromptSummary(payload);
      const promptAgentOutput = PromptAgentOutputSchema.parse({
        schemaVersion: "prompt_agent.v1",
        mode: "generate",
        projectId: payload.projectId,
        designId,
        pairStandardVersion: "pair_v1",
        normalizedInput: GenerateDesignRequestSchema.omit({
          projectId: true,
          promptTextOverride: true,
        }).parse({
          jewelryType: payload.jewelryType,
          metal: payload.metal,
          gemstones: payload.gemstones,
          style: payload.style,
          complexity: payload.complexity,
          variationOverrides: payload.variationOverrides,
          userNotes: payload.userNotes,
          pairStandardVersion: payload.pairStandardVersion,
        }),
        designDna,
        promptBundle,
        blocked: false,
        blockReasons: [],
      });

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
          payload.projectId,
          auth.userId,
          buildDesignDisplayName(designDna),
          promptSummary,
          asJsonText(payload),
          asJsonText(designDna),
          buildSearchText(designDna, promptSummary, payload.userNotes),
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
          payload.projectId,
          designId,
          auth.userId,
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
        [createdAt, payload.projectId],
      );

      const queuePayload = GenerateQueuePayloadSchema.parse({
        schemaVersion: "generate_queue.v1",
        generationId,
        designId,
        projectId: payload.projectId,
        tenantId: auth.tenantId,
        requestedByUserId: auth.userId,
        idempotencyKey,
        requestHash,
        queuedAt: createdAt,
        input: GenerateDesignRequestSchema.omit({
          projectId: true,
          promptTextOverride: true,
        }).parse({
          jewelryType: payload.jewelryType,
          metal: payload.metal,
          gemstones: payload.gemstones,
          style: payload.style,
          complexity: payload.complexity,
          variationOverrides: payload.variationOverrides,
          userNotes: payload.userNotes,
          pairStandardVersion: payload.pairStandardVersion,
        }),
        promptTextOverride: payload.promptTextOverride,
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
          projectId: payload.projectId,
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

async function handleGenerationStatus(
  _request: Request,
  env: ApiEnv,
  auth: AuthContext,
  generationId: string,
) {
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
  const pair = await loadPairById(env.SKYGEMS_DB, design.latest_pair_id, design.selection_state);

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
    design: await buildDesignSummary(env.SKYGEMS_DB, design, workflow),
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

  if (payload.query) {
    whereClauses.push("search_text LIKE ?");
    bindings.push(`%${payload.query.toLowerCase()}%`);
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
  for (const design of designs) {
    const workflow = await loadWorkflow(env.SKYGEMS_DB, design.latest_workflow_run_id);
    items.push({
      designId: design.id,
      projectId: design.project_id,
      displayName: design.display_name,
      promptSummary: design.prompt_summary,
      selectionState: design.selection_state,
      latestPairId: design.latest_pair_id,
      coverImage: await loadCoverImageForDesign(env.SKYGEMS_DB, design),
      stageStatuses: stageStatusesFromDesign(design, workflow),
      updatedAt: design.updated_at,
    });
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

async function handleProject(env: ApiEnv, auth: AuthContext, projectId: string): Promise<Response> {
  const project = await requireProjectAccess(env.SKYGEMS_DB, auth, projectId);
  const response = await buildProjectResponse(env.SKYGEMS_DB, project);
  return jsonResponse(ProjectResponseSchema.parse(response));
}

async function handleProjectDesigns(
  env: ApiEnv,
  auth: AuthContext,
  projectId: string,
): Promise<Response> {
  const project = await requireProjectAccess(env.SKYGEMS_DB, auth, projectId);
  const response = await buildProjectDesignsResponse(env.SKYGEMS_DB, project);
  return jsonResponse(ProjectDesignsResponseSchema.parse(response));
}

async function handleDesignDetail(
  env: ApiEnv,
  auth: AuthContext,
  designId: string,
): Promise<Response> {
  const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, designId);
  const project = await requireProjectAccess(env.SKYGEMS_DB, auth, design.project_id);
  const response = await buildDesignDetailResponse(env.SKYGEMS_DB, project, design);
  return jsonResponse(DesignDetailResponseSchema.parse(response));
}

async function handleSelectDesign(
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
  const detail = await buildDesignDetailResponse(env.SKYGEMS_DB, refreshedProject, refreshedDesign);

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

  if (request.method === "POST" && url.pathname === "/v1/dev/bootstrap") {
    if (!isDevBootstrapEnabled(request, env)) {
      throw new HttpError(404, "not_found", "Dev bootstrap is not enabled for this environment.");
    }

    const payload = await parseJsonBody(request, DevBootstrapRequestSchema);
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

  if (request.method === "POST" && url.pathname === "/v1/prompt-preview") {
    return handlePromptPreview(request, env, auth);
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
    return handleProject(env, auth, ProjectIdSchema.parse(projectMatch[1]));
  }

  const projectDesignsMatch = url.pathname.match(
    /^\/v1\/projects\/(prj_[0-9A-HJKMNP-TV-Z]{26})\/designs$/,
  );
  if (request.method === "GET" && projectDesignsMatch) {
    return handleProjectDesigns(env, auth, ProjectIdSchema.parse(projectDesignsMatch[1]));
  }

  if (request.method === "POST" && url.pathname === "/v1/gallery/search") {
    return handleGallerySearch(request, env, auth);
  }

  const designMatch = url.pathname.match(/^\/v1\/designs\/(dsn_[0-9A-HJKMNP-TV-Z]{26})$/);
  if (request.method === "GET" && designMatch) {
    return handleDesignDetail(env, auth, DesignIdSchema.parse(designMatch[1]));
  }

  const designSelectMatch = url.pathname.match(
    /^\/v1\/designs\/(dsn_[0-9A-HJKMNP-TV-Z]{26})\/select$/,
  );
  if (request.method === "POST" && designSelectMatch) {
    return handleSelectDesign(env, auth, DesignIdSchema.parse(designSelectMatch[1]));
  }

  const refineMatch = url.pathname.match(/^\/v1\/designs\/(dsn_[0-9A-HJKMNP-TV-Z]{26})\/refine$/);
  if (request.method === "POST" && refineMatch) {
    const design = await requireDesign(env.SKYGEMS_DB, auth.tenantId, DesignIdSchema.parse(refineMatch[1]));
    await requireProjectWriteAccess(env.SKYGEMS_DB, auth, design.project_id);
    const payload = await parseJsonBody(request, RefineRequestSchema);
    void payload;
    return stubbedRoute("Refine execution is intentionally stubbed in Phase 2A foundation.");
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
    return stubbedRoute(
      "Downstream workflow execution is intentionally stubbed in Phase 2A foundation.",
    );
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

export default {
  async fetch(request: Request, env: ApiEnv, ctx: ExecutionContext): Promise<Response> {
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
