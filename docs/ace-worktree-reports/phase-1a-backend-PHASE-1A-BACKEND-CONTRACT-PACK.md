# SkyGems Phase 1A Backend Contract Pack

Date: 2026-04-05
Scope: Contract lock only. No implementation started from this artifact.
Authority: This pack supersedes Phase 0 drift where it conflicts with the official SkyGems product brief and public API list.

## 1. What I inspected

Required artifacts inspected first:

| Source | Path | Why it mattered |
| --- | --- | --- |
| Phase 0 backend audit | `/Users/acevashisth/emdash-projects/worktrees/phase-0-skygems-backend-platform-reuse-audit-contract-foundation-plan-5gh/PHASE-0-BACKEND-PLATFORM-AUDIT.md` | Showed the generic CRUD-heavy Phase 0 backend proposal and reuse inventory. |
| Phase 0 frontend audit | `/Users/acevashisth/emdash-projects/worktrees/phase-0-skygems-frontend-ux-reuse-audit-and-flow-map-2cg/PHASE-0-FRONTEND-AUDIT.md` | Showed route/UX drift, current frontend types, and target flow interpretation drift. |
| Official master plan | `/Users/acevashisth/Library/Application Support/Emdash/personal-hermes/.hermes/plans/2026-04-05_022900-skygems-master-execution-plan.md` | Product truth for flow, runtime agents, platform, and official public API. |

Current SkyGems repo files inspected directly:

| Area | Files | Finding used in this pack |
| --- | --- | --- |
| Repo shape | `/Users/acevashisth/emdash-projects/SkyGems/README.md`, `/Users/acevashisth/emdash-projects/SkyGems/package.json` | Frontend-only Vite SPA. No backend, no Workers, no D1, no R2, no queues, no workflows. |
| Route map | `/Users/acevashisth/emdash-projects/SkyGems/src/app/routes.tsx` | Current public UI routes drift from the official product flow. |
| Current frontend entity hints | `/Users/acevashisth/emdash-projects/SkyGems/src/app/services/storageService.ts` | Existing `DesignFeatures`, `DesignVariation`, and `DesignMetadata` are useful naming seeds but not canonical backend entities. |
| Reusable domain logic | `/Users/acevashisth/emdash-projects/SkyGems/src/app/services/variationEngine.ts` | Variation axes are good raw material for canonical `design_dna`. |
| Reusable prompt logic | `/Users/acevashisth/emdash-projects/SkyGems/src/app/utils/promptGenerator.ts` | Composition-first prompt structure is reusable for Prompt Agent internals. |
| Create-flow drift | `/Users/acevashisth/emdash-projects/SkyGems/src/app/screens/DesignGenerator.tsx` | Current UI exposes a `variations` count that conflicts with the official "Generate Pair" step. |
| Downstream mock drift | `/Users/acevashisth/emdash-projects/SkyGems/src/app/screens/DesignPreview.tsx` | Current "spec/preview/export" surfaces are mock-only and cannot be treated as backend truth. |
| Codebase-wide platform search | `rg` over `/Users/acevashisth/emdash-projects/SkyGems` | Confirmed no hidden auth, tenant, Worker, D1, R2, queue, workflow, or API client code exists. |

Direct inspection conclusion:

- The current repo is a frontend shell only.
- The official product flow is authoritative: `Create -> Generate Pair -> Select -> Spec -> Technical Sheet -> SVG -> CAD`.
- The official public API list is authoritative and must not be expanded in this Phase 1A pack.

## 2. Reconciliation decisions made

### 2.1 Product truth that wins

When there is drift, the official brief wins over Phase 0 proposals and current UI mocks.

Locked product flow:

`Create -> Generate Pair -> Select -> Spec -> Technical Sheet -> SVG -> CAD`

Locked public API:

- `POST /v1/prompt-preview`
- `POST /v1/generate-design`
- `GET /v1/generations/:generationId`
- `POST /v1/designs/:designId/refine`
- `POST /v1/designs/:designId/spec`
- `POST /v1/designs/:designId/technical-sheet`
- `POST /v1/designs/:designId/svg`
- `POST /v1/designs/:designId/cad`
- `POST /v1/gallery/search`
- `GET /v1/projects/:projectId`

### 2.2 Drift resolved explicitly

| Drift source | Drift | Decision |
| --- | --- | --- |
| Phase 0 backend audit | Proposed generic CRUD `/v1/designs`, `/v1/jobs`, chat APIs, and auth APIs | Rejected from the public v1 contract. Keep only the official API surface above. |
| Phase 0 backend audit | Proposed one generic `jobs` table | Rejected. Use typed async tables: `generations`, `design_workflow_runs`, and `cad_jobs`. |
| Phase 0 frontend audit | Interpreted "Generate Pair" as multi-design generation results | Rejected. A generation produces exactly one `pair_v1` sketch/render pair for one design candidate. |
| Current `DesignGenerator.tsx` | Exposes `variations` count as a user-facing input | Rejected from public API. Internal variation axes survive; public "generate N variants" does not. |
| Current frontend routes | `/app/preview/:id`, `/app/copilot`, `/app/export` imply a different product flow | Not authoritative for backend. Canonical backend flow is generation -> selected design -> downstream workflow stages. |
| Current `storageService.ts` | Treats "design" as a local saved image card with `liked`, `tags`, `notes` | Reframed. `design` is the durable versioned concept resource; like/save semantics are not core v1 backend entities. |
| Missing official select endpoint | Flow has "Select" but official public API has no `POST /select` | Lock selection as server state on `projects` and `designs`; the first downstream design-stage POST promotes the chosen design to selected. |

### 2.3 Worker and service-boundary map

This is the v1 boundary map:

| Boundary | Role | Platform bindings / ownership |
| --- | --- | --- |
| `web` Worker (OpenNext) | UI only. No direct data ownership. | One service binding to `api`. No browser-to-D1/R2 access. |
| `api` Worker | Owns all public `/v1/*` endpoints, auth/tenant enforcement, idempotency enforcement, D1 writes, R2 signed URLs, queue publishing, workflow start/resume. | `SKYGEMS_DB` (D1), `SKYGEMS_ARTIFACTS` (R2), `GENERATE_QUEUE`, `REFINE_QUEUE`, `SPEC_QUEUE`, `DESIGN_PIPELINE_WORKFLOW`, `AI_GATEWAY`. |
| Queue consumers and workflow steps | Internal execution only. Same codebase as `api` in v1; not a separate public Worker boundary. | Queue handlers for generate/refine/spec; workflow steps for spec -> technical-sheet -> svg -> cad. Containers are only used inside `svg` and `cad` steps. |

### 2.4 Non-goals for v1

These are explicitly not part of this backend contract:

