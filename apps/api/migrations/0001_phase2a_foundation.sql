PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK(plan_tier IN ('free', 'pro', 'enterprise')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  auth_subject TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK(status IN ('active', 'archived')) DEFAULT 'active',
  selected_design_id TEXT REFERENCES designs(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_memberships (
  project_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK(role IN ('owner', 'editor', 'viewer')),
  created_at TEXT NOT NULL,
  PRIMARY KEY(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  parent_design_id TEXT REFERENCES designs(id),
  source_kind TEXT NOT NULL CHECK(source_kind IN ('create', 'refine')),
  selection_state TEXT NOT NULL CHECK(selection_state IN ('candidate', 'selected', 'superseded', 'archived')) DEFAULT 'candidate',
  display_name TEXT NOT NULL,
  prompt_summary TEXT NOT NULL,
  prompt_input_json TEXT NOT NULL,
  design_dna_json TEXT NOT NULL,
  latest_pair_id TEXT REFERENCES generation_pairs(id),
  latest_spec_id TEXT REFERENCES design_specs(id),
  latest_technical_sheet_id TEXT REFERENCES technical_sheets(id),
  latest_svg_asset_id TEXT REFERENCES svg_assets(id),
  latest_cad_job_id TEXT REFERENCES cad_jobs(id),
  latest_workflow_run_id TEXT REFERENCES design_workflow_runs(id),
  search_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  selected_at TEXT,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  design_id TEXT NOT NULL REFERENCES designs(id),
  requested_by_user_id TEXT NOT NULL REFERENCES users(id),
  base_design_id TEXT REFERENCES designs(id),
  request_kind TEXT NOT NULL CHECK(request_kind IN ('create', 'refine')),
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'succeeded', 'failed', 'canceled')),
  pair_standard_version TEXT NOT NULL CHECK(pair_standard_version = 'pair_v1'),
  request_json TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  prompt_agent_output_json TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  design_id TEXT NOT NULL REFERENCES designs(id),
  producer_type TEXT NOT NULL CHECK(producer_type IN ('generation_pair', 'technical_sheet', 'svg', 'cad')),
  artifact_kind TEXT NOT NULL CHECK(artifact_kind IN (
    'pair_sketch_png',
    'pair_render_png',
    'tech_sheet_json',
    'tech_sheet_pdf',
    'svg_front',
    'svg_side',
    'svg_top',
    'svg_annotations_json',
    'cad_step',
    'cad_dxf',
    'cad_stl',
    'cad_package_zip',
    'cad_qa_report_json'
  )),
  r2_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_pairs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  design_id TEXT NOT NULL REFERENCES designs(id),
  generation_id TEXT NOT NULL UNIQUE REFERENCES generations(id),
  pair_standard_version TEXT NOT NULL CHECK(pair_standard_version = 'pair_v1'),
  sketch_artifact_id TEXT NOT NULL REFERENCES artifacts(id),
  render_artifact_id TEXT NOT NULL REFERENCES artifacts(id),
  pair_manifest_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS design_workflow_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  design_id TEXT NOT NULL REFERENCES designs(id),
  requested_by_user_id TEXT NOT NULL REFERENCES users(id),
  requested_target_stage TEXT NOT NULL CHECK(requested_target_stage IN ('spec', 'technical_sheet', 'svg', 'cad')),
  current_stage TEXT NOT NULL CHECK(current_stage IN ('none', 'spec', 'technical_sheet', 'svg', 'cad', 'complete')),
  workflow_status TEXT NOT NULL CHECK(workflow_status IN ('queued', 'running', 'succeeded', 'failed', 'canceled')),
  spec_status TEXT NOT NULL CHECK(spec_status IN ('not_requested', 'queued', 'running', 'succeeded', 'failed', 'skipped')),
  technical_sheet_status TEXT NOT NULL CHECK(technical_sheet_status IN ('not_requested', 'queued', 'running', 'succeeded', 'failed', 'skipped')),
  svg_status TEXT NOT NULL CHECK(svg_status IN ('not_requested', 'queued', 'running', 'succeeded', 'failed', 'skipped')),
  cad_status TEXT NOT NULL CHECK(cad_status IN ('not_requested', 'queued', 'running', 'succeeded', 'failed', 'skipped')),
  latest_spec_id TEXT REFERENCES design_specs(id),
  latest_technical_sheet_id TEXT REFERENCES technical_sheets(id),
  latest_svg_asset_id TEXT REFERENCES svg_assets(id),
  latest_cad_job_id TEXT REFERENCES cad_jobs(id),
  force_regenerate INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  last_error_message TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS design_specs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  design_id TEXT NOT NULL REFERENCES designs(id),
  workflow_run_id TEXT NOT NULL REFERENCES design_workflow_runs(id),
  source_pair_id TEXT NOT NULL REFERENCES generation_pairs(id),
  spec_version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'succeeded', 'failed')),
  spec_standard_version TEXT NOT NULL CHECK(spec_standard_version = 'spec_v1'),
  agent_output_json TEXT,
  risk_flags_json TEXT NOT NULL DEFAULT '[]',
  unknowns_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(design_id, spec_version)
);

