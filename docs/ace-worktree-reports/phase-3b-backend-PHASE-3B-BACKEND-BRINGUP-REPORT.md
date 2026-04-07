# Phase 3B Backend Bring-Up Report

Date: 2026-04-06
Branch: `emdash/phase-3b-skygems-cloudflare-bring-up-auth-tenant-bootstrap-and-real-prompt-preview-slice-5sp`
Base note: reapplied the committed Phase 3A integrated foundation first by cherry-picking local Phase 3A commit `728b820` into this worktree.

## 1. What I implemented

- Reapplied the Phase 3A integrated monorepo foundation into this worktree so Phase 3B lands on `apps/api`, `packages/shared`, `apps/web`, and `wrangler.toml` instead of the legacy single-app SPA shape.
- Added a real backend-backed `POST /v1/prompt-preview` path that now:
  - requires bearer auth,
  - enforces project membership,
  - compiles prompt text from shared/domain prompt logic,
  - selects provider preference in backend config order (`xai` first, `google` second),
  - exposes prompt-pack/provider metadata via response headers.
- Added `POST /v1/dev/bootstrap` as the narrow dev bootstrap path for this slice.
  - It creates or reuses a tenant, user, project, and owner membership.
  - It returns a signed dev session token plus the active bootstrap project.
- Replaced placeholder header auth with a stronger bearer-token path.
  - Auth0 bearer tokens are now verified with RS256 + JWKS.
  - Local/dev bootstrap sessions are signed and verified with HMAC.
- Tightened tenant/project access.
  - Project routes now require project membership, not just tenant match.
  - Gallery search is filtered to the caller’s project memberships.
- Added Worker/runtime config for provider preference, Auth0 issuer/audience/claims namespace, dev bootstrap enablement, and local secret examples.
- Wired the minimum web path needed to exercise the slice.
  - The web app bootstraps a real backend project/session when the API is available.
  - Prompt preview uses the real backend endpoint and falls back to the existing local preview only when the API is unavailable.

## 2. What Cloudflare resources were created vs prepared vs still blocked

### Created

- D1 database `skygems`
  - Cloudflare ID: `d21c67b6-353b-4600-8501-db6fde7e3084`
  - Created at: `2026-04-06T02:14:16.243Z`
  - Primary location: `ENAM`
  - Migration applied successfully.
- R2 bucket `skygems-artifacts`
  - Created at: `2026-04-06T02:14:10.479Z`

### Prepared

- Queue bindings in `wrangler.toml`
  - `skygems-generate`
  - `skygems-refine`
  - `skygems-spec`
- Workflow binding in `wrangler.toml`
  - binding: `DESIGN_PIPELINE_WORKFLOW`
  - workflow name: `skygems-design-pipeline`
  - class: `DesignPipelineWorkflow`
- Provider/config env layout
  - `SKYGEMS_PROVIDER_PRIMARY=xai`
  - `SKYGEMS_PROVIDER_SECONDARY=google`
  - `.dev.vars.example` for `DEV_BOOTSTRAP_SECRET`, `XAI_API_KEY`, `GOOGLE_API_KEY`

### Still blocked

- Queue creation itself is blocked in this environment because local Wrangler is not authenticated.
  - `npx wrangler whoami` returned: `You are not authenticated. Please run wrangler login.`
- Remote workflow availability is still deploy-blocked for the same reason.
  - The workflow binding/class is ready in code/config, but no authenticated deploy happened in this slice.

## 3. Exact files changed

- `.dev.vars.example`
- `.gitignore`
- `apps/api/src/index.ts`
- `apps/api/src/lib/auth.ts`
- `apps/api/src/lib/bootstrap.ts`
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
- `packages/shared/src/contracts/api.ts`
- `packages/shared/src/contracts/enums.ts`
- `packages/shared/src/contracts/schemas.test.ts`
- `packages/shared/src/domain/design-dna.ts`
- `wrangler.toml`

## 4. How prompt-preview works now

- Request path: `POST /v1/prompt-preview`
- Auth:
  - bearer token required
  - accepts Auth0 JWTs or signed dev bootstrap sessions
- Access control:
  - the caller must be a member of the referenced project
- Execution path:
  - route resolves auth
  - route enforces project membership
  - backend resolves provider preference from Worker env/secrets
  - shared/domain prompt compiler builds normalized input, design DNA preview, summary, and prompt text
- Provider selection behavior:
  - prefers `xai` when configured/available
  - falls back to `google` when needed
  - does not call the provider yet in this slice; it compiles provider-aware prompt text and metadata in backend
