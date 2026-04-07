import { executeStatement, nowIso, queryFirst } from "./d1.ts";
import { HttpError } from "./http.ts";

interface ProjectRow {
  id: string;
  tenant_id: string;
  status: "active" | "archived";
  selected_design_id: string | null;
  updated_at: string;
}

interface DesignRow {
  id: string;
  tenant_id: string;
  project_id: string;
  selection_state: "candidate" | "selected" | "superseded" | "archived";
  latest_pair_id: string | null;
  selected_at: string | null;
  archived_at: string | null;
}

export interface DesignSelectionResult {
  designId: string;
  projectId: string;
  previousSelectedDesignId: string | null;
  selectionChanged: boolean;
  selectedAt: string | null;
  updatedAt: string;
}

export async function selectProjectDesign(
  db: D1Database,
  options: {
    tenantId: string;
    projectId: string;
    designId: string;
    requirePair?: boolean;
  },
): Promise<DesignSelectionResult> {
  const project = await queryFirst<ProjectRow>(
    db,
    `SELECT id, tenant_id, status, selected_design_id, updated_at
     FROM projects
     WHERE id = ? AND tenant_id = ?`,
    [options.projectId, options.tenantId],
  );

  if (!project) {
    throw new HttpError(404, "not_found", "Project was not found for this tenant.");
  }

  if (project.status !== "active") {
    throw new HttpError(409, "conflict", "Design selection is only allowed for active projects.");
  }

  const design = await queryFirst<DesignRow>(
    db,
    `SELECT id, tenant_id, project_id, selection_state, latest_pair_id, selected_at, archived_at
     FROM designs
     WHERE id = ? AND tenant_id = ? AND project_id = ?`,
    [options.designId, options.tenantId, options.projectId],
  );

  if (!design) {
    throw new HttpError(404, "not_found", "Design was not found for this project.");
  }

  if (design.archived_at || design.selection_state === "archived") {
    throw new HttpError(409, "conflict", "Archived designs cannot be selected.");
  }

  if ((options.requirePair ?? true) && !design.latest_pair_id) {
    throw new HttpError(
      409,
      "conflict",
      "Design cannot be selected until generation pair artifacts are available.",
    );
  }

  const previousSelectedDesignId = project.selected_design_id;
  const selectionChanged =
    previousSelectedDesignId !== design.id || design.selection_state !== "selected";
  const updatedAt = selectionChanged ? nowIso() : project.updated_at;
  const selectedAt = design.selected_at ?? updatedAt;

  if (selectionChanged) {
    await executeStatement(
      db,
      `UPDATE designs
       SET selection_state = 'superseded', updated_at = ?
       WHERE project_id = ? AND tenant_id = ? AND id != ? AND selection_state = 'selected'`,
      [updatedAt, project.id, project.tenant_id, design.id],
    );

    await executeStatement(
      db,
      `UPDATE designs
       SET selection_state = 'selected', selected_at = COALESCE(selected_at, ?), updated_at = ?
       WHERE id = ? AND tenant_id = ? AND project_id = ?`,
      [selectedAt, updatedAt, design.id, project.tenant_id, project.id],
    );

    await executeStatement(
      db,
      `UPDATE projects
       SET selected_design_id = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [design.id, updatedAt, project.id, project.tenant_id],
    );
  }

  return {
    designId: design.id,
    projectId: project.id,
    previousSelectedDesignId,
    selectionChanged,
    selectedAt,
    updatedAt,
  };
}