- No public generic CRUD API for designs, jobs, artifacts, chat sessions, or auth.
- No public standalone select endpoint.
- No chat/copilot runtime API in the core product path.
- No per-project agent instances or agent loops.
- No containers in the initial generate/refine/spec hot paths.
- No direct CAD generation from the glam render output.
- No cross-tenant shared mutable state.

## 3. Canonical entity model

### 3.1 Naming decisions

| Name | Keep / reject | Canonical meaning |
| --- | --- | --- |
| `generations` | Keep | An async attempt to produce a new design candidate from create or refine input. |
| `designs` | Keep | The durable versioned concept resource that the user can later select and send downstream. |
| `generation_pairs` | Keep | The first-class `pair_v1` output bundle for a successful generation: one sketch asset and one render asset tied to one design candidate. |
| `selected_designs` | Reject | Do not create a table. Selection is state on `projects.selected_design_id` plus `designs.selection_state`. |
| `design_specs` | Keep | Strict structured output generated from the selected design by the Spec Agent. Versioned per design. |
| `technical_sheets` | Keep | Versioned `tech_v1` documents derived from the latest successful spec. |
| `svg_assets` | Keep | Versioned grouped SVG output set for the design: front, side, top, and manifest. |
| `cad_jobs` | Keep | Versioned async CAD/export job rows for the design after SVG exists. |

### 3.2 Canonical relationships

- A tenant owns many projects.
- A project owns many designs and many generations.
- A generation belongs to exactly one design.
- A successful generation creates exactly one `generation_pairs` row.
- A design may have a parent design when it was created by refine.
- A project may have at most one currently selected design.
- A selected design may have many versioned downstream outputs: specs, technical sheets, SVG asset sets, and CAD jobs.
- All binary or document artifacts live in R2 and are represented by `artifacts` rows in D1.

### 3.3 Selection model

Because v1 has no public `POST /select` endpoint:

- every generated or refined design starts as `selection_state = 'candidate'`
- `projects.selected_design_id` is `NULL` until the user pushes one candidate into the downstream flow
- the first accepted call to any of:
  - `POST /v1/designs/:designId/spec`
  - `POST /v1/designs/:designId/technical-sheet`
  - `POST /v1/designs/:designId/svg`
  - `POST /v1/designs/:designId/cad`
  promotes that design to `selection_state = 'selected'`
- the previously selected design in the same project becomes `selection_state = 'superseded'`

This keeps the official public API unchanged while making selection persistence explicit.

### 3.4 Design versioning model

- `POST /v1/generate-design` creates a new design candidate.
- `POST /v1/designs/:designId/refine` creates a new child design candidate with `parent_design_id = :designId`; it does not mutate the source design in place.
- Downstream spec/technical-sheet/svg/cad runs do not create a new design row. They create new version rows attached to the selected design.

### 3.5 Canonical `design_dna`

The reusable parts of the current frontend become the canonical `design_dna` shape:

```ts
type DesignDna = {
  jewelryType: 'ring' | 'necklace' | 'earrings' | 'bracelet' | 'pendant';
  metal: 'gold' | 'silver' | 'platinum' | 'rose-gold';
  gemstones: Array<'diamond' | 'ruby' | 'emerald' | 'sapphire' | 'pearl'>;
  style:
    | 'contemporary'
    | 'minimalist'
    | 'vintage'
    | 'temple'
    | 'floral'
    | 'geometric';
  complexity: number; // 0-100
  bandStyle: string;
  settingType: string;
  stonePosition: string;
  profile: string;
  motif: string;
  fingerprintSha256: string;
};
```

This reuses the useful current concepts from `DesignFeatures` and `DesignVariation`, but moves them into a backend-owned immutable contract.

### 3.6 `pair_v1` and `tech_v1`

`pair_v1` is locked as:

- exactly two artifacts
- one sketch-style design sheet image
- one glam render image
- both tied to the same `design_dna.fingerprintSha256`
- both available through `GET /v1/generations/:generationId` when generation succeeds

`tech_v1` is locked as:

- generated from the latest successful `design_spec`
- one strict JSON document plus one PDF render
- contains dimensions, materials, gemstone schedule, tolerances, construction notes, risk flags, and explicit unknowns

## 4. D1 schema proposal

### 4.1 Shared conventions

- All IDs are prefixed ULIDs stored as `TEXT`.
- All timestamps are UTC ISO 8601 strings stored as `TEXT`.
- All `*_json` columns store canonical JSON validated by Zod before write.
- Every domain table carries `tenant_id`.
- No domain table stores naked public R2 URLs. D1 stores artifact IDs and R2 keys only.

### 4.2 Table boundaries

Control plane:

- `tenants`
- `users`
- `project_memberships`
- `projects`
- `idempotency_records`

Generation lane:

- `designs`
- `generations`
- `generation_pairs`

Downstream workflow lane:

- `design_workflow_runs`
- `design_specs`
- `technical_sheets`
- `svg_assets`
- `cad_jobs`

Artifact registry:

- `artifacts`

### 4.3 Tables

`tenants`

- `id TEXT PRIMARY KEY` (`ten_`)
- `slug TEXT NOT NULL UNIQUE`
- `name TEXT NOT NULL`
- `plan_tier TEXT NOT NULL CHECK(plan_tier IN ('free','pro','enterprise'))`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

`users`

