# Phase 3C Backend Real Generate Report

Date: 2026-04-06
Branch: `emdash/phase-3c-skygems-real-generate-path-queue-workflow-bring-up-and-stable-bootstrap-10f`
Status: Phase 3C materially advanced. Not merged to main.

## 1. What I implemented

- Reconstructed the intended backend starting point first.
  - This Phase 3C worktree had been created from stale `main` (`2835a39`) instead of the integrated Phase 3A / 3B backend state.
  - I cherry-picked the committed Phase 3A monorepo foundation (`728b820`) and replayed the real uncommitted Phase 3B backend worktree diff into this branch before adding new Phase 3C code.
- Finished the first real backend generate path as a usable product slice.
  - `POST /v1/generate-design` now persists a real `designs` row and a real `generations` row.
  - It keeps idempotency behavior intact.
  - It resolves execution mode explicitly:
    - local execution for localhost or `SKYGEMS_GENERATE_EXECUTION_MODE=local`
    - queue dispatch otherwise
    - local fallback if queue send fails
- Implemented real generation execution instead of the Phase 3B queue no-op.
  - Added `apps/api/src/lib/generation.ts`.
  - Queue payload execution now moves a generation from `queued` -> `running` -> `succeeded` or `failed`.
  - Successful execution now inserts:
    - `artifacts` rows for sketch/render
    - `generation_pairs` row
    - updated `designs.latest_pair_id`
    - updated `projects.updated_at`
  - If a project has no selected design yet, the first successful generation auto-promotes its design into backend-selected truth by setting:
    - `projects.selected_design_id`
    - `designs.selection_state = 'selected'`
    - `designs.selected_at`
- Upgraded backend truth returned to the frontend.
  - `GET /v1/generations/:generationId` now returns:
    - real generation status
    - real error state
    - pair artifacts
    - a backend-owned `design` summary with:
      - `designDna`
      - `selectionState`
      - `pair`
      - latest downstream IDs
      - stage statuses
      - `selectedAt`
  - `GET /v1/projects/:projectId` now returns richer `selectedDesign` truth in the same summary shape.
- Made the current frontend shell consume real backend truth where feasible.
  - `apps/web/src/app/contracts/api.ts` now submits real generate requests with `Idempotency-Key`.
  - The workspace shell polls the real generation endpoint after submission.
  - The shell refreshes project/design state from backend responses instead of assuming stub mutations.
  - The client now maps backend-selected design truth into the existing UI model rather than synthesizing it from local variation logic.
- Improved the stable local dev path.
  - Added root and API migration scripts for local and remote D1 migration application.
  - Added explicit local execution mode in `.dev.vars.example` so local dev can run generate without pretending remote queues exist.

## 2. Which Cloudflare resources are now truly usable vs still blocked

### Truly usable now

- D1 database `skygems`
  - Cloudflare ID: `d21c67b6-353b-4600-8501-db6fde7e3084`
  - Verified via Cloudflare account tools on 2026-04-06.
  - Verified schema exists remotely:
    - `tenants`
    - `users`
    - `projects`
    - `project_memberships`
    - `designs`
    - `generations`
    - `generation_pairs`
    - `artifacts`
    - downstream workflow/spec/svg/cad tables
  - Remote row counts were still `0` for `projects`, `designs`, and `generations` at verification time, which matches the fact that no remote SkyGems worker is currently deployed.
- R2 bucket `skygems-artifacts`
  - Verified via Cloudflare account tools on 2026-04-06.
  - Bucket exists.
  - Phase 3C still uses backend-served placeholder pair assets for the first real slice instead of remote R2 object uploads.
- Local dev D1 bootstrap path
  - `npm run db:migrate:local` succeeded on 2026-04-06 and applied `0001_phase2a_foundation.sql` to local Wrangler state.

### Prepared and repo-ready, but not materially remote-usable yet

- Queue bindings in `wrangler.toml`
  - `skygems-generate`
  - `skygems-refine`
  - `skygems-spec`
- Workflow binding in `wrangler.toml`
  - binding: `DESIGN_PIPELINE_WORKFLOW`
  - workflow name: `skygems-design-pipeline`
  - class: `DesignPipelineWorkflow`
- Local/auto execution policy
  - `SKYGEMS_GENERATE_EXECUTION_MODE = "auto"` in `wrangler.toml`
  - `.dev.vars.example` pins local dev to `SKYGEMS_GENERATE_EXECUTION_MODE=local`

### Still blocked

