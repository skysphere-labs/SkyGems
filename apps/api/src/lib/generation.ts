import {
  buildArtifactR2Key,
  GenerateQueuePayloadSchema,
  generatePrefixedId,
  sha256Hex,
  type GenerateQueuePayload,
  type GenerateExecutionMode,
  type GenerateExecutionSource,
  type SelectionState,
} from "@skygems/shared";

import { selectProjectDesign } from "./design-selection.ts";
import { executeStatement, nowIso, queryFirst } from "./d1.ts";
import { HttpError } from "./http.ts";
import {
  resolveGenerateExecutionMode,
  type ApiEnv,
} from "./runtime.ts";

interface GenerationRow {
  id: string;
  tenant_id: string;
  project_id: string;
  design_id: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  started_at: string | null;
  completed_at: string | null;
}

interface DesignRow {
  id: string;
  tenant_id: string;
  project_id: string;
  display_name: string;
  prompt_summary: string;
  selection_state: SelectionState;
  design_dna_json: string;
  latest_pair_id: string | null;
  selected_at: string | null;
}

interface ProjectRow {
  id: string;
  tenant_id: string;
  selected_design_id: string | null;
}

interface GenerationPairRow {
  id: string;
  sketch_artifact_id: string;
  render_artifact_id: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugifyFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildArtifactPreviewDataUrl(
  kind: "pair_sketch_png" | "pair_render_png",
  fileName: string,
  artifactId: string,
): string {
  const label = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  const accent = kind === "pair_render_png" ? "#D4AF37" : "#C9B78E";
  const background = kind === "pair_render_png" ? "#0B0B0B" : "#F2E7CF";
  const border = kind === "pair_render_png" ? "rgba(255,255,255,0.16)" : "rgba(42,36,24,0.14)";
  const body = kind === "pair_render_png" ? "rgba(255,255,255,0.7)" : "#5C5138";
  const title = kind === "pair_render_png" ? "#F6E6BB" : "#2A2418";
  const mode = kind === "pair_render_png" ? "Render" : "Sketch";
  const svg = `
    <svg width="1200" height="900" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="900" rx="44" fill="${background}" />
      <rect x="40" y="40" width="1120" height="820" rx="30" fill="none" stroke="${border}" stroke-width="2" />
      <circle cx="600" cy="405" r="178" fill="none" stroke="${accent}" stroke-width="5" />
      <path d="M408 582 C510 308, 690 308, 792 582" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round" />
      <path d="M468 356 C525 282, 675 282, 732 356" fill="none" stroke="${body}" stroke-width="3" stroke-dasharray="10 10" />
      <text x="92" y="126" fill="${title}" font-size="40" font-family="Inter, Arial, sans-serif" font-weight="700">${escapeXml(label)}</text>
      <text x="92" y="174" fill="${body}" font-size="24" font-family="Inter, Arial, sans-serif">${escapeXml(mode)} placeholder served from backend truth</text>
      <text x="92" y="814" fill="${body}" font-size="20" font-family="Inter, Arial, sans-serif">Artifact ${escapeXml(artifactId.slice(-8))}</text>
      <text x="1108" y="814" text-anchor="end" fill="${accent}" font-size="20" font-family="Inter, Arial, sans-serif">${escapeXml(mode.toUpperCase())}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildFailureMessage(error: unknown): {
  code: "provider_failure" | "agent_validation_failed" | "workflow_failed";
  message: string;
} {
  if (error instanceof HttpError) {
    if (
      error.code === "provider_failure" ||
      error.code === "agent_validation_failed" ||
      error.code === "workflow_failed"
    ) {
      return {
        code: error.code,
        message: error.message,
      };
    }
  }

  return {
    code: "workflow_failed",
    message: error instanceof Error ? error.message : String(error),
  };
}

async function loadGeneration(db: D1Database, payload: GenerateQueuePayload): Promise<GenerationRow> {
  const generation = await queryFirst<GenerationRow>(
    db,
    `SELECT id, tenant_id, project_id, design_id, status, started_at, completed_at
     FROM generations
     WHERE id = ? AND tenant_id = ? AND project_id = ? AND design_id = ?`,
    [payload.generationId, payload.tenantId, payload.projectId, payload.designId],
  );

  if (!generation) {
    throw new HttpError(404, "not_found", "Queued generation row could not be found.");
  }

  return generation;
}

async function loadDesign(db: D1Database, payload: GenerateQueuePayload): Promise<DesignRow> {
  const design = await queryFirst<DesignRow>(
    db,
    `SELECT id, tenant_id, project_id, display_name, prompt_summary, selection_state, design_dna_json, latest_pair_id, selected_at
     FROM designs
     WHERE id = ? AND tenant_id = ? AND project_id = ?`,
    [payload.designId, payload.tenantId, payload.projectId],
  );

  if (!design) {
    throw new HttpError(404, "not_found", "Queued design row could not be found.");
  }

  return design;
}

async function loadProject(db: D1Database, payload: GenerateQueuePayload): Promise<ProjectRow> {
  const project = await queryFirst<ProjectRow>(
    db,
    `SELECT id, tenant_id, selected_design_id
     FROM projects
     WHERE id = ? AND tenant_id = ?`,
    [payload.projectId, payload.tenantId],
  );

  if (!project) {
    throw new HttpError(404, "not_found", "Queued project row could not be found.");
  }

  return project;
}

async function loadExistingPair(
  db: D1Database,
  generationId: string,
): Promise<GenerationPairRow | null> {
  return queryFirst<GenerationPairRow>(
    db,
    `SELECT id, sketch_artifact_id, render_artifact_id
     FROM generation_pairs
     WHERE generation_id = ?`,
    [generationId],
  );
}

async function insertPairArtifacts(
  db: D1Database,
  payload: GenerateQueuePayload,
  design: DesignRow,
  pairId: string,
  completedAt: string,
): Promise<{
  sketchArtifactId: string;
  renderArtifactId: string;
}> {
  const sketchArtifactId = generatePrefixedId("art");
  const renderArtifactId = generatePrefixedId("art");
  const fileStem = slugifyFileName(design.display_name || payload.designId);
  const sketchFileName = `${fileStem}-sketch.svg`;
  const renderFileName = `${fileStem}-render.svg`;
  const sketchDataUrl = buildArtifactPreviewDataUrl("pair_sketch_png", sketchFileName, sketchArtifactId);
  const renderDataUrl = buildArtifactPreviewDataUrl("pair_render_png", renderFileName, renderArtifactId);
  const sketchBytes = new TextEncoder().encode(sketchDataUrl);
  const renderBytes = new TextEncoder().encode(renderDataUrl);

  await executeStatement(
    db,
    `INSERT INTO artifacts (
       id, tenant_id, project_id, design_id, producer_type, artifact_kind, r2_key,
       file_name, content_type, byte_size, sha256, created_at
     ) VALUES (?, ?, ?, ?, 'generation_pair', 'pair_sketch_png', ?, ?, 'image/svg+xml', ?, ?, ?)`,
    [
      sketchArtifactId,
      payload.tenantId,
      payload.projectId,
      payload.designId,
      buildArtifactR2Key("pair_sketch_png", {
        tenantId: payload.tenantId,
        projectId: payload.projectId,
        designId: payload.designId,
        pairId,
      }),
      sketchFileName,
      sketchBytes.byteLength,
      await sha256Hex(sketchBytes),
      completedAt,
    ],
  );

  await executeStatement(
    db,
    `INSERT INTO artifacts (
       id, tenant_id, project_id, design_id, producer_type, artifact_kind, r2_key,
       file_name, content_type, byte_size, sha256, created_at
     ) VALUES (?, ?, ?, ?, 'generation_pair', 'pair_render_png', ?, ?, 'image/svg+xml', ?, ?, ?)`,
    [
      renderArtifactId,
      payload.tenantId,
      payload.projectId,
      payload.designId,
      buildArtifactR2Key("pair_render_png", {
        tenantId: payload.tenantId,
        projectId: payload.projectId,
        designId: payload.designId,
        pairId,
      }),
      renderFileName,
      renderBytes.byteLength,
      await sha256Hex(renderBytes),
      completedAt,
    ],
  );

  return {
    sketchArtifactId,
    renderArtifactId,
  };
}

async function persistSuccessfulGeneration(
  db: D1Database,
  payload: GenerateQueuePayload,
): Promise<void> {
  const generation = await loadGeneration(db, payload);
  const design = await loadDesign(db, payload);
  const project = await loadProject(db, payload);

  if (generation.status === "succeeded" && (await loadExistingPair(db, generation.id))) {
    return;
  }

  const startedAt = generation.started_at ?? nowIso();
  await executeStatement(
    db,
    `UPDATE generations
     SET status = 'running', started_at = COALESCE(started_at, ?), updated_at = ?, error_code = NULL, error_message = NULL
     WHERE id = ?`,
    [startedAt, startedAt, generation.id],
  );

  const existingPair = await loadExistingPair(db, generation.id);
  const pairId = existingPair?.id ?? generatePrefixedId("pair");
  const completedAt = nowIso();
  const shouldPromoteSelection =
    !project.selected_design_id || project.selected_design_id === design.id;
  const normalizedSelectionState =
    project.selected_design_id && project.selected_design_id !== design.id && design.selection_state === "selected"
      ? "superseded"
      : design.selection_state;

  let pair = existingPair;
  if (!pair) {
    const artifacts = await insertPairArtifacts(db, payload, design, pairId, completedAt);
    await executeStatement(
      db,
      `INSERT INTO generation_pairs (
         id, tenant_id, project_id, design_id, generation_id, pair_standard_version,
         sketch_artifact_id, render_artifact_id, pair_manifest_json, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'pair_v1', ?, ?, ?, ?, ?)`,
      [
        pairId,
        payload.tenantId,
        payload.projectId,
        payload.designId,
        payload.generationId,
        artifacts.sketchArtifactId,
        artifacts.renderArtifactId,
        JSON.stringify({
          placeholderMode: true,
          execution: "phase_3c_generate_local_or_queue_consumer",
          input: payload.input,
        }),
        completedAt,
        completedAt,
      ],
    );
    pair = {
      id: pairId,
      sketch_artifact_id: artifacts.sketchArtifactId,
      render_artifact_id: artifacts.renderArtifactId,
    };
  }

  await executeStatement(
    db,
    `UPDATE designs
     SET selection_state = ?, latest_pair_id = ?, updated_at = ?
     WHERE id = ?`,
    [normalizedSelectionState, pair.id, completedAt, design.id],
  );

  if (shouldPromoteSelection) {
    await selectProjectDesign(db, {
      tenantId: payload.tenantId,
      projectId: payload.projectId,
      designId: payload.designId,
      requirePair: true,
    });
  } else {
    await executeStatement(
      db,
      `UPDATE projects
       SET updated_at = ?
       WHERE id = ?`,
      [completedAt, project.id],
    );
  }

  await executeStatement(
    db,
    `UPDATE generations
     SET status = 'succeeded', started_at = COALESCE(started_at, ?), completed_at = ?, updated_at = ?, error_code = NULL, error_message = NULL
     WHERE id = ?`,
    [startedAt, completedAt, completedAt, generation.id],
  );
}

export async function markGenerateExecutionFailed(
  env: ApiEnv,
  payload: GenerateQueuePayload,
  error: unknown,
): Promise<void> {
  const failedAt = nowIso();
  const failure = buildFailureMessage(error);

  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE generations
     SET status = 'failed',
         started_at = COALESCE(started_at, ?),
         completed_at = COALESCE(completed_at, ?),
         updated_at = ?,
         error_code = ?,
         error_message = ?
     WHERE id = ?`,
    [failedAt, failedAt, failedAt, failure.code, failure.message.slice(0, 1000), payload.generationId],
  );
}

