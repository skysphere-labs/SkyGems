# Phase 3D Backend Truth and Async Report

Date: 2026-04-06
Branch: `emdash/phase-3d-skygems-remote-async-bring-up-explicit-design-selection-and-design-detail-truth-21t`
Status: Phase 3D backend truth materially advanced. Not merged.

## 1. What I implemented

- Reconstructed this branch onto the real backend baseline first.
  - This Phase 3D worktree was still on stale `main` (`2835a39`).
  - I cherry-picked the committed Phase 3A monorepo foundation and replayed the Phase 3C working-tree backend/frontend delta before adding new Phase 3D code.
- Added explicit backend-owned design selection.
  - New mutation: `POST /v1/designs/:designId/select`
  - Selection now enforces:
    - project membership with editor-or-owner access
    - active project status
    - non-archived design
    - completed pair availability before selection
  - The mutation supersedes any previously selected design, updates `projects.selected_design_id`, and returns refreshed design truth.
- Added real design list/detail truth endpoints.
  - New read path: `GET /v1/projects/:projectId/designs`
  - New read path: `GET /v1/designs/:designId`
  - These return backend-owned design truth instead of relying on selected-design-only project responses or synthetic frontend gallery state.
- Strengthened the generate -> poll -> select flow.
  - `generations` now persist dispatch truth:
    - `execution_mode`
    - `execution_source`
  - `GET /v1/generations/:generationId` now returns:
    - persisted execution mode/source
    - `projectSelectedDesignId`
    - `canSelect`
  - Auto-selection for the first generated design now uses the same shared selection helper as manual selection, so selection invariants are consistent.
- Strengthened backend design truth payloads.
  - `DesignSummary` now includes:
    - `projectId`
    - `parentDesignId`
    - `sourceKind`
    - `sourceGenerationId`
    - `createdAt`
    - `archivedAt`
- Added the Phase 3D database migration.
  - `apps/api/migrations/0002_phase3d_backend_truth_async.sql`
  - This adds dispatch-truth columns to `generations`.
- Added a narrow frontend adapter follow-through only where it directly supports backend truth.
  - The web client now consumes the real project-design list and design-detail routes.
  - Empty backend truth is now honored instead of silently falling back to stub gallery/selection data.

## 2. Async infra status: usable vs blocked

### Repo-ready and locally verified

- `wrangler.toml` still keeps xAI first and Google second:
  - `SKYGEMS_PROVIDER_PRIMARY = "xai"`
  - `SKYGEMS_PROVIDER_SECONDARY = "google"`
- Queue/workflow bindings remain configured in repo:
  - producer queues:
    - `skygems-generate`
    - `skygems-refine`
    - `skygems-spec`
  - workflow binding:
    - `DESIGN_PIPELINE_WORKFLOW`
    - workflow name `skygems-design-pipeline`
    - class `DesignPipelineWorkflow`
- Local migration apply succeeded on 2026-04-06:
  - `npm run db:migrate:local`
  - `0001_phase2a_foundation.sql` applied
  - `0002_phase3d_backend_truth_async.sql` applied
- Local repo validation succeeded on 2026-04-06:
  - `npm run typecheck`
  - `npm test`
  - `npm run validate`

### Remotely confirmed

- Cloudflare D1 database exists:
  - name: `skygems`
  - id: `d21c67b6-353b-4600-8501-db6fde7e3084`
- Cloudflare R2 bucket exists:
  - `skygems-artifacts`
- Remote D1 still has the Phase 3C table set and no product rows yet:
  - tables present include `projects`, `designs`, `generations`, `generation_pairs`, `artifacts`, and downstream workflow tables
  - row counts on 2026-04-06:
    - `projects = 0`
    - `designs = 0`
    - `generations = 0`

### Blocked or still unproven

- Wrangler auth is still blocked in this environment.
  - `npx wrangler whoami` on 2026-04-06 returned:
    - `You are not authenticated. Please run wrangler login.`
- Remote D1 Phase 3D migration is blocked from this environment.
  - `npm run db:migrate:remote` on 2026-04-06 failed with:
    - `In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.`
- Remote Phase 3D schema is not yet materialized.
  - I queried `PRAGMA table_info(generations);` on remote D1 on 2026-04-06.
  - It does not include `execution_mode` or `execution_source`.
  - That means the Phase 3D code is repo-ready, but the remote database is still at the older schema.
- Remote worker/workflow materialization is still unproven.
  - Cloudflare Workers inventory on 2026-04-06 did not include a worker named `skygems-api`.
  - Inference from that result:
    - the Worker is not deployed remotely
    - therefore the `DesignPipelineWorkflow` class is not materialized remotely yet
- Queue existence remains unproven remotely.
  - Repo bindings are configured.
  - I do not have a queue-management MCP in this session.
  - Wrangler queue operations remain blocked by missing auth.
  - So queue creation is still explicitly unverified, not assumed.

## 3. Exact files changed

Phase 3D-specific source/config changes relative to the Phase 3C worktree:

