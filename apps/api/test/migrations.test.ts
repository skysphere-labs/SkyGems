import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const migrationsDir = resolve(process.cwd(), "apps/api/migrations");
const migrationSql = readdirSync(migrationsDir)
  .filter((entry) => entry.endsWith(".sql"))
  .sort()
  .map((entry) => readFileSync(resolve(migrationsDir, entry), "utf8"))
  .join("\n\n");

test("phase 2a migration applies cleanly to sqlite", () => {
  const database = new DatabaseSync(":memory:");
  database.exec(migrationSql);

  const tables = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row: { name: string }) => row.name);

  assert.deepEqual(
    new Set(tables),
    new Set([
      "artifacts",
      "cad_jobs",
      "design_specs",
      "design_workflow_runs",
      "designs",
      "generation_pairs",
      "generations",
      "idempotency_records",
      "project_memberships",
      "projects",
      "svg_assets",
      "technical_sheets",
      "tenants",
      "users",
    ]),
  );
});

test("phase 2a migration creates the contract-critical indexes", () => {
  const database = new DatabaseSync(":memory:");
  database.exec(migrationSql);

  const indexes = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'")
    .all()
    .map((row: { name: string }) => row.name);

  assert.deepEqual(
    new Set(indexes),
    new Set([
      "idx_artifacts_design_kind_created_at",
      "idx_cad_jobs_design_version",
      "idx_design_specs_design_version",
      "idx_design_workflow_runs_design_created_at",
      "idx_designs_parent_design_id",
      "idx_designs_project_selection_updated_at",
      "idx_designs_tenant_project_created_at",
      "idx_generation_pairs_design_created_at",
      "idx_generations_design_created_at",
      "idx_generations_tenant_status_created_at",
      "idx_idempotency_records_tenant_endpoint_created_at",
      "idx_projects_tenant_updated_at",
      "idx_svg_assets_design_version",
      "idx_technical_sheets_design_version",
    ]),
  );
});

test("phase 2a migration preserves the locked public contract checks", () => {
  const database = new DatabaseSync(":memory:");
  database.exec(migrationSql);

  const generationsSql = database
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'generations'")
    .get() as { sql: string };
  const artifactsSql = database
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'artifacts'")
    .get() as { sql: string };

  assert.match(generationsSql.sql, /pair_standard_version TEXT NOT NULL CHECK\(pair_standard_version = 'pair_v1'\)/);
  assert.match(
    generationsSql.sql,
    /execution_mode TEXT NOT NULL\s+DEFAULT 'local'\s+CHECK\(execution_mode IN \('queue', 'local'\)\)/,
  );
  assert.match(
    generationsSql.sql,
    /execution_source TEXT NOT NULL\s+DEFAULT 'local_development'\s+CHECK\(execution_source IN \(\s+'configured_queue',\s+'configured_local',\s+'default_auto',\s+'local_development',\s+'queue_send_failed_fallback'\s+\)\)/,
  );
  assert.match(artifactsSql.sql, /cad_qa_report_json/);
});