async function persistDispatchState(
  env: ApiEnv,
  payload: GenerateQueuePayload,
  executionMode: GenerateExecutionMode,
  executionSource: GenerateExecutionSource,
): Promise<void> {
  await executeStatement(
    env.SKYGEMS_DB,
    `UPDATE generations
     SET execution_mode = ?, execution_source = ?, updated_at = ?
     WHERE id = ?`,
    [executionMode, executionSource, nowIso(), payload.generationId],
  );
}

export async function runGenerateExecution(
  env: ApiEnv,
  payloadInput: unknown,
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  const payload = GenerateQueuePayloadSchema.parse(payloadInput);

  try {
    await persistSuccessfulGeneration(env.SKYGEMS_DB, payload);
    return { ok: true };
  } catch (error) {
    await markGenerateExecutionFailed(env, payload, error);
    return {
      ok: false,
      error,
    };
  }
}

export async function dispatchGenerateExecution(options: {
  request: Request;
  env: ApiEnv;
  ctx: ExecutionContext | undefined;
  payload: GenerateQueuePayload;
}): Promise<{
  executionMode: GenerateExecutionMode;
  executionSource: GenerateExecutionSource;
}> {
  const resolved = resolveGenerateExecutionMode(options.request, options.env);

  if (resolved.mode === "queue") {
    try {
      await options.env.GENERATE_QUEUE.send(options.payload);
      await persistDispatchState(options.env, options.payload, "queue", resolved.source);
      return {
        executionMode: "queue",
        executionSource: resolved.source,
      };
    } catch (error) {
      await persistDispatchState(
        options.env,
        options.payload,
        "local",
        "queue_send_failed_fallback",
      );
      const fallbackPromise = runGenerateExecution(options.env, options.payload).then((result) => {
        if (!result.ok) {
          console.error("SkyGems local fallback generation execution failed.", result.error);
        }
      });

      if (options.ctx) {
        options.ctx.waitUntil(fallbackPromise);
      } else {
        await fallbackPromise;
      }

      return {
        executionMode: "local",
        executionSource: "queue_send_failed_fallback",
      };
    }
  }

  await persistDispatchState(options.env, options.payload, "local", resolved.source);
  const executionPromise = runGenerateExecution(options.env, options.payload).then((result) => {
    if (!result.ok) {
      console.error("SkyGems local generation execution failed.", result.error);
    }
  });

  if (options.ctx) {
    options.ctx.waitUntil(executionPromise);
  } else {
    await executionPromise;
  }

  return {
    executionMode: "local",
    executionSource: resolved.source,
  };
}