- `id TEXT PRIMARY KEY` (`usr_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `auth_subject TEXT NOT NULL UNIQUE`
- `email TEXT NOT NULL`
- `display_name TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

`project_memberships`

- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `user_id TEXT NOT NULL REFERENCES users(id)`
- `role TEXT NOT NULL CHECK(role IN ('owner','editor','viewer'))`
- `created_at TEXT NOT NULL`
- `PRIMARY KEY(project_id, user_id)`

`projects`

- `id TEXT PRIMARY KEY` (`prj_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `created_by_user_id TEXT NOT NULL REFERENCES users(id)`
- `name TEXT NOT NULL`
- `description TEXT`
- `status TEXT NOT NULL CHECK(status IN ('active','archived')) DEFAULT 'active'`
- `selected_design_id TEXT REFERENCES designs(id)`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

`designs`

- `id TEXT PRIMARY KEY` (`dsn_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `created_by_user_id TEXT NOT NULL REFERENCES users(id)`
- `parent_design_id TEXT REFERENCES designs(id)`
- `source_kind TEXT NOT NULL CHECK(source_kind IN ('create','refine'))`
- `selection_state TEXT NOT NULL CHECK(selection_state IN ('candidate','selected','superseded','archived')) DEFAULT 'candidate'`
- `display_name TEXT NOT NULL`
- `prompt_summary TEXT NOT NULL`
- `prompt_input_json TEXT NOT NULL`
- `design_dna_json TEXT NOT NULL`
- `latest_pair_id TEXT REFERENCES generation_pairs(id)`
- `latest_spec_id TEXT REFERENCES design_specs(id)`
- `latest_technical_sheet_id TEXT REFERENCES technical_sheets(id)`
- `latest_svg_asset_id TEXT REFERENCES svg_assets(id)`
- `latest_cad_job_id TEXT REFERENCES cad_jobs(id)`
- `latest_workflow_run_id TEXT REFERENCES design_workflow_runs(id)`
- `search_text TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `selected_at TEXT`
- `updated_at TEXT NOT NULL`
- `archived_at TEXT`

`generations`

- `id TEXT PRIMARY KEY` (`gen_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `design_id TEXT NOT NULL REFERENCES designs(id)`
- `requested_by_user_id TEXT NOT NULL REFERENCES users(id)`
- `base_design_id TEXT REFERENCES designs(id)`
- `request_kind TEXT NOT NULL CHECK(request_kind IN ('create','refine'))`
- `status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed','canceled'))`
- `pair_standard_version TEXT NOT NULL CHECK(pair_standard_version = 'pair_v1')`
- `request_json TEXT NOT NULL`
- `request_hash TEXT NOT NULL`
- `idempotency_key TEXT NOT NULL`
- `prompt_agent_output_json TEXT`
- `error_code TEXT`
- `error_message TEXT`
- `created_at TEXT NOT NULL`
- `started_at TEXT`
- `completed_at TEXT`
- `updated_at TEXT NOT NULL`

`generation_pairs`

- `id TEXT PRIMARY KEY` (`pair_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `design_id TEXT NOT NULL REFERENCES designs(id)`
- `generation_id TEXT NOT NULL UNIQUE REFERENCES generations(id)`
- `pair_standard_version TEXT NOT NULL CHECK(pair_standard_version = 'pair_v1')`
- `sketch_artifact_id TEXT NOT NULL REFERENCES artifacts(id)`
- `render_artifact_id TEXT NOT NULL REFERENCES artifacts(id)`
- `pair_manifest_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

`design_workflow_runs`

- `id TEXT PRIMARY KEY` (`wfr_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `design_id TEXT NOT NULL REFERENCES designs(id)`
- `requested_by_user_id TEXT NOT NULL REFERENCES users(id)`
- `requested_target_stage TEXT NOT NULL CHECK(requested_target_stage IN ('spec','technical_sheet','svg','cad'))`
- `current_stage TEXT NOT NULL CHECK(current_stage IN ('none','spec','technical_sheet','svg','cad','complete'))`
- `workflow_status TEXT NOT NULL CHECK(workflow_status IN ('queued','running','succeeded','failed','canceled'))`
- `spec_status TEXT NOT NULL CHECK(spec_status IN ('not_requested','queued','running','succeeded','failed','skipped'))`
- `technical_sheet_status TEXT NOT NULL CHECK(technical_sheet_status IN ('not_requested','queued','running','succeeded','failed','skipped'))`
- `svg_status TEXT NOT NULL CHECK(svg_status IN ('not_requested','queued','running','succeeded','failed','skipped'))`
- `cad_status TEXT NOT NULL CHECK(cad_status IN ('not_requested','queued','running','succeeded','failed','skipped'))`
- `latest_spec_id TEXT REFERENCES design_specs(id)`
- `latest_technical_sheet_id TEXT REFERENCES technical_sheets(id)`
- `latest_svg_asset_id TEXT REFERENCES svg_assets(id)`
- `latest_cad_job_id TEXT REFERENCES cad_jobs(id)`
- `force_regenerate INTEGER NOT NULL DEFAULT 0`
- `last_error_code TEXT`
- `last_error_message TEXT`
- `created_at TEXT NOT NULL`
- `started_at TEXT`
- `completed_at TEXT`
- `updated_at TEXT NOT NULL`

`design_specs`

- `id TEXT PRIMARY KEY` (`spc_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `design_id TEXT NOT NULL REFERENCES designs(id)`
- `workflow_run_id TEXT NOT NULL REFERENCES design_workflow_runs(id)`
- `source_pair_id TEXT NOT NULL REFERENCES generation_pairs(id)`
- `spec_version INTEGER NOT NULL`
- `status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed'))`
- `spec_standard_version TEXT NOT NULL CHECK(spec_standard_version = 'spec_v1')`
- `agent_output_json TEXT`
- `risk_flags_json TEXT NOT NULL DEFAULT '[]'`
- `unknowns_json TEXT NOT NULL DEFAULT '[]'`
- `created_at TEXT NOT NULL`
- `completed_at TEXT`
- `updated_at TEXT NOT NULL`
- `UNIQUE(design_id, spec_version)`

`technical_sheets`

- `id TEXT PRIMARY KEY` (`tch_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `design_id TEXT NOT NULL REFERENCES designs(id)`
- `workflow_run_id TEXT NOT NULL REFERENCES design_workflow_runs(id)`
- `source_spec_id TEXT NOT NULL REFERENCES design_specs(id)`
- `tech_version INTEGER NOT NULL`
- `status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed'))`
- `tech_standard_version TEXT NOT NULL CHECK(tech_standard_version = 'tech_v1')`
- `sheet_json TEXT`
- `json_artifact_id TEXT REFERENCES artifacts(id)`
- `pdf_artifact_id TEXT REFERENCES artifacts(id)`
- `created_at TEXT NOT NULL`
- `completed_at TEXT`
- `updated_at TEXT NOT NULL`
- `UNIQUE(design_id, tech_version)`

`svg_assets`

- `id TEXT PRIMARY KEY` (`svg_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `design_id TEXT NOT NULL REFERENCES designs(id)`
- `workflow_run_id TEXT NOT NULL REFERENCES design_workflow_runs(id)`
- `source_technical_sheet_id TEXT NOT NULL REFERENCES technical_sheets(id)`
- `svg_version INTEGER NOT NULL`
- `status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed'))`
- `svg_standard_version TEXT NOT NULL CHECK(svg_standard_version = 'svg_v1')`
- `manifest_json TEXT`
- `front_artifact_id TEXT REFERENCES artifacts(id)`
- `side_artifact_id TEXT REFERENCES artifacts(id)`
- `top_artifact_id TEXT REFERENCES artifacts(id)`
- `annotation_artifact_id TEXT REFERENCES artifacts(id)`
- `created_at TEXT NOT NULL`
- `completed_at TEXT`
- `updated_at TEXT NOT NULL`
- `UNIQUE(design_id, svg_version)`

`cad_jobs`

- `id TEXT PRIMARY KEY` (`cad_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `design_id TEXT NOT NULL REFERENCES designs(id)`
- `workflow_run_id TEXT NOT NULL REFERENCES design_workflow_runs(id)`
- `source_svg_asset_id TEXT NOT NULL REFERENCES svg_assets(id)`
- `cad_version INTEGER NOT NULL`
- `status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed','canceled'))`
- `requested_formats_json TEXT NOT NULL`
- `cad_prep_output_json TEXT`
- `package_artifact_id TEXT REFERENCES artifacts(id)`
- `qa_report_artifact_id TEXT REFERENCES artifacts(id)`
- `created_at TEXT NOT NULL`
- `started_at TEXT`
- `completed_at TEXT`
- `updated_at TEXT NOT NULL`
- `UNIQUE(design_id, cad_version)`

`artifacts`

- `id TEXT PRIMARY KEY` (`art_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `project_id TEXT NOT NULL REFERENCES projects(id)`
- `design_id TEXT NOT NULL REFERENCES designs(id)`
- `producer_type TEXT NOT NULL CHECK(producer_type IN ('generation_pair','technical_sheet','svg','cad'))`
- `artifact_kind TEXT NOT NULL CHECK(artifact_kind IN (
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
))`
- `r2_key TEXT NOT NULL UNIQUE`
- `file_name TEXT NOT NULL`
- `content_type TEXT NOT NULL`
- `byte_size INTEGER`
- `sha256 TEXT NOT NULL`
- `created_at TEXT NOT NULL`

`idempotency_records`

- `id TEXT PRIMARY KEY` (`idm_`)
- `tenant_id TEXT NOT NULL REFERENCES tenants(id)`
- `endpoint_name TEXT NOT NULL`
- `idempotency_key TEXT NOT NULL`
- `request_hash TEXT NOT NULL`
- `response_status_code INTEGER NOT NULL`
- `response_json TEXT NOT NULL`
- `primary_resource_type TEXT NOT NULL`
- `primary_resource_id TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `expires_at TEXT NOT NULL`
- `UNIQUE(tenant_id, endpoint_name, idempotency_key)`

### 4.4 Indexes that matter

Minimum indexes to create in the first migration pack:

- `projects(tenant_id, updated_at DESC)`
- `designs(tenant_id, project_id, created_at DESC)`
- `designs(project_id, selection_state, updated_at DESC)`
- `designs(parent_design_id)`
- `generations(tenant_id, status, created_at DESC)`
- `generations(design_id, created_at DESC)`
- `generation_pairs(design_id, created_at DESC)`
- `design_workflow_runs(design_id, created_at DESC)`
- `design_specs(design_id, spec_version DESC)`
- `technical_sheets(design_id, tech_version DESC)`
- `svg_assets(design_id, svg_version DESC)`
- `cad_jobs(design_id, cad_version DESC)`
- `artifacts(design_id, artifact_kind, created_at DESC)`
- `idempotency_records(tenant_id, endpoint_name, created_at DESC)`

### 4.5 Why this schema, not the Phase 0 generic CRUD shape

- No generic `jobs` table. Typed async rows are easier to validate, query, and reason about.
- No `selected_designs` table. Selection is state, not an entity.
- No `design_versions` table. A refined design is a new design row with `parent_design_id`.
- No chat tables in v1. Chat/copilot is outside the locked public API.

## 5. Public API contracts

### 5.1 Shared TypeScript / Zod primitives

```ts
import { z } from 'zod';

const ulidPart = '[0-9A-HJKMNP-TV-Z]{26}';
const prefixedId = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_${ulidPart}$`));

const TenantIdSchema = prefixedId('ten');
const UserIdSchema = prefixedId('usr');
const ProjectIdSchema = prefixedId('prj');
const DesignIdSchema = prefixedId('dsn');
const GenerationIdSchema = prefixedId('gen');
const PairIdSchema = prefixedId('pair');
const SpecIdSchema = prefixedId('spc');
const TechSheetIdSchema = prefixedId('tch');
const SvgAssetIdSchema = prefixedId('svg');
const CadJobIdSchema = prefixedId('cad');
const ArtifactIdSchema = prefixedId('art');
const WorkflowRunIdSchema = prefixedId('wfr');

const IsoTimestampSchema = z.string().datetime({ offset: true });
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

const JewelryTypeEnum = z.enum([
  'ring',
  'necklace',
  'earrings',
  'bracelet',
  'pendant',
]);

const MetalEnum = z.enum(['gold', 'silver', 'platinum', 'rose-gold']);
const GemstoneEnum = z.enum([
  'diamond',
  'ruby',
  'emerald',
  'sapphire',
  'pearl',
]);

const StyleEnum = z.enum([
  'contemporary',
  'minimalist',
  'vintage',
  'temple',
  'floral',
  'geometric',
]);

const GenerationStatusEnum = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'canceled',
]);

const SelectionStateEnum = z.enum([
  'candidate',
  'selected',
  'superseded',
  'archived',
]);

const WorkflowTargetStageEnum = z.enum([
  'spec',
  'technical_sheet',
  'svg',
  'cad',
]);

const WorkflowStatusEnum = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'canceled',
]);

const StepStatusEnum = z.enum([
  'not_requested',
  'queued',
  'running',
  'succeeded',
  'failed',
  'skipped',
]);

const ArtifactKindEnum = z.enum([
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
  'cad_qa_report_json',
]);

const VariationOverrideSchema = z.object({
  bandStyle: z.string().trim().min(1).max(120).optional(),
  settingType: z.string().trim().min(1).max(120).optional(),
  stonePosition: z.string().trim().min(1).max(120).optional(),
  profile: z.string().trim().min(1).max(120).optional(),
  motif: z.string().trim().min(1).max(120).optional(),
});

const CreateDesignInputSchema = z.object({
  projectId: ProjectIdSchema,
  jewelryType: JewelryTypeEnum,
  metal: MetalEnum,
  gemstones: z.array(GemstoneEnum).max(5),
  style: StyleEnum,
  complexity: z.number().int().min(0).max(100),
  variationOverrides: VariationOverrideSchema.optional(),
  userNotes: z.string().trim().max(1200).optional(),
  pairStandardVersion: z.literal('pair_v1').default('pair_v1'),
});

const ArtifactPublicSchema = z.object({
  artifactId: ArtifactIdSchema,
  kind: ArtifactKindEnum,
  contentType: z.string().min(1),
  byteSize: z.number().int().nonnegative(),
  sha256: Sha256Schema,
  signedUrl: z.string().url(),
});

const StageStatusesSchema = z.object({
  spec: StepStatusEnum,
  technicalSheet: StepStatusEnum,
  svg: StepStatusEnum,
  cad: StepStatusEnum,
});

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      'invalid_request',
      'not_found',
      'conflict',
      'idempotency_conflict',
      'agent_validation_failed',
      'provider_failure',
      'storage_failure',
      'workflow_failed',
    ]),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