- `apps/api/migrations/0002_phase3d_backend_truth_async.sql`
- `apps/api/src/index.ts`
- `apps/api/src/lib/design-selection.ts`
- `apps/api/src/lib/generation.ts`
- `apps/api/src/lib/runtime.ts`
- `apps/api/test/migrations.test.ts`
- `apps/web/src/app/contracts/api.ts`
- `apps/web/src/app/contracts/client.ts`
- `packages/shared/src/contracts/api.ts`
- `packages/shared/src/contracts/enums.ts`
- `packages/shared/src/contracts/schemas.test.ts`
- `PHASE-3D-BACKEND-TRUTH-AND-ASYNC-REPORT.md`

Important note:
- This Phase 3D branch also carries the reconstructed Phase 3C baseline that had not actually been present in this stale worktree at the start of the task.

## 4. Design detail/select truth status

Implemented and usable in code:

- `POST /v1/designs/:designId/select`
  - explicit manual selection mutation now exists
- `GET /v1/projects/:projectId/designs`
  - returns full backend design summaries for gallery/workspace truth
- `GET /v1/designs/:designId`
  - returns backend design detail plus recent generation history

Truth characteristics now improved versus Phase 3C:

- selection is explicit, not only implicit-first-generation auto-promotion
- list/read truth no longer depends on project-selected-design-only hydration
- design summaries now carry origin metadata (`sourceKind`, `sourceGenerationId`, lineage ids, timestamps)
- selection attempts fail explicitly when a pair is not ready, instead of letting the frontend guess

## 5. Generate/poll/select backend flow status

Current state after Phase 3D:

1. `POST /v1/generate-design`
   - requires editor-or-owner membership
   - persists real `designs` + `generations` rows
   - persists initial execution mode/source
2. dispatch
   - queue path when configured and available
   - local path for localhost or explicit local mode
   - local fallback when queue send fails
   - fallback/source truth is written back to the generation row
3. generation execution
   - persists pair artifacts and `generation_pairs`
   - updates `designs.latest_pair_id`
4. selection
   - first generation auto-selection now goes through the same helper as manual selection
   - later manual selection uses `POST /v1/designs/:designId/select`
5. polling
   - `GET /v1/generations/:generationId` returns execution truth plus selection truth

Net improvement over Phase 3C:

- polling can now tell whether a run was queue-dispatched, local, or queue-fallback
- polling can now tell whether the generated design is selectable and what the project-selected design id currently is
- selection invariants are centralized instead of partially duplicated

## 6. Provider/config status

Preserved as requested:

- primary provider policy remains xAI
- secondary provider policy remains Google
- no secrets were committed

Where enforced:

- `wrangler.toml`
- `.dev.vars.example`
- `apps/api/src/lib/runtime.ts`

Current committed secret posture:

- repo contains only placeholder values in `.dev.vars.example`
- local-only provider context was used for guidance, not copied into the repo

## 7. Shared backend agent runtime fit note

This Phase 3D backend slice fits the future shared backend agent runtime cleanly.

Recommended attachment point:

- keep product truth in platform tables and typed contracts:
  - `projects`
  - `designs`
  - `generations`
  - `generation_pairs`
  - downstream workflow tables
- let the future shared agent runtime plug in behind the current generation/refine/spec execution layer:
  - prompt compilation
  - provider routing/policy
  - schema validation
  - tool execution
  - versioned skill/prompt packs

Why this is a good fit:

- Phase 3D now exposes explicit platform-owned selection and design-detail truth
- dispatch truth is persisted independently of any future agent abstraction
- the agent runtime can replace hardcoded prompt/execution internals without taking ownership of project truth or selection state

## 8. Blockers and risks

- Remote rollout is still blocked by Cloudflare auth from this environment.
  - without `wrangler login` or `CLOUDFLARE_API_TOKEN`, I cannot:
    - apply the Phase 3D migration remotely
    - create/verify queues remotely
    - deploy the `skygems-api` Worker
- Remote queue existence remains unverified.
  - This is an explicit unknown, not a soft assumption.
- Remote workflow materialization remains an inference.
  - Inference basis:
    - no `skygems-api` worker appears in Workers inventory
    - therefore the workflow class is almost certainly not deployed remotely
- Placeholder pair assets are still used.
  - This task did not attempt real xAI/Google image generation or R2 uploads.
- `npm run validate` passed, but Wrangler emitted a non-blocking local sandbox warning when trying to write logs under `/Users/acevashisth/.wrangler/logs`.

## 9. Recommended next Codex task

Frontend truth adoption against the new backend endpoints.

Specifically:

- wire explicit selection UI to `POST /v1/designs/:designId/select`
- switch gallery/detail views to rely on:
  - `GET /v1/projects/:projectId/designs`
  - `GET /v1/designs/:designId`
- remove the remaining selection/gallery fallback branches that are now redundant

If Cloudflare auth becomes available first, the next high-value backend task is:

- remote Phase 3D rollout:
  - apply `0002_phase3d_backend_truth_async.sql` remotely
  - verify/create queues
  - deploy `skygems-api`
  - confirm workflow materialization remotely