- Remote queue creation is still auth-blocked.
  - `npx wrangler whoami` on 2026-04-06 returned:
    - `You are not authenticated. Please run wrangler login.`
  - That means I could not finish authenticated `wrangler queues create ...` operations from this environment.
- Remote workflow deploy/materialization is still blocked.
  - Cloudflare worker inventory on 2026-04-06 did not contain a deployed `skygems-api` worker.
  - Because the worker is not deployed, `skygems-design-pipeline` is still only a configured binding/class in repo, not a confirmed remote workflow runtime.
- Queue existence itself is still unproven remotely.
  - This session had Cloudflare account access for D1/R2/Workers inventory, but not a queue-management connector.
  - Combined with local Wrangler auth failure, the remote queue bring-up remains explicitly blocked rather than silently assumed.

## 3. Exact files changed

These are the files changed in this Phase 3C worktree after reconstructing the missing Phase 3B backend baseline and then implementing Phase 3C:

- `.dev.vars.example`
- `.gitignore`
- `PHASE-3B-BACKEND-BRINGUP-REPORT.md`
- `PHASE-3C-BACKEND-REAL-GENERATE-REPORT.md`
- `apps/api/package.json`
- `apps/api/src/index.ts`
- `apps/api/src/lib/auth.ts`
- `apps/api/src/lib/bootstrap.ts`
- `apps/api/src/lib/generation.ts`
- `apps/api/src/lib/http.ts`
- `apps/api/src/lib/runtime.ts`
- `apps/api/worker-configuration.d.ts`
- `apps/web/.env.example`
- `apps/web/src/app/contracts/api.ts`
- `apps/web/src/app/contracts/client.ts`
- `apps/web/src/app/contracts/stubs.ts`
- `apps/web/src/app/hooks/useCreateDraftState.ts`
- `apps/web/src/app/screens/WorkspaceScreen.tsx`
- `apps/web/src/vite-env.d.ts`
- `package-lock.json`
- `package.json`
- `packages/shared/src/contracts/api.ts`
- `packages/shared/src/contracts/enums.ts`
- `packages/shared/src/contracts/schemas.test.ts`
- `packages/shared/src/domain/design-dna.ts`
- `wrangler.toml`

Important note:
- Several of the files above are Phase 3B backend baseline files that existed only as uncommitted worktree changes and had to be replayed into this branch before new Phase 3C implementation could begin.

## 4. How generate-design works now

Request path:
- `POST /v1/generate-design`

Current flow:
1. Auth is resolved and project membership is enforced.
2. `Idempotency-Key` is required and checked against `idempotency_records`.
3. The backend builds:
   - `designDna`
   - provider-aware prompt bundle
   - prompt-agent output payload
4. The backend inserts:
   - one `designs` row
   - one `generations` row with status `queued`
5. The backend decides execution mode:
   - `local` for localhost or explicit local mode
   - `queue` otherwise
   - fallback to `local` if queue send throws
6. Execution then:
   - marks generation `running`
   - inserts sketch/render artifact rows
   - inserts one `generation_pairs` row
   - updates `designs.latest_pair_id`
   - updates `generations` to `succeeded`
   - auto-selects the design if the project did not yet have `selected_design_id`
7. The API returns `202` with:
   - `generationId`
   - `designId`
   - `projectId`
   - `status: queued`
   - `executionMode`
   - `executionSource`
   - `pairStandardVersion`
   - `createdAt`

What is still placeholder:
- The execution path produces backend-owned placeholder pair assets as inline SVG data URLs.
- It does not yet call xAI or Google for real image generation.
- It does not yet upload pair files to R2.

## 5. How generations polling works now

Request path:
- `GET /v1/generations/:generationId`

Current response truth:
- generation metadata
  - `generationId`
  - `designId`
  - `projectId`
  - `requestKind`
  - `status`
  - timestamps
  - error payload when failed
- `pair`
  - sketch/render artifact info
  - pair selection state
- `design`
  - `designId`
  - `displayName`
  - `promptSummary`
  - `designDna`
  - `selectionState`
  - `latestPairId`
  - latest downstream IDs
  - stage statuses
  - `selectedAt`
  - `updatedAt`

What this changed materially:
- The frontend no longer has to invent selected-design truth from cached create inputs just to know whether the generated design became the active selection.
- The current shell can map the returned `design` summary directly into its selected-design/gallery state where feasible.

## 6. Project/bootstrap status

Current state:
- `POST /v1/dev/bootstrap` from Phase 3B remains the narrow bootstrap path.
- It still creates or reuses:
  - tenant
  - user
  - project
  - owner membership