```

### 5.2 `POST /v1/prompt-preview`

Purpose:

- preview normalized create input and prompt plan
- does not create a design
- does not create a generation

```ts
export const PromptPreviewRequestSchema = CreateDesignInputSchema;

export const PromptPreviewResponseSchema = z.object({
  projectId: ProjectIdSchema,
  promptPreviewVersion: z.literal('prompt_preview.v1'),
  pairStandardVersion: z.literal('pair_v1'),
  normalizedInput: CreateDesignInputSchema.omit({ projectId: true }),
  designDnaPreview: z.object({
    jewelryType: JewelryTypeEnum,
    metal: MetalEnum,
    gemstones: z.array(GemstoneEnum),
    style: StyleEnum,
    complexity: z.number().int().min(0).max(100),
    bandStyle: z.string().min(1).max(120),
    settingType: z.string().min(1).max(120),
    stonePosition: z.string().min(1).max(120),
    profile: z.string().min(1).max(120),
    motif: z.string().min(1).max(120),
  }),
  promptSummary: z.string().min(1).max(240),
  promptText: z.string().min(1).max(8000),
});
```

Response code:

- `200 OK`

Idempotency:

- not required

### 5.3 `POST /v1/generate-design`

Purpose:

- create a new design candidate
- create a generation row
- enqueue the generate lane

Headers:

- `Idempotency-Key` required

```ts
export const GenerateDesignRequestSchema = CreateDesignInputSchema.extend({
  promptTextOverride: z.string().trim().min(1).max(8000).optional(),
});

