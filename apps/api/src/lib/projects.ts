import { generatePrefixedId } from "@skygems/shared";

import type { AuthContext } from "./auth.ts";
import { executeStatement, nowIso, queryFirst } from "./d1.ts";

export interface ProjectRow {
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

interface ProjectMembershipRow {
  role: "owner" | "editor" | "viewer";
}

type ProjectAccessFailureReason =
  | "missing_project"
  | "missing_membership"
  | "foreign_project"
  | "write_access_required"
  | "inactive_project";

export interface ResolvedPromptWorkspace {
  project: ProjectRow;
  recovered: boolean;
  recoveryReason: ProjectAccessFailureReason | null;
}

const PERSONAL_PROJECT_DESCRIPTION =
  "Personal workspace for tenant-scoped prompt enhancement and generation.";

const projectRoleRank: Record<ProjectMembershipRow["role"], number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
};

function buildPersonalProjectName(auth: Pick<AuthContext, "displayName" | "email">): string {
  const basis =
    auth.displayName?.trim() ||
    auth.email.split("@")[0]?.replace(/[._-]+/g, " ").trim() ||
    "Personal";
  const normalized = basis
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return `${normalized || "Personal"} Workspace`.slice(0, 160);
}

async function ensureOwnerMembership(
  db: D1Database,
  projectId: string,
  userId: string,
  createdAt: string,
) {
  const existingMembership = await queryFirst<ProjectMembershipRow>(
    db,
    `SELECT role
     FROM project_memberships
     WHERE project_id = ? AND user_id = ?`,
    [projectId, userId],
  );

  if (!existingMembership) {
    await executeStatement(
      db,
      `INSERT INTO project_memberships (project_id, user_id, role, created_at)
       VALUES (?, ?, 'owner', ?)`,
      [projectId, userId, createdAt],
    );
  }
}

export async function ensurePersonalProject(
  db: D1Database,
  auth: AuthContext,
): Promise<ProjectRow> {
  const existingProject = await queryFirst<ProjectRow>(
    db,
    `SELECT id, tenant_id, created_by_user_id, name, description, status, selected_design_id, created_at, updated_at
     FROM projects
     WHERE tenant_id = ?
       AND created_by_user_id = ?
       AND description = ?
       AND status = 'active'
     ORDER BY updated_at DESC
     LIMIT 1`,
    [auth.tenantId, auth.userId, PERSONAL_PROJECT_DESCRIPTION],
  );

  if (existingProject) {
    await ensureOwnerMembership(db, existingProject.id, auth.userId, existingProject.created_at);
    return existingProject;
  }

  const timestamp = nowIso();
  const project: ProjectRow = {
    id: generatePrefixedId("prj"),
    tenant_id: auth.tenantId,
    created_by_user_id: auth.userId,
    name: buildPersonalProjectName(auth),
    description: PERSONAL_PROJECT_DESCRIPTION,
    status: "active",
    selected_design_id: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await executeStatement(
    db,
    `INSERT INTO projects (
       id, tenant_id, created_by_user_id, name, description, status, selected_design_id, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, 'active', NULL, ?, ?)`,
    [
      project.id,
      project.tenant_id,
      project.created_by_user_id,
      project.name,
      project.description,
      project.created_at,
      project.updated_at,
    ],
  );

  await ensureOwnerMembership(db, project.id, auth.userId, timestamp);
  return project;
}

export async function resolvePromptWorkspace(
  db: D1Database,
  auth: AuthContext,
  requestedProjectId: string,
  options: {
    requireWriteAccess?: boolean;
  } = {},
): Promise<ResolvedPromptWorkspace> {
  const requestedProject = await queryFirst<ProjectRow>(
    db,
    `SELECT id, tenant_id, created_by_user_id, name, description, status, selected_design_id, created_at, updated_at
     FROM projects
     WHERE id = ? AND tenant_id = ?`,
    [requestedProjectId, auth.tenantId],
  );

  if (requestedProject) {
    const membership = await queryFirst<ProjectMembershipRow>(
      db,
      `SELECT role
       FROM project_memberships
       WHERE project_id = ? AND user_id = ?`,
      [requestedProject.id, auth.userId],
    );

    if (membership) {
      if (requestedProject.created_by_user_id !== auth.userId) {
        return {
          project: await ensurePersonalProject(db, auth),
          recovered: true,
          recoveryReason: "foreign_project",
        };
      }

      if (options.requireWriteAccess && projectRoleRank[membership.role] < projectRoleRank.editor) {
        return {
          project: await ensurePersonalProject(db, auth),
          recovered: true,
          recoveryReason: "write_access_required",
        };
      }

      if (options.requireWriteAccess && requestedProject.status !== "active") {
        return {
          project: await ensurePersonalProject(db, auth),
          recovered: true,
          recoveryReason: "inactive_project",
        };
      }

      return {
        project: requestedProject,
        recovered: false,
        recoveryReason: null,
      };
    }

    return {
      project: await ensurePersonalProject(db, auth),
      recovered: true,
      recoveryReason: "missing_membership",
    };
  }

  return {
    project: await ensurePersonalProject(db, auth),
    recovered: true,
    recoveryReason: "missing_project",
  };
}

export { PERSONAL_PROJECT_DESCRIPTION };
