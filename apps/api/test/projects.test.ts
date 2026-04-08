import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { ensureTenantAndUser } from "../src/lib/auth.ts";
import {
  ensurePersonalProject,
  PERSONAL_PROJECT_DESCRIPTION,
  resolvePromptWorkspace,
} from "../src/lib/projects.ts";

const migrationsDir = resolve(process.cwd(), "apps/api/migrations");
const migrationSql = readdirSync(migrationsDir)
  .filter((entry) => entry.endsWith(".sql"))
  .sort()
  .map((entry) => readFileSync(resolve(migrationsDir, entry), "utf8"))
  .join("\n\n");

class SqliteD1Statement {
  private bindings: Array<string | number | null> = [];
  private readonly database: DatabaseSync;
  private readonly sql: string;

  constructor(database: DatabaseSync, sql: string) {
    this.database = database;
    this.sql = sql;
  }

  bind(...bindings: Array<string | number | null>) {
    this.bindings = bindings;
    return this;
  }

  async first<T>(): Promise<T | null> {
    const row = this.database.prepare(this.sql).get(...this.bindings);
    return (row as T | undefined) ?? null;
  }

  async run<T>(): Promise<{ results: T[] }> {
    const statement = this.database.prepare(this.sql);
    if (/^\s*select\b/i.test(this.sql)) {
      return { results: statement.all(...this.bindings) as T[] };
    }

    statement.run(...this.bindings);
    return { results: [] };
  }
}

class SqliteD1Database {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  prepare(sql: string) {
    return new SqliteD1Statement(this.database, sql);
  }
}

function createTestDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(migrationSql);
  return {
    sqlite,
    d1: new SqliteD1Database(sqlite) as unknown as D1Database,
  };
}

async function createAuthContext(d1: D1Database) {
  const ensured = await ensureTenantAndUser(d1, {
    authMode: "auth0",
    tenantSlug: "tenant-alpha",
    tenantName: "Tenant Alpha",
    authSubject: "tenant:tenant-alpha:auth0|prompt-user",
    email: "prompt-user@example.com",
    displayName: "Prompt User",
    role: "owner",
    permissions: [],
  });

  return ensured.auth;
}

test("ensurePersonalProject creates a dedicated tenant-scoped workspace", async () => {
  const { sqlite, d1 } = createTestDatabase();
  const auth = await createAuthContext(d1);

  const project = await ensurePersonalProject(d1, auth);

  assert.equal(project.tenant_id, auth.tenantId);
  assert.equal(project.created_by_user_id, auth.userId);
  assert.equal(project.description, PERSONAL_PROJECT_DESCRIPTION);

  const membership = sqlite
    .prepare("SELECT role FROM project_memberships WHERE project_id = ? AND user_id = ?")
    .get(project.id, auth.userId) as { role: string } | undefined;

  assert.equal(membership?.role, "owner");
});

test("resolvePromptWorkspace falls back to the personal workspace when the requested project is stale", async () => {
  const { d1 } = createTestDatabase();
  const auth = await createAuthContext(d1);

  const resolved = await resolvePromptWorkspace(d1, auth, "prj_stale_project_id");

  assert.equal(resolved.recovered, true);
  assert.equal(resolved.recoveryReason, "missing_project");
  assert.equal(resolved.project.tenant_id, auth.tenantId);
  assert.equal(resolved.project.created_by_user_id, auth.userId);
});

test("resolvePromptWorkspace keeps the requested project when the user has access", async () => {
  const { d1 } = createTestDatabase();
  const auth = await createAuthContext(d1);
  const personal = await ensurePersonalProject(d1, auth);

  const resolved = await resolvePromptWorkspace(d1, auth, personal.id, {
    requireWriteAccess: true,
  });

  assert.equal(resolved.recovered, false);
  assert.equal(resolved.recoveryReason, null);
  assert.equal(resolved.project.id, personal.id);
});

test("resolvePromptWorkspace isolates create flows away from another user's project", async () => {
  const { d1 } = createTestDatabase();
  const auth = await createAuthContext(d1);
  const collaborator = await ensureTenantAndUser(d1, {
    authMode: "auth0",
    tenantSlug: "tenant-alpha",
    tenantName: "Tenant Alpha",
    authSubject: "tenant:tenant-alpha:auth0|other-user",
    email: "other-user@example.com",
    displayName: "Other User",
    role: "owner",
    permissions: [],
  });

  const foreignProject = await ensurePersonalProject(d1, collaborator.auth);
  await d1
    .prepare(
      `INSERT INTO project_memberships (project_id, user_id, role, created_at)
       VALUES (?, ?, 'editor', ?)`,
    )
    .bind(foreignProject.id, auth.userId, new Date().toISOString())
    .run();

  const resolved = await resolvePromptWorkspace(d1, auth, foreignProject.id, {
    requireWriteAccess: true,
  });

  assert.equal(resolved.recovered, true);
  assert.equal(resolved.recoveryReason, "foreign_project");
  assert.notEqual(resolved.project.id, foreignProject.id);
  assert.equal(resolved.project.created_by_user_id, auth.userId);
});