export const GenerateDesignResponseSchema = z.object({
  generationId: GenerationIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  status: z.enum(['queued', 'running']),
  pairStandardVersion: z.literal('pair_v1'),
  createdAt: IsoTimestampSchema,
});
```

Response code:

- `202 Accepted`

### 5.4 `GET /v1/generations/:generationId`

Purpose:

- poll generation state
- return the `pair_v1` output when ready

```ts
export const GenerationStatusResponseSchema = z.object({
  generationId: GenerationIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  requestKind: z.enum(['create', 'refine']),
  status: GenerationStatusEnum,
  pairStandardVersion: z.literal('pair_v1'),
  createdAt: IsoTimestampSchema,
  startedAt: IsoTimestampSchema.nullable(),
  completedAt: IsoTimestampSchema.nullable(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .nullable(),
  pair: z
    .object({
      pairId: PairIdSchema,
      selectionState: SelectionStateEnum,
      sketch: ArtifactPublicSchema.refine((a) => a.kind === 'pair_sketch_png'),
      render: ArtifactPublicSchema.refine((a) => a.kind === 'pair_render_png'),
    })
    .nullable(),
});
```

Response code:

- `200 OK`

### 5.5 `POST /v1/designs/:designId/refine`

Purpose:

- create a new child design candidate
- enqueue the refine lane
- keep the source design immutable

Headers:

- `Idempotency-Key` required

```ts
export const RefinePresetEnum = z.enum([
  'polish',
  'explore',
  'simplify',
  'luxury',
  'manufacturable',
]);

export const RefineRequestSchema = z.object({
  instruction: z.string().trim().min(1).max(1200),
  preset: RefinePresetEnum.optional(),
  preserve: z
    .array(z.enum(['metal', 'gemstones', 'style', 'silhouette']))
    .default([]),
  pairStandardVersion: z.literal('pair_v1').default('pair_v1'),
});

export const RefineResponseSchema = z.object({
  generationId: GenerationIdSchema,
  sourceDesignId: DesignIdSchema,
  refinedDesignId: DesignIdSchema,
  status: z.enum(['queued', 'running']),
  createdAt: IsoTimestampSchema,
});
```

Response code:

- `202 Accepted`

### 5.6 Shared downstream stage response

All downstream design-stage POST endpoints return the same shape.

```ts
export const WorkflowStageResponseSchema = z.object({
  workflowRunId: WorkflowRunIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  selectionState: SelectionStateEnum,
  requestedTargetStage: WorkflowTargetStageEnum,
  currentStage: z.enum(['none', 'spec', 'technical_sheet', 'svg', 'cad', 'complete']),
  workflowStatus: WorkflowStatusEnum,
  stageStatuses: StageStatusesSchema,
  latestSpecId: SpecIdSchema.nullable(),
  latestTechnicalSheetId: TechSheetIdSchema.nullable(),
  latestSvgAssetId: SvgAssetIdSchema.nullable(),
  latestCadJobId: CadJobIdSchema.nullable(),
  updatedAt: IsoTimestampSchema,
});
```

### 5.7 `POST /v1/designs/:designId/spec`

Headers:

- `Idempotency-Key` required

```ts
export const SizeContextSchema = z.object({
  ringSizeUs: z.string().trim().max(12).optional(),
  braceletLengthMm: z.number().positive().max(400).optional(),
  necklaceLengthMm: z.number().positive().max(1200).optional(),
});

export const SpecRequestSchema = z.object({
  manufacturingIntent: z
    .enum(['concept', 'prototype', 'production_ready'])
    .default('prototype'),
  sizeContext: SizeContextSchema.optional(),
  forceRegenerate: z.boolean().default(false),
});
```

Response code:

- `202 Accepted` when work was queued or resumed
- `200 OK` when an existing ready spec already satisfies the request and `forceRegenerate = false`

### 5.8 `POST /v1/designs/:designId/technical-sheet`

Headers:

- `Idempotency-Key` required

```ts
export const TechnicalSheetRequestSchema = z.object({
  includePdf: z.boolean().default(true),
  forceRegenerate: z.boolean().default(false),
});
```

Response code:

- `202 Accepted` when work was queued or resumed
- `200 OK` when an existing ready technical sheet already satisfies the request and `forceRegenerate = false`

### 5.9 `POST /v1/designs/:designId/svg`

Headers:

- `Idempotency-Key` required

```ts
export const SvgRequestSchema = z.object({
  views: z
    .array(z.enum(['front', 'side', 'top']))
    .min(1)
    .default(['front', 'side', 'top']),
  includeAnnotations: z.boolean().default(true),
  forceRegenerate: z.boolean().default(false),
});
```

Response code:

- `202 Accepted` when work was queued or resumed
- `200 OK` when an existing ready SVG asset set already satisfies the request and `forceRegenerate = false`

### 5.10 `POST /v1/designs/:designId/cad`

Headers:

- `Idempotency-Key` required

```ts
export const CadRequestSchema = z.object({
  formats: z.array(z.enum(['step', 'dxf', 'stl'])).min(1),
  includeQaReport: z.boolean().default(true),
  forceRegenerate: z.boolean().default(false),
});
```

Response code:

- `202 Accepted` when work was queued or resumed
- `200 OK` when an existing ready CAD job already satisfies the request and `forceRegenerate = false`

### 5.11 `POST /v1/gallery/search`

Purpose:

- search designs, not generations
- search across the current tenant
- optionally filter to one project

```ts
export const GallerySearchRequestSchema = z.object({
  projectId: ProjectIdSchema.optional(),
  query: z.string().trim().max(200).default(''),
  filters: z
    .object({
      jewelryTypes: z.array(JewelryTypeEnum).optional(),
      metals: z.array(MetalEnum).optional(),
      styles: z.array(StyleEnum).optional(),
      selectionStates: z.array(SelectionStateEnum).optional(),
      readiness: z
        .array(z.enum(['pair_ready', 'spec_ready', 'technical_sheet_ready', 'svg_ready', 'cad_ready']))
        .optional(),
    })
    .default({}),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(24),
  sort: z.enum(['newest', 'updated', 'selected']).default('newest'),
});

export const GallerySearchResponseSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      designId: DesignIdSchema,
      projectId: ProjectIdSchema,
      displayName: z.string(),
      promptSummary: z.string(),
      selectionState: SelectionStateEnum,
      latestPairId: PairIdSchema.nullable(),
      coverImage: ArtifactPublicSchema.nullable(),
      stageStatuses: StageStatusesSchema,
      updatedAt: IsoTimestampSchema,
    }),
  ),
});
```

Response code:

- `200 OK`

Idempotency:

- not required

### 5.12 `GET /v1/projects/:projectId`

Purpose:

- return project summary
- expose current selected design
- provide recent design and generation summaries without introducing additional public list endpoints

```ts
export const ProjectResponseSchema = z.object({
  project: z.object({
    id: ProjectIdSchema,
    tenantId: TenantIdSchema,
    name: z.string().min(1).max(160),
    description: z.string().nullable(),
    status: z.enum(['active', 'archived']),
    selectedDesignId: DesignIdSchema.nullable(),
    designCount: z.number().int().nonnegative(),
    createdAt: IsoTimestampSchema,
    updatedAt: IsoTimestampSchema,
  }),
  selectedDesign: z
    .object({
      designId: DesignIdSchema,
      displayName: z.string(),
      promptSummary: z.string(),
      selectionState: SelectionStateEnum,
      latestPairId: PairIdSchema.nullable(),
      latestSpecId: SpecIdSchema.nullable(),
      latestTechnicalSheetId: TechSheetIdSchema.nullable(),
      latestSvgAssetId: SvgAssetIdSchema.nullable(),
      latestCadJobId: CadJobIdSchema.nullable(),
      stageStatuses: StageStatusesSchema,
      updatedAt: IsoTimestampSchema,
    })
    .nullable(),
  recentDesigns: z.array(
    z.object({
      designId: DesignIdSchema,
      displayName: z.string(),
      selectionState: SelectionStateEnum,
      updatedAt: IsoTimestampSchema,
    }),
  ),
  recentGenerations: z.array(
    z.object({
      generationId: GenerationIdSchema,
      designId: DesignIdSchema,
      status: GenerationStatusEnum,
      createdAt: IsoTimestampSchema,
    }),
  ),
});
```

Response code:

- `200 OK`

## 6. Agent output schemas

Validation rule:

- every agent output must parse with its schema before any D1 row is marked successful
- schema mismatch is a hard failure with `agent_validation_failed`

Shared helper:

```ts
const MeasuredValueSchema = z.object({
  value: z.number().positive().nullable(),
  unit: z.enum(['mm', 'g', 'ct']),
  source: z.enum(['user_input', 'pair_inference', 'rule', 'unknown']),
  confidence: z.number().min(0).max(1),
});
```

### 6.1 Prompt Agent output

```ts
export const PromptAgentOutputSchema = z.object({
  schemaVersion: z.literal('prompt_agent.v1'),
  mode: z.enum(['generate', 'refine']),
  projectId: ProjectIdSchema,
  designId: DesignIdSchema,
  sourceDesignId: DesignIdSchema.optional(),
  pairStandardVersion: z.literal('pair_v1'),
  normalizedInput: CreateDesignInputSchema.omit({ projectId: true }).extend({
    refinementInstruction: z.string().trim().max(1200).optional(),
  }),
  designDna: z.object({
    jewelryType: JewelryTypeEnum,
    metal: MetalEnum,
    gemstones: z.array(GemstoneEnum),
    style: StyleEnum,
    complexity: z.number().int().min(0).max(100),
    bandStyle: z.string().min(1).max(120),
    settingType: z.string().min(1).max(120),
    stonePosition: z.string().min(1).max(120),
    profile: z.string().min(1).max(120),
    motif: z.string().min(1).max(120),
    fingerprintSha256: Sha256Schema,
  }),
  promptBundle: z.object({
    sketchPrompt: z.string().min(1).max(8000),
    renderPrompt: z.string().min(1).max(8000),
    negativePrompt: z.string().max(4000).default(''),
  }),
  blocked: z.boolean(),
  blockReasons: z.array(z.string().min(1).max(240)),
});
```

### 6.2 Spec Agent output

```ts
const RiskFlagSchema = z.object({
  code: z.enum([
    'thin_structure',
    'unsupported_span',
    'unclear_dimensions',
    'stone_setting_risk',
    'manufacturing_ambiguity',
  ]),
  severity: z.enum(['low', 'medium', 'high']),
  message: z.string().min(1).max(240),
});