- Response headers:
  - `x-skygems-prompt-pack-version`
  - `x-skygems-prompt-provider`
  - `x-skygems-prompt-provider-source`

## 5. How project bootstrap works now

- Request path: `POST /v1/dev/bootstrap`
- Intended use:
  - local bring-up / narrow seeded path for this phase
- Behavior:
  - creates or reuses a tenant
  - creates or reuses a user
  - creates or reuses one sandbox project
  - ensures owner membership in `project_memberships`
  - returns a signed dev session token and the active project payload
- Web wiring:
  - the frontend now calls backend bootstrap on load when the API is available
  - the resulting session is cached in `sessionStorage`
  - the bootstrapped project ID becomes the active project for prompt-preview
- Local safety:
  - dev bootstrap is allowed on localhost automatically
  - for non-local/shared environments, use `SKYGEMS_ENABLE_DEV_BOOTSTRAP=true` and set `DEV_BOOTSTRAP_SECRET`

## 6. Auth/tenant status

- Replaced placeholder header-only auth with bearer auth.
- Auth0 path now supports:
  - RS256 verification
  - JWKS fetch
  - issuer/audience validation
  - tenant claim extraction from the configured claims namespace
- Dev path now supports:
  - signed HMAC session tokens
  - bootstrap-created tenant/user/project context
- Tenant/user bootstrap:
  - `ensureTenantAndUser()` now upserts tenant/user records from verified identity
- Enforcement improvement:
  - project fetch/prompt-preview/generate/generation-status now require project membership
  - gallery search is membership-scoped

## 7. Provider/config handling status

- Provider preference direction is implemented in config order:
  - primary: `xai`
  - secondary: `google`
- No local secrets were committed.
- Added `.dev.vars.example` with placeholders for:
  - `DEV_BOOTSTRAP_SECRET`
  - `XAI_API_KEY`
  - `GOOGLE_API_KEY`
- `wrangler.toml` now contains:
  - real D1 ID
  - real R2 bucket name
  - provider preference vars
  - Auth0 issuer/audience/claims namespace vars
- Current limitation:
  - provider keys are used for readiness/policy selection only in this slice
  - actual provider invocation is not yet wired into prompt-preview or generation execution

## 8. Future shared backend agent runtime note

- The work in this slice keeps the long-term runtime direction open without introducing OpenClaw assumptions.
- The current fit should be:
  - routes stay thin: auth, tenant resolution, membership enforcement, idempotency, queue/workflow orchestration
  - shared/domain owns prompt packs, prompt compilation, version labels, and output shaping
  - a future shared backend agent runtime can sit behind the current API layer as a service/module that owns:
    - agent registry
    - skill packs
    - provider/model policy
    - prompt pack/version selection
    - structured output validation
- That future runtime should consume the same D1/R2/queue/workflow platform layer already being put in place here.

## 9. Blockers/risks

- Queue resources were not created because Wrangler is not authenticated locally.
- Workflow binding is prepared but not deployed remotely.
- `POST /v1/prompt-preview` is now real/backend-owned, but it is still deterministic prompt compilation, not an external provider call.
- Frontend beyond bootstrap + prompt-preview remains mostly stubbed.
  - `generate-design`, generation polling, and real design/project hydration still need Phase 3C work.
- Localhost dev bootstrap can fall back to a built-in local-only signing secret if `DEV_BOOTSTRAP_SECRET` is absent.
  - Good enough for local bring-up.
  - Should be explicitly overridden in any shared remote environment.

## 10. Recommended next Codex task

- Authenticate Wrangler in this environment and finish the blocked Cloudflare operations:
  - create `skygems-generate`
  - create `skygems-refine`
  - create `skygems-spec`
  - deploy or otherwise materialize `skygems-design-pipeline`
- Then do the first true wired Phase 3C product slice:
  - wire frontend `POST /v1/generate-design`
  - wire frontend `GET /v1/generations/:id`
  - normalize frontend generation state from placeholder plural pairs to the backend singular pair model
  - surface real queued/running/succeeded status from the backend

## Validation run in this slice

- `npm run typecheck`
- `npm test`
- `npm run build:web`

## Cloudflare verification notes

- D1 schema verification after migration:
  - verified expected domain tables exist in Cloudflare D1 (`tenants`, `users`, `projects`, `project_memberships`, `designs`, `generations`, `generation_pairs`, `design_workflow_runs`, `design_specs`, `technical_sheets`, `svg_assets`, `cad_jobs`, `artifacts`, `idempotency_records`)
- Wrangler auth check:
  - `npx wrangler whoami` -> not authenticated
