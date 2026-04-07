import { DevBootstrapRequestSchema, generatePrefixedId, type DevBootstrapRequest } from "@skygems/shared";

import { ensureTenantAndUser, issueDevBootstrapSession, type AuthContext } from "./auth.ts";
import { executeStatement, nowIso, queryFirst } from "./d1.ts";
import { type ApiEnv } from "./runtime.ts";

interface ProjectRow {
  id: string;
  tenant_id: string;
  created_by_user_id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function resolveBootstrapDefaults(env: ApiEnv): Required<DevBootstrapRequest> {
  return {
    tenantSlug: env.SKYGEMS_DEV_BOOTSTRAP_TENANT_SLUG ?? "skygems-dev",
    tenantName: env.SKYGEMS_DEV_BOOTSTRAP_TENANT_NAME ?? "SkyGems Dev Tenant",
    email: env.SKYGEMS_DEV_BOOTSTRAP_EMAIL ?? "dev@skygems.local",
    displayName: env.SKYGEMS_DEV_BOOTSTRAP_DISPLAY_NAME ?? "SkyGems Dev User",
    projectName: env.SKYGEMS_DEV_BOOTSTRAP_PROJECT_NAME ?? "SkyGems Sandbox",
    projectDescription:
      env.SKYGEMS_DEV_BOOTSTRAP_PROJECT_DESCRIPTION ??
      "Local bootstrap project for prompt-preview and the first wired backend slice.",
  };
}

export async function ensureDevBootstrap(
  env: ApiEnv,
  request: DevBootstrapRequest,
): Promise<{
  auth: AuthContext;
  sessionToken: string;
  sessionExpiresAt: string;
  project: ProjectRow;
  created: {
    tenant: boolean;
    user: boolean;
    project: boolean;
    membership: boolean;
  };
}> {
  const defaults = resolveBootstrapDefaults(env);
  const mergedRequest = {
    tenantSlug: request.tenantSlug ?? defaults.tenantSlug,
    tenantName: request.tenantName ?? defaults.tenantName,
    email: request.email ?? defaults.email,
    displayName: request.displayName ?? defaults.displayName,
    projectName: request.projectName ?? defaults.projectName,
    projectDescription:
      request.projectDescription ?? defaults.projectDescription,
  };
  const normalizedRequest = DevBootstrapRequestSchema.parse(mergedRequest);
  const tenantSlug = slugify(normalizedRequest.tenantSlug ?? defaults.tenantSlug);
  const bootstrapEmail = (normalizedRequest.email ?? defaults.email).toLowerCase();
  const authSubject = `dev:${tenantSlug}:${bootstrapEmail}`;

  const ensured = await ensureTenantAndUser(env.SKYGEMS_DB, {
    authMode: "dev_bootstrap",
    tenantSlug,
    tenantName: normalizedRequest.tenantName ?? defaults.tenantName,
    authSubject,
    email: bootstrapEmail,
    displayName: normalizedRequest.displayName ?? defaults.displayName ?? null,
    role: "owner",
    permissions: [
      "prompt-preview:create",
      "design:create",
      "project:bootstrap",
      "project:read",
    ],
  });

  const existingProject = await queryFirst<ProjectRow>(
    env.SKYGEMS_DB,
    `SELECT id, tenant_id, created_by_user_id, name, description, status, created_at, updated_at
     FROM projects
     WHERE tenant_id = ? AND created_by_user_id = ? AND name = ?
     ORDER BY created_at ASC
     LIMIT 1`,
    [ensured.auth.tenantId, ensured.auth.userId, normalizedRequest.projectName ?? defaults.projectName],
  );

  const timestamp = nowIso();
  const project =
    existingProject ??
    {
      id: generatePrefixedId("prj"),
      tenant_id: ensured.auth.tenantId,
      created_by_user_id: ensured.auth.userId,
      name: normalizedRequest.projectName ?? defaults.projectName,
      description: normalizedRequest.projectDescription ?? defaults.projectDescription ?? null,
      status: "active" as const,
      created_at: timestamp,
      updated_at: timestamp,
    };

  if (!existingProject) {
    await executeStatement(
      env.SKYGEMS_DB,
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
  }

  const existingMembership = await queryFirst<{ role: string }>(
    env.SKYGEMS_DB,
    `SELECT role
     FROM project_memberships
     WHERE project_id = ? AND user_id = ?`,
    [project.id, ensured.auth.userId],
  );

  if (!existingMembership) {
    await executeStatement(
      env.SKYGEMS_DB,
      `INSERT INTO project_memberships (project_id, user_id, role, created_at)
       VALUES (?, ?, 'owner', ?)`,
      [project.id, ensured.auth.userId, timestamp],
    );
  }

  const session = await issueDevBootstrapSession(ensured.auth, env, {
    allowLocalFallback: true,
  });

  return {
    auth: ensured.auth,
    sessionToken: session.token,
    sessionExpiresAt: session.expiresAt,
    project,
    created: {
      tenant: ensured.createdTenant,
      user: ensured.createdUser,
      project: !existingProject,
      membership: !existingMembership,
    },
  };
}