export const SpecAgentOutputSchema = z.object({
  schemaVersion: z.literal('spec_agent.v1'),
  designId: DesignIdSchema,
  pairId: PairIdSchema,
  specStandardVersion: z.literal('spec_v1'),
  summary: z.string().min(1).max(500),
  jewelryType: JewelryTypeEnum,
  materials: z.object({
    metal: MetalEnum,
    finish: z.string().trim().max(120).nullable(),
    gemstones: z.array(
      z.object({
        role: z.enum(['primary', 'accent']),
        stoneType: z.union([GemstoneEnum, z.string().min(1).max(80)]),
        shape: z.string().trim().max(80).nullable(),
        quantity: z.number().int().positive().nullable(),
        size: MeasuredValueSchema.nullable(),
        carat: MeasuredValueSchema.nullable(),
      }),
    ),
  }),
  dimensions: z.object({
    overallLength: MeasuredValueSchema.nullable(),
    overallWidth: MeasuredValueSchema.nullable(),
    overallHeight: MeasuredValueSchema.nullable(),
    bandWidth: MeasuredValueSchema.nullable(),
    bandThickness: MeasuredValueSchema.nullable(),
  }),
  construction: z.object({
    settingType: z.string().trim().max(120).nullable(),
    profile: z.string().trim().max(120).nullable(),
    manufacturingMethod: z.enum(['cast', 'fabricated', 'hybrid', 'unknown']),
    assemblyNotes: z.array(z.string().min(1).max(240)),
  }),
  riskFlags: z.array(RiskFlagSchema),
  unknowns: z.array(z.string().min(1).max(240)),
  humanReviewRequired: z.boolean(),
});
```

### 6.3 CAD Prep Agent output

```ts
export const CadPrepAgentOutputSchema = z.object({
  schemaVersion: z.literal('cad_prep_agent.v1'),
  designId: DesignIdSchema,
  specId: SpecIdSchema,
  technicalSheetId: TechSheetIdSchema,
  svgAssetId: SvgAssetIdSchema,
  requestedFormats: z.array(z.enum(['step', 'dxf', 'stl'])).min(1),
  modelingPlan: z.object({
    cleanupOperations: z.array(
      z.enum([
        'normalize_units',
        'close_open_paths',
        'flatten_transforms',
        'dedupe_nodes',
        'resolve_self_intersections',
        'label_views',
      ]),
    ),
    modelingSteps: z.array(z.string().min(1).max(240)).min(1).max(20),
    qaChecks: z.array(
      z.enum([
        'closed_paths',
        'consistent_units',
        'nonzero_thickness',
        'manifold_geometry',
        'gem_seat_clearance',
        'export_roundtrip',
      ]),
    ),
  }),
  blockers: z.array(
    z.object({
      code: z.enum([
        'missing_dimensions',
        'ambiguous_profile',
        'svg_invalid',
        'unsupported_geometry',
      ]),
      message: z.string().min(1).max(240),
      blocking: z.boolean(),
    }),
  ),
  requiresHumanReview: z.boolean(),
});
```

Design note:

- technical-sheet rendering is not a fourth agent
- SVG generation is a workflow/container step, not a fourth agent

## 7. Queue payload schemas

Rules:

- queue payloads are immutable snapshots
- queue consumers must not depend on browser state
- payload schemas are versioned independently from public request schemas

```ts
export const GenerateQueuePayloadSchema = z.object({
  schemaVersion: z.literal('generate_queue.v1'),
  generationId: GenerationIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  tenantId: TenantIdSchema,
  requestedByUserId: UserIdSchema,
  idempotencyKey: z.string().min(8).max(128),
  requestHash: Sha256Schema,
  queuedAt: IsoTimestampSchema,
  input: CreateDesignInputSchema.omit({ projectId: true }),
  promptTextOverride: z.string().max(8000).optional(),
});

