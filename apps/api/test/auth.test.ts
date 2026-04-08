import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { ensureTenantAndUser, toTenantScopedAuthSubject } from "../src/lib/auth.ts";

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

test("ensureTenantAndUser reuses the same user inside one tenant", async () => {
  const { sqlite, d1 } = createTestDatabase();

  const first = await ensureTenantAndUser(d1, {
    authMode: "auth0",
    tenantSlug: "tenant-alpha",
    tenantName: "Tenant Alpha",
    authSubject: "auth0|shared-user",
    email: "shared@example.com",
    displayName: "Shared User",
    role: "owner",
    permissions: [],
  });

  const second = await ensureTenantAndUser(d1, {
    authMode: "auth0",
    tenantSlug: "tenant-alpha",
    tenantName: "Tenant Alpha",
    authSubject: "auth0|shared-user",
    email: "shared@example.com",
    displayName: "Shared User",
    role: "owner",
    permissions: [],
  });

  assert.equal(second.auth.userId, first.auth.userId);

  const rows = sqlite
    .prepare("SELECT id, tenant_id, auth_subject FROM users")
    .all() as Array<{ id: string; tenant_id: string; auth_subject: string }>;

  assert.equal(rows.length, 1);
  assert.equal(rows[0].tenant_id, first.auth.tenantId);
  assert.equal(rows[0].auth_subject, "auth0|shared-user");
});

test("tenant-scoped auth subjects differ across tenants", () => {
  assert.equal(
    toTenantScopedAuthSubject("tenant-alpha", "auth0|shared-user"),
    "tenant:tenant-alpha:auth0|shared-user",
  );
  assert.equal(
    toTenantScopedAuthSubject("tenant-beta", "auth0|shared-user"),
    "tenant:tenant-beta:auth0|shared-user",
  );
  assert.notEqual(
    toTenantScopedAuthSubject("tenant-alpha", "auth0|shared-user"),
    toTenantScopedAuthSubject("tenant-beta", "auth0|shared-user"),
  );
});

test("ensureTenantAndUser creates isolated users for tenant-scoped auth subjects", async () => {
  const { sqlite, d1 } = createTestDatabase();

  const tenantAlpha = await ensureTenantAndUser(d1, {
    authMode: "auth0",
    tenantSlug: "tenant-alpha",
    tenantName: "Tenant Alpha",
    authSubject: toTenantScopedAuthSubject("tenant-alpha", "auth0|shared-user"),
    email: "shared@example.com",
    displayName: "Shared User",
    role: "owner",
    permissions: [],
  });

  const tenantBeta = await ensureTenantAndUser(d1, {
    authMode: "auth0",
    tenantSlug: "tenant-beta",
    tenantName: "Tenant Beta",
    authSubject: toTenantScopedAuthSubject("tenant-beta", "auth0|shared-user"),
    email: "shared@example.com",
    displayName: "Shared User",
    role: "owner",
    permissions: [],
  });

  assert.notEqual(tenantAlpha.auth.tenantId, tenantBeta.auth.tenantId);
  assert.notEqual(tenantAlpha.auth.userId, tenantBeta.auth.userId);

  const rows = sqlite
    .prepare(
      "SELECT id, tenant_id, auth_subject FROM users ORDER BY tenant_id ASC",
    )
    .all() as Array<{ id: string; tenant_id: string; auth_subject: string }>;

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => row.tenant_id),
    [tenantAlpha.auth.tenantId, tenantBeta.auth.tenantId].sort(),
  );
  assert.deepEqual(
    rows.map((row) => row.auth_subject).sort(),
    [
      toTenantScopedAuthSubject("tenant-alpha", "auth0|shared-user"),
      toTenantScopedAuthSubject("tenant-beta", "auth0|shared-user"),
    ].sort(),
  );
});