- The dev path is more predictable now because:
  - local D1 migration scripts exist
  - local generate execution can run without remote queues
  - `.dev.vars.example` makes the local execution mode explicit

Verified in this slice:
- `npm run db:migrate:local` succeeded on 2026-04-06.

Stable dev path now:
1. `npm install`
2. `npm run db:migrate:local`
3. set local vars from `.dev.vars.example`
4. `npm run dev:api`
5. `npm run dev:web`
6. let the web app call `POST /v1/dev/bootstrap`

## 7. Selected-design/backend truth status

What is now real:
- `projects.selected_design_id` is actively used.
- `designs.selection_state` and `designs.selected_at` are actively updated by execution.
- The first successful generation in an unselected project now becomes the backend-selected design automatically.
- `GET /v1/projects/:projectId` and `GET /v1/generations/:generationId` both surface backend-owned selection truth.

What is not finished yet:
- There is still no explicit user-driven `POST /v1/designs/:designId/select` route.
- If a project already has a selected design, a newly generated candidate remains a candidate. That is correct, but the frontend still lacks a dedicated mutation endpoint to promote a later candidate intentionally.

Net assessment:
- The backend foundation for selected-design truth is now real.
- The explicit manual selection workflow is still the next step.

## 8. Provider/config status

Policy remains:
- primary: xAI
- secondary: Google

Where it is encoded now:
- `wrangler.toml`
  - `SKYGEMS_PROVIDER_PRIMARY = "xai"`
  - `SKYGEMS_PROVIDER_SECONDARY = "google"`
- `.dev.vars.example`
  - `SKYGEMS_PROVIDER_PRIMARY=xai`
  - `SKYGEMS_PROVIDER_SECONDARY=google`

Secrets:
- No provider secrets were committed.
- Local-only provider secret context remained outside the repo.

Current limitation:
- Provider order/policy is real in config and prompt compilation.
- Actual provider invocation for pair generation is not yet wired in Phase 3C.

## 9. Shared backend agent runtime fit note

This slice stays compatible with the stated runtime direction:
- route handlers remain orchestration-heavy rather than prompt-blob heavy
- generation execution moved into `apps/api/src/lib/generation.ts`
- prompt construction still comes from shared/domain logic
- product truth remains in D1-backed tables and typed contracts

How the future shared backend runtime should plug in:
- keep the current route/API layer for:
  - auth
  - tenant/project enforcement
  - idempotency
  - queue/workflow dispatch
  - D1/R2 truth
- replace the placeholder execution internals behind:
  - `dispatchGenerateExecution()`
  - `runGenerateExecution()`
- have the shared runtime own:
  - agent registry
  - skill packs
  - provider/model selection
  - structured output validation
  - prompt/style pack versioning

That means the current Phase 3C slice is a platform-compatible first product slice, not a dead-end route-level prompt hack.

## 10. Blockers/risks

- Remote queue creation is still blocked by local Wrangler auth failure.
- Remote workflow materialization is still blocked because SkyGems has not been deployed as a worker in the connected account yet.
- Pair artifacts are backend-owned placeholders, not real provider-generated PNG uploads.
- The current frontend shell consumes richer backend truth, but it still maps that truth into an older local UI model.
- Explicit manual design selection is still missing.
- Refine/spec/technical-sheet/svg/cad remain downstream placeholders.
- The recovered 3B backend baseline had to be replayed manually because the current 3C branch was cut from stale `main`.

## 11. Recommended next Codex task

Recommended next task:
- authenticate Wrangler in this environment
- create:
  - `skygems-generate`
  - `skygems-refine`
  - `skygems-spec`
- deploy `skygems-api`
- confirm `skygems-design-pipeline` binding/runtime remotely
- add explicit backend design selection:
  - `POST /v1/designs/:designId/select`
- add a real design detail/list path so the frontend no longer has to map backend summaries into placeholder downstream design objects

That is the next smallest task that turns this Phase 3C slice from “real generate/poll with local-first fallback” into “real multi-candidate select truth with remotely materialized async infrastructure.”

## Validation

Executed successfully in this slice:
- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build:web`
- `npm run db:migrate:local`

Cloudflare verification completed in this slice:
- account inventory reachable
- D1 `skygems` exists and schema is present
- R2 bucket `skygems-artifacts` exists
- worker inventory does not currently include `skygems-api`
- `npx wrangler whoami` still reports unauthenticated