export const RefineQueuePayloadSchema = z.object({
  schemaVersion: z.literal('refine_queue.v1'),
  generationId: GenerationIdSchema,
  baseDesignId: DesignIdSchema,
  refinedDesignId: DesignIdSchema,
  projectId: ProjectIdSchema,
  tenantId: TenantIdSchema,
  requestedByUserId: UserIdSchema,
  idempotencyKey: z.string().min(8).max(128),
  requestHash: Sha256Schema,
  queuedAt: IsoTimestampSchema,
  instruction: z.string().min(1).max(1200),
  preset: RefinePresetEnum.optional(),
  preserve: z.array(z.enum(['metal', 'gemstones', 'style', 'silhouette'])),
});

export const SpecQueuePayloadSchema = z.object({
  schemaVersion: z.literal('spec_queue.v1'),
  workflowRunId: WorkflowRunIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  tenantId: TenantIdSchema,
  requestedByUserId: UserIdSchema,
  pairId: PairIdSchema,
  targetStage: WorkflowTargetStageEnum,
  idempotencyKey: z.string().min(8).max(128),
  requestHash: Sha256Schema,
  queuedAt: IsoTimestampSchema,
  manufacturingIntent: z.enum(['concept', 'prototype', 'production_ready']),
  sizeContext: SizeContextSchema.optional(),
  forceRegenerate: z.boolean(),
});
```

## 8. Workflow state machine

### 8.1 Locked enums

Generation status:

- `queued`
- `running`
- `succeeded`
- `failed`
- `canceled`

Design selection state:

- `candidate`
- `selected`
- `superseded`
- `archived`

Workflow status:

- `queued`
- `running`
- `succeeded`
- `failed`
- `canceled`

Per-stage step status:

- `not_requested`
- `queued`
- `running`
- `succeeded`
- `failed`
- `skipped`

### 8.2 State machine

```text
create/refine request
  -> generation queued
  -> generation running
  -> generation succeeded -> pair_v1 ready -> design remains candidate
  -> generation failed    -> no pair row

candidate design
  -> first downstream stage POST accepted
  -> design becomes selected
  -> project.selected_design_id updated

selected design
  -> workflow target = spec
  -> workflow target = technical_sheet
  -> workflow target = svg
  -> workflow target = cad