CREATE TABLE IF NOT EXISTS technical_sheets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  design_id TEXT NOT NULL REFERENCES designs(id),
  workflow_run_id TEXT NOT NULL REFERENCES design_workflow_runs(id),
  source_spec_id TEXT NOT NULL REFERENCES design_specs(id),
  tech_version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'succeeded', 'failed')),
  tech_standard_version TEXT NOT NULL CHECK(tech_standard_version = 'tech_v1'),
  sheet_json TEXT,
  json_artifact_id TEXT REFERENCES artifacts(id),
  pdf_artifact_id TEXT REFERENCES artifacts(id),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(design_id, tech_version)
);

CREATE TABLE IF NOT EXISTS svg_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  design_id TEXT NOT NULL REFERENCES designs(id),
  workflow_run_id TEXT NOT NULL REFERENCES design_workflow_runs(id),
  source_technical_sheet_id TEXT NOT NULL REFERENCES technical_sheets(id),
  svg_version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'succeeded', 'failed')),
  svg_standard_version TEXT NOT NULL CHECK(svg_standard_version = 'svg_v1'),
  manifest_json TEXT,
  front_artifact_id TEXT REFERENCES artifacts(id),
  side_artifact_id TEXT REFERENCES artifacts(id),
  top_artifact_id TEXT REFERENCES artifacts(id),
  annotation_artifact_id TEXT REFERENCES artifacts(id),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(design_id, svg_version)
);

CREATE TABLE IF NOT EXISTS cad_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  design_id TEXT NOT NULL REFERENCES designs(id),
  workflow_run_id TEXT NOT NULL REFERENCES design_workflow_runs(id),
  source_svg_asset_id TEXT NOT NULL REFERENCES svg_assets(id),
  cad_version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'succeeded', 'failed', 'canceled')),
  requested_formats_json TEXT NOT NULL,
  cad_prep_output_json TEXT,
  package_artifact_id TEXT REFERENCES artifacts(id),
  qa_report_artifact_id TEXT REFERENCES artifacts(id),
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(design_id, cad_version)
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  endpoint_name TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status_code INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  primary_resource_type TEXT NOT NULL,
  primary_resource_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  UNIQUE(tenant_id, endpoint_name, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant_updated_at ON projects(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_tenant_project_created_at ON designs(tenant_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_project_selection_updated_at ON designs(project_id, selection_state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_parent_design_id ON designs(parent_design_id);
CREATE INDEX IF NOT EXISTS idx_generations_tenant_status_created_at ON generations(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_design_created_at ON generations(design_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_pairs_design_created_at ON generation_pairs(design_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_design_workflow_runs_design_created_at ON design_workflow_runs(design_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_design_specs_design_version ON design_specs(design_id, spec_version DESC);
CREATE INDEX IF NOT EXISTS idx_technical_sheets_design_version ON technical_sheets(design_id, tech_version DESC);
CREATE INDEX IF NOT EXISTS idx_svg_assets_design_version ON svg_assets(design_id, svg_version DESC);
CREATE INDEX IF NOT EXISTS idx_cad_jobs_design_version ON cad_jobs(design_id, cad_version DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_design_kind_created_at ON artifacts(design_id, artifact_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idempotency_records_tenant_endpoint_created_at ON idempotency_records(tenant_id, endpoint_name, created_at DESC);