workflow steps always execute in order:
spec -> technical_sheet -> svg -> cad
```

### 8.3 Transition rules

| Trigger | Before | After |
| --- | --- | --- |
| `POST /v1/generate-design` | no generation | `generations.status = queued`, `designs.selection_state = candidate` |
| generate consumer starts | `queued` | `running` |
| generate consumer succeeds | `running` | `succeeded`, `generation_pairs` row created, `designs.latest_pair_id` updated |
| generate consumer fails | `running` | `failed` |
| first accepted downstream stage POST | `candidate` | chosen design becomes `selected`; previous project selection becomes `superseded` |
| `POST /spec` | no active workflow or completed workflow | workflow run created/resumed with target `spec` |
| `POST /technical-sheet` | no active workflow or lower target | workflow target escalates to `technical_sheet` |
| `POST /svg` | no active workflow or lower target | workflow target escalates to `svg` |
| `POST /cad` | no active workflow or lower target | workflow target escalates to `cad` |
| active workflow receives higher target | `queued` or `running` | update the same active `design_workflow_runs` row, do not create a parallel active run |
| any stage fails | running | stage status becomes `failed`, workflow becomes `failed` |
| later retry with new idempotency key and `forceRegenerate=true` | failed or succeeded | create a new version row for the requested stage and continue forward |

### 8.4 Dependency semantics

- `technical-sheet` depends on a successful `design_spec`
- `svg` depends on a successful `technical_sheet`
- `cad` depends on a successful `svg_assets`
- higher-stage endpoints are allowed to request the full chain up to that stage
- the workflow skips already-ready stages when `forceRegenerate = false`

## 9. Idempotency and artifact naming rules

### 9.1 Idempotency model

Required `Idempotency-Key` headers:

- `POST /v1/generate-design`
- `POST /v1/designs/:designId/refine`
- `POST /v1/designs/:designId/spec`
- `POST /v1/designs/:designId/technical-sheet`
- `POST /v1/designs/:designId/svg`
- `POST /v1/designs/:designId/cad`

Not required:

- `POST /v1/prompt-preview`
- `POST /v1/gallery/search`
- `GET /v1/generations/:generationId`
- `GET /v1/projects/:projectId`

Locked behavior:

- idempotency scope is `(tenant_id, endpoint_name, idempotency_key)`
- server computes `request_hash = sha256(canonical_json_body + normalized_path_params + tenant_id)`
- same key + same hash: replay stored response exactly
- same key + different hash: `409 conflict` with `idempotency_conflict`
- record retention for `idempotency_records`: 72 hours
- generate/refine idempotency must prevent duplicate queue publishes and duplicate design/generation rows
- downstream stage idempotency must prevent duplicate workflow runs for the same request

### 9.2 Artifact naming rules

Global rules:

- all R2 keys are lowercase
- keys are deterministic and ID-based; do not include timestamps
- public URLs are always signed at read time; never stored
- `artifacts.r2_key` is the single source of truth

R2 key templates:

| Artifact kind | Key template |
| --- | --- |
| pair sketch | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/pairs/{pairId}/sketch.png` |
| pair render | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/pairs/{pairId}/render.png` |
| technical sheet json | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/technical-sheets/{techSheetId}/sheet.json` |
| technical sheet pdf | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/technical-sheets/{techSheetId}/sheet.pdf` |
| svg front | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/svg/{svgAssetId}/front.svg` |
| svg side | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/svg/{svgAssetId}/side.svg` |
| svg top | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/svg/{svgAssetId}/top.svg` |
| svg annotations | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/svg/{svgAssetId}/annotations.json` |
| cad step | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/cad/{cadJobId}/model.step` |
| cad dxf | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/cad/{cadJobId}/model.dxf` |
| cad stl | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/cad/{cadJobId}/model.stl` |
| cad package zip | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/cad/{cadJobId}/package.zip` |
| cad QA report | `tenants/{tenantId}/projects/{projectId}/designs/{designId}/cad/{cadJobId}/qa-report.json` |

## 10. Reuse / refactor / rebuild decisions

### 10.1 Reuse directly as domain inputs

| Current asset | Decision | How it maps |
| --- | --- | --- |
| `src/app/services/variationEngine.ts` | Reuse after extraction | Keep the five variation axes and per-jewelry-type option sets. They become backend-owned `design_dna` dimensions, not UI-only randomness. |
| `src/app/utils/promptGenerator.ts` | Reuse after refactor | Keep the composition-first prompt strategy and descriptive vocab. Do not treat the current raw prompt string as a stable public contract. |
| `src/app/services/storageService.ts` `DesignFeatures` | Reuse field ideas only | `type`, `metal`, `gemstones`, `style`, `complexity` become canonical create input fields. |
| `src/app/services/storageService.ts` `DesignVariation` | Reuse field ideas only | `bandStyle`, `settingType`, `stonePosition`, `profile`, `motif` become canonical `design_dna` fields. |
| `src/app/screens/DesignGenerator.tsx` enum values | Reuse initial controlled vocab | Ring, necklace, earrings, bracelet, pendant; gold, silver, platinum, rose-gold; diamond, ruby, emerald, sapphire, pearl; contemporary, minimalist, vintage, temple, floral, geometric. |

### 10.2 Refactor hard

| Current asset | Decision | Why |
| --- | --- | --- |
| `DesignMetadata` from `storageService.ts` | Split and rename | Current local card model becomes `designs` plus `generation_pairs` plus `artifacts`; `liked`, `notes`, and browser timestamps are not core backend truth. |
| `promptGenerator.ts` variation injection | Keep concept, not API | Variation override stays internal to Prompt Agent; public requests do not ask for N generated variations. |
| Current route assumptions in `routes.tsx` | Frontend must adapt later | Backend contract is anchored to the official flow and endpoint list, not the current route shell. |

### 10.3 Rebuild from scratch

| Missing or invalid current area | Decision |
| --- | --- |
| localStorage persistence | Rebuild as D1 repositories plus R2 artifacts |
| any backend client or REST layer | Build fresh in the API Worker |
| auth and tenant enforcement | Build fresh at Worker middleware boundary |
| async job handling | Build as typed queues and workflow runs, not a generic jobs API |
| spec / technical sheet / SVG / CAD pipeline | Build fresh from the locked state machine in this pack |
| hardcoded preview metrics, cost estimates, and manufacturing readiness in `DesignPreview.tsx` | Ignore completely as backend truth |

## 11. Remaining blockers or open questions

No contract blockers remain for Phase 2.

Deferred implementation choices that do not change this contract:

- which auth vendor supplies the upstream `auth_subject`
- exact AI Gateway provider selection and fallback order per model class
- exact PDF renderer for `tech_v1`
- exact container image/toolchain used in `svg` and `cad` steps

Those are implementation details behind already-locked interfaces.

## 12. Recommended implementation task wave after this contract pack

1. Create a shared contracts package.
   Scope: add all ID helpers, enums, Zod schemas, and exported TypeScript types from Sections 5-7.
   Validation: parsing tests for every public request/response and every agent/queue schema.

2. Add the D1 migration pack for the schema in Section 4.
   Scope: tables, constraints, indexes, and version columns.
   Validation: migrations apply cleanly to local D1 and produce expected indexes.

3. Scaffold the API Worker boundary and bindings.
   Scope: `/v1/*` router, auth/tenant middleware, idempotency middleware, D1/R2/Queue/Workflow bindings.
   Validation: authenticated request reaches a stubbed route with tenant-scoped context and idempotency enforcement.

4. Implement the read/write foundation endpoints first.
   Scope: `POST /v1/prompt-preview`, `POST /v1/generate-design`, `GET /v1/generations/:generationId`, `GET /v1/projects/:projectId`, `POST /v1/gallery/search`.
   Validation: requests write/read the correct D1 rows and respect the locked schemas.

5. Implement generate and refine queue publish/consume.
   Scope: create design rows, generation rows, Prompt Agent execution, pair artifact writes, `generation_pairs` persistence, and signed URL readback.
   Validation: one create request and one refine request each produce one candidate design and one `pair_v1` bundle without duplication on retry.

6. Implement downstream workflow orchestration.
   Scope: `design_workflow_runs`, target-stage escalation semantics, selection promotion, and stage skipping when outputs already exist.
   Validation: `/spec`, `/technical-sheet`, `/svg`, and `/cad` all converge on the same ordered state machine.

7. Implement Spec Agent and `tech_v1`.
   Scope: spec queue consumer, strict Spec Agent validation, technical sheet JSON/PDF generation, D1 versioning.
   Validation: selected design produces a valid `design_spec` and a `tech_v1` document with explicit unknowns and risk flags.

8. Implement SVG and CAD precision lane.
   Scope: SVG generation, CAD Prep Agent validation, container handoff, CAD artifacts, QA report generation.
   Validation: a selected design with a successful technical sheet can produce SVG assets and at least one requested CAD format without touching the initial generate path.

9. Run a frontend contract-alignment task immediately after the backend foundation starts.
   Scope: remove public `variations` count assumptions, poll `GET /v1/generations/:generationId`, and treat selection as the first downstream design-stage action.
   Validation: frontend naming and control flow match this pack exactly.

This document is now the source of truth for Phase 2 implementation tasks.
