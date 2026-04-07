# Phase 2B Reconciliation Plan

Date: 2026-04-05
Worktree: `/Users/acevashisth/emdash-projects/worktrees/phase-2b-skygems-foundation-reconciliation-and-no-merge-integration-plan-87c`
Status: planning only, no merge performed

## 1. What I inspected

Required reports and contract/context artifacts:

- `phase-2a-skygems-monorepo-backend-foundation-and-contract-implementation-6oa/PHASE-2A-BACKEND-FOUNDATION-REPORT.md`
- `phase-2a-skygems-frontend-app-shell-migration-and-reusable-ui-port-3qp/PHASE-2A-FRONTEND-MIGRATION-REPORT.md`
- `phase-1a-skygems-backend-contract-reconciliation-pack-677/PHASE-1A-BACKEND-CONTRACT-PACK.md`
- `phase-1a-skygems-ux-state-contract-and-flow-lock-3cf/PHASE-1A-UX-CONTRACT-PACK.md`
- `.hermes/agent-logs/skygems/2026-04-05_175300-EDT-skygems-current-status-and-drift-report.md`
- `.hermes/context/skygems-execution-policy.md`

Root SkyGems workspace inspected directly:

- `package.json`
- `src/app/routes.tsx`
- `src/app/services/variationEngine.ts`
- `src/app/utils/promptGenerator.ts`
- `src/app/services/storageService.ts`
- `src/app/screens/DesignGenerator.tsx`
- root `src/` file inventory

Backend Phase 2A worktree inspected directly:

- root workspace files:
  - `package.json`
  - `package-lock.json`
  - `tsconfig.base.json`
  - `wrangler.toml`
- backend/api foundation:
  - `apps/api/migrations/0001_phase2a_foundation.sql`
  - `apps/api/package.json`
  - `apps/api/src/index.ts`
  - `apps/api/src/lib/auth.ts`
  - `apps/api/src/lib/idempotency.ts`
  - `apps/api/src/lib/d1.ts`
  - `apps/api/src/lib/http.ts`
- shared package:
  - `packages/shared/package.json`
  - `packages/shared/src/contracts/api.ts`
  - `packages/shared/src/contracts/enums.ts`
  - `packages/shared/src/contracts/primitives.ts`
  - `packages/shared/src/domain/design-dna.ts`
  - `packages/shared/src/domain/vocab.ts`
- backend-owned `apps/web` relocation:
  - `apps/web/package.json`
  - `apps/web/tsconfig.json`
  - `apps/web/vite.config.ts`
  - `apps/web/src/app/routes.tsx`
  - `apps/web/src/app/screens/*`
  - `apps/web/src/app/services/*`
  - `apps/web/src/styles/*`

Frontend Phase 2A worktree inspected directly:

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/src/app/routes.tsx`
- `apps/web/src/app/layouts/AppShell.tsx`
- `apps/web/src/app/layouts/ProjectLayout.tsx`
- `apps/web/src/app/lib/routes.ts`
- `apps/web/src/app/contracts/api.ts`
- `apps/web/src/app/contracts/types.ts`
- `apps/web/src/app/contracts/stubs.ts`
- `apps/web/src/app/domain/promptGenerator.ts`
- `apps/web/src/app/domain/variationEngine.ts`
- `apps/web/src/app/hooks/useCreateDraftState.ts`
- `apps/web/src/app/components/create-flow/*`
- `apps/web/src/app/components/status/*`
- `apps/web/src/app/components/RefineDrawer.tsx`
- `apps/web/src/app/screens/*`
- `packages/ui/package.json`
- `packages/ui/src/index.ts`
- `packages/ui/src/components/*`
- `packages/ui/src/styles/*`

Direct overlap inspection performed:

- compared changed-file inventories from both Phase 2A worktrees
- compared exact same-path overlaps with `git diff --no-index`
- checked `apps/web` overlap specifically
- checked `packages` overlap specifically
- checked backend contract and frontend placeholder type drift directly
- checked for Next/OpenNext/OpenNext-style worker config and found none in either Phase 2A branch

Important direct findings:

- Backend changed 174 relevant paths.
- Frontend changed 65 relevant paths.
- Exact same-path overlap between the two Phase 2A branches is 10 files, all inside `apps/web`.
- Backend branch also performs the root-to-workspace relocation of the old SPA.
- Frontend branch does not touch root workspace config, so its `apps/web` and `packages/ui` changes assume a workspace shape without actually creating the monorepo foundation.

## 2. Phase 2A overlap matrix

### Exact same-path overlap

These are the only paths changed by both branches at the same relative file path:

| Area | Exact overlapping paths | Backend lane state | Frontend lane state | Reconciliation result |
| --- | --- | --- | --- | --- |
| `apps/web` runtime entry | `apps/web/index.html` | moved legacy Vite shell entry | rewritten workspace landing entry | frontend-authoritative content; keep workspace location from backend |
| `apps/web` package manifest | `apps/web/package.json` | carries old app dependencies into workspace | minimal manifest with workspace scripts only | hand-merge; backend manifest is the baseline because frontend copy drops dependencies |
| app entry | `apps/web/src/app/App.tsx` | same router wrapper as old app | same router wrapper with formatting-only drift | either version is fine; lowest-risk is frontend copy |
| route map | `apps/web/src/app/routes.tsx` | old `dashboard/create/gallery/preview/copilot/export` tree moved under `apps/web` | canonical Phase 1A project-aware route tree | frontend-authoritative |
| landing page | `apps/web/src/app/screens/LandingPage.tsx` | old luxury/dark marketing page | rewritten marketing page | frontend-authoritative if keeping frontend shell; not contract-critical |
| bootstrap | `apps/web/src/main.tsx` | moved legacy import style | minor import-path cleanup | frontend-authoritative |
| styles entry | `apps/web/src/styles/index.css` | imports local `fonts.css` and `theme.css` | imports `packages/ui` styles | frontend-authoritative after `packages/ui` exists |
| Tailwind entry | `apps/web/src/styles/tailwind.css` | moved legacy file | reused in frontend | use frontend branch copy or keep identical content after validation |
| TS config | `apps/web/tsconfig.json` | extends `../../tsconfig.base.json`, no `@skygems/ui` alias | includes `@skygems/ui` paths, does not extend root base | hand-merge; backend workspace base + frontend aliases |
| Vite config | `apps/web/vite.config.ts` | old Vite config moved into workspace | adds `@skygems/ui` alias and `root: __dirname` | hand-merge; frontend aliasing on backend workspace base |

### High-overlap areas with different paths

| Area | Backend lane files | Frontend lane files | Overlap type | Reconciliation result |
| --- | --- | --- | --- | --- |
| Monorepo/workspace foundation | `package.json`, `package-lock.json`, `tsconfig.base.json`, `wrangler.toml`, root deletions of old SPA files | none | structural overlap, different paths | backend-authoritative |
| API foundation | `apps/api/**` | none | backend-only | backend-authoritative |
| Shared contracts/domain | `packages/shared/**` | `apps/web/src/app/contracts/**`, `apps/web/src/app/domain/**` | same product boundary, different paths | backend-authoritative contracts/domain; frontend placeholders must be replaced or adapted |
| UI primitives and styles | backend-carried legacy files in `apps/web/src/app/components/ui/**`, `apps/web/src/app/components/figma/ImageWithFallback.tsx`, `apps/web/src/styles/fonts.css`, `apps/web/src/styles/theme.css` | `packages/ui/**` | same asset family, different packaging | frontend-authoritative package structure; backend files are carry-forward material, not final ownership |
| Frontend route/app shell | backend-moved old app screens: `apps/web/src/app/layouts/RootLayout.tsx`, `apps/web/src/app/screens/{Dashboard,DesignGenerator,DesignGallery,DesignPreview,AICoPilot,CADExport}.tsx` | canonical shell: `apps/web/src/app/layouts/{AppShell,ProjectLayout}.tsx`, `apps/web/src/app/screens/{WorkspaceResolver,ProjectsIndex,ProjectHome,CreateScreen,GenerationScreen,SelectedDesignScreen,SpecScreen,TechnicalSheetScreen,SvgScreen,CadScreen,GalleryScreen}.tsx` | same app boundary, different screen model | frontend-authoritative |
| Prompt/variation reuse | `packages/shared/src/domain/{design-dna,vocab}.ts` | `apps/web/src/app/domain/{variationEngine,promptGenerator}.ts` | same vocabulary and derivation concerns | backend-authoritative implementation; frontend copy is fallback-only and should not remain canonical |

### Backend-only areas to preserve

- `apps/api/**`
- `packages/shared/**`
- `wrangler.toml`
- root monorepo files: `package.json`, `package-lock.json`, `tsconfig.base.json`
- root-to-`apps/web` relocation of the current SPA

### Frontend-only areas to preserve

- `apps/web/src/app/layouts/AppShell.tsx`
- `apps/web/src/app/layouts/ProjectLayout.tsx`
- `apps/web/src/app/lib/routes.ts`
- `apps/web/src/app/hooks/useCreateDraftState.ts`
- `apps/web/src/app/components/create-flow/**`
- `apps/web/src/app/components/status/**`
- `apps/web/src/app/components/ProjectSwitcher.tsx`
- `apps/web/src/app/components/RefineDrawer.tsx`
- `apps/web/src/app/screens/{WorkspaceResolver,ProjectsIndex,ProjectHome,CreateRedirect,CreateScreen,GenerationScreen,SelectedDesignScreen,SpecScreen,TechnicalSheetScreen,SvgScreen,CadScreen,GalleryScreen}.tsx`
- `packages/ui/**`

### Frontend-only areas that should not be treated as first-class merge targets

- `apps/web/src/app/contracts/stubs.ts`: useful for placeholder behavior now, not authoritative contract
- `apps/web/src/app/contracts/types.ts`: helpful UI model, not wire contract
- `apps/web/src/app/contracts/api.ts`: adapter stub only
- `apps/web/src/app/domain/{promptGenerator,variationEngine}.ts`: fallback-only once `@skygems/shared` is used
- `apps/web/src/app/components/studio/*`: present in tree, not referenced by the route/app shell, and not mentioned in the frontend report

## 3. Authoritative ownership decisions

### Backend lane is authoritative for

- Monorepo/workspace shape:
  - `package.json`
  - `package-lock.json`
  - `tsconfig.base.json`
- Cloudflare/platform foundation:
  - `wrangler.toml`
  - `apps/api/**`
- Locked shared contracts and backend-owned domain helpers:
  - `packages/shared/**`
- D1 schema and idempotent API foundation:
  - `apps/api/migrations/0001_phase2a_foundation.sql`
  - `apps/api/src/index.ts`
  - `apps/api/src/lib/{auth,d1,http,idempotency}.ts`

Why:

- This lane is the only one that actually creates the workspace and backend runtime.
- It is already aligned to the locked public API surface.
- It owns the canonical Zod contracts, queue payloads, ID shapes, and D1 schema.

### Frontend lane is authoritative for

- Canonical Phase 1A route/app shell inside `apps/web`
- project-aware navigation and screen structure
- create-flow controls and status components
- selected-design/refine/spec/technical-sheet/svg/cad shell surfaces
- `packages/ui/**` as the reusable UI package location and exported primitive subset

Why:

- This lane implements the canonical Phase 1A UX contract instead of the old preview/copilot/export shell.
- Backend lane only moved the legacy frontend into workspace form; it did not perform the canonical route/state rewrite.

### Hand-merged hybrid files

These should not be blindly cherry-picked from either branch:

- `apps/web/package.json`
  - start from backend version because it preserves the dependency set
  - then add the frontend package relationship cleanly; do not use the frontend file as-is
- `apps/web/tsconfig.json`
  - keep backend `extends: "../../tsconfig.base.json"`
  - add frontend `@skygems/ui` path aliases/include entries
- `apps/web/vite.config.ts`
  - keep workspace-safe Vite config
  - add frontend `@skygems/ui` alias
- `apps/web/src/styles/index.css`
  - use frontend package-style import pattern
  - only after `packages/ui` is present

### Explicit authority calls by boundary

- `apps/api` and `packages/shared`: backend wins
- `apps/web` route tree and screen model: frontend wins
- `packages/ui`: frontend wins
- prompt/variation logic truth: backend `packages/shared` wins
- placeholder frontend adapter code: temporary only, not authoritative
- legacy frontend moved by backend into `apps/web/src/app/screens/{Dashboard,DesignGenerator,DesignGallery,DesignPreview,AICoPilot,CADExport}.tsx`: discard after frontend shell is reapplied

## 4. Merge-unit plan (for later, not now)

This section is the later merge sequence. It is not a request to merge now.

### Merge Unit 1: backend workspace scaffold

Scope:

- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- root SPA relocation into `apps/web`
- deletion of old root SPA files under `src/`, root `index.html`, root `vite.config.ts`, root `postcss.config.mjs`, root `.env.example`

Why this unit is safe:

- It establishes the future repo shape without requiring the new frontend shell yet.
- It is already called out in the execution policy as a good merge unit.

Later action:

- cherry-pick/reapply from backend lane

### Merge Unit 2: shared contracts/domain package

Scope:

- `packages/shared/**`

Why this unit is safe:

- No frontend screen behavior depends on it yet.
- It creates the canonical source for API schemas, enums, IDs, and shared helpers.

Later action:

- cherry-pick/reapply from backend lane

### Merge Unit 3: API worker foundation and D1 migration

Scope:

- `apps/api/**`
- `wrangler.toml`

Why this unit is safe:

- Backend-only ownership
- no overlap with frontend screen files

Later action:

- cherry-pick/reapply from backend lane

### Merge Unit 4: canonical frontend app shell

Scope:

- `apps/web/src/app/layouts/{AppShell,ProjectLayout}.tsx`
- `apps/web/src/app/lib/routes.ts`
- `apps/web/src/app/hooks/useCreateDraftState.ts`
- `apps/web/src/app/components/create-flow/**`
- `apps/web/src/app/components/status/**`
- `apps/web/src/app/components/{ProjectSwitcher,RefineDrawer}.tsx`
- `apps/web/src/app/screens/{WorkspaceResolver,ProjectsIndex,ProjectHome,CreateRedirect,CreateScreen,GenerationScreen,SelectedDesignScreen,SpecScreen,TechnicalSheetScreen,SvgScreen,CadScreen,GalleryScreen}.tsx`
- `apps/web/src/app/routes.tsx`
- `apps/web/src/app/App.tsx`
- `apps/web/src/main.tsx`
- `apps/web/index.html`

Why this unit is safe:

- It cleanly replaces the backend-carried legacy shell with the canonical Phase 1A shell.
- Most of these files are frontend-only and do not collide with `apps/api` or `packages/shared`.

Later action:

- cherry-pick/reapply from frontend lane
- hand-merge the 10 exact-overlap files listed in Section 2

### Merge Unit 5: reusable UI package extraction

Scope:

- `packages/ui/**`
- `apps/web/src/styles/index.css`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`

Why this unit is safe:

- This is the clean boundary between app shell and shared UI primitives/styles.
- It should land only after the workspace scaffold exists.

Later action:

- cherry-pick/reapply from frontend lane
- hand-merge config files with backend workspace base

### Merge Unit 6: contract-adapter reconciliation

Scope:

- replace frontend local placeholder contracts/domain usage with `@skygems/shared`
- keep a thin UI adapter layer only where the frontend needs view shaping

Files expected to change later:

- `apps/web/src/app/contracts/api.ts`
- `apps/web/src/app/contracts/types.ts`
- `apps/web/src/app/hooks/useCreateDraftState.ts`
- `apps/web/src/app/screens/CreateScreen.tsx`
- `apps/web/src/app/screens/GenerationScreen.tsx`
- `apps/web/src/app/screens/ProjectHome.tsx`
- `apps/web/src/app/screens/SelectedDesignScreen.tsx`
- `apps/web/src/app/components/status/{GenerationStatusBanner,StageStatusPill,PromptPreviewStatusCard,PairCardV1}.tsx`

Why this unit is safe:

- It is the first true interface reconciliation unit between the two Phase 2A lanes.
- Doing it after Units 1-5 keeps the structural merge smaller.

Later action:

- reapply, not blind cherry-pick

### Cherry-pick/reapply vs discard summary

Cherry-pick/reapply:

- backend: `package.json`, `package-lock.json`, `tsconfig.base.json`, `wrangler.toml`, `apps/api/**`, `packages/shared/**`
- frontend: `packages/ui/**`, canonical `apps/web` layouts/screens/components, `apps/web/src/app/lib/routes.ts`, `apps/web/src/app/hooks/useCreateDraftState.ts`

Hand-merge:

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/src/styles/index.css`
- `apps/web/index.html`
- `apps/web/src/app/routes.tsx`

Discard once reapplied:

- backend-carried legacy shell files in `apps/web/src/app/layouts/RootLayout.tsx`
- backend-carried legacy shell files in `apps/web/src/app/screens/{Dashboard,DesignGenerator,DesignGallery,DesignPreview,AICoPilot,CADExport}.tsx`
- backend-carried legacy prompt/domain copies in `apps/web/src/app/services/storageService.ts`, `apps/web/src/app/services/variationEngine.ts`, `apps/web/src/app/utils/promptGenerator.ts`
- backend-carried duplicate UI primitives once `packages/ui` is active:
  - `apps/web/src/app/components/ui/**`
  - `apps/web/src/app/components/figma/ImageWithFallback.tsx`
  - `apps/web/src/styles/{fonts.css,theme.css}`
- frontend placeholder-only local contract/domain layers after real `@skygems/shared` adoption:
  - `apps/web/src/app/contracts/{api,types,stubs}.ts`
  - `apps/web/src/app/domain/{promptGenerator,variationEngine}.ts`
- frontend unused files unless a later task adopts them:
  - `apps/web/src/app/components/studio/*`

## 5. Drift analysis

### Contract drifts still remaining

#### 1. Frontend generation model is still multi-pair shaped

Frontend:

- `apps/web/src/app/contracts/types.ts` defines:
  - `Generation.pairs: PairCandidate[]`
  - `readyPairs`
  - `totalPairs`
  - `GenerationStatus = "queued" | "processing" | "completed" | "failed"`

Backend canonical contract:

- `packages/shared/src/contracts/api.ts` defines `GenerationStatusResponseSchema`
- response contains a singular `pair` object or `null`
- status values are `"queued" | "running" | "succeeded" | "failed" | "canceled"`

Impact:

- `GenerationScreen` and `GenerationStatusBanner` cannot be wired directly to the backend response as-is.

Resolution:

- normalize the frontend to a singular pair model before real polling is wired

#### 2. Frontend stage status names drift from backend shared contracts

Frontend:

- `StageStatus = "absent" | "queued" | "processing" | "ready" | "failed" | "stale"`

Backend canonical contract:

- `StageStatusesSchema` uses `"not_requested" | "queued" | "running" | "succeeded" | "failed" | "skipped"`

Impact:

- `StageStatusPill`, downstream shells, and any future workflow display logic need a shared mapping or direct adoption of backend statuses.

Resolution:

- prefer direct adoption of `packages/shared` stage statuses plus a UI-only display mapper

#### 3. Frontend CAD format options drift from backend contract

Frontend:

- `CadFormat = "stl" | "step" | "dxf" | "3dm" | "obj"`

Backend canonical contract:

- `CadFormatEnum = ["step", "dxf", "stl"]`

Impact:

- `CadScreen` exposes formats the API does not support.

Resolution:

- reduce frontend format options to backend-supported values until the contract changes

#### 4. Frontend project payload shape does not match `GET /v1/projects/:projectId`

Frontend:

- `fetchProject()` returns a flat `ProjectWorkspace`

Backend canonical contract:

- `ProjectResponseSchema` returns:
  - `project`
  - `selectedDesign`
  - `recentDesigns`
  - `recentGenerations`

Impact:

- `ProjectHome`, `WorkspaceResolver`, and project list flows need an adapter layer or a UI model rewrite.

Resolution:

- keep a thin adapter in `apps/web/src/app/contracts/api.ts`, but source types from `@skygems/shared`

#### 5. Frontend prompt-preview and refine request shapes are not wire-compatible yet

Frontend:

- `postPromptPreview()` returns `{ promptText }`
- `postRefineDesign()` does not model the real `instruction/preset/preserve/pairStandardVersion` payload

Backend canonical contract:

- `PromptPreviewResponseSchema` returns `normalizedInput`, `designDnaPreview`, `promptSummary`, `promptText`, versions
- `RefineRequestSchema` requires real instruction/preserve semantics

Impact:

- create flow and refine drawer are structurally correct but not integration-ready

Resolution:

- rework the frontend adapter layer before wiring real fetches

#### 6. Project creation/provisioning remains a contract gap

Observed state:

- frontend has `ProjectsIndex` and `CreateRedirect`
- backend only exposes `GET /v1/projects/:projectId`, not project creation
- Phase 1A locked public API list also does not include a project-create endpoint

Impact:

- first real wired slice needs a project bootstrap decision before create flow can be fully real

Resolution:

- explicit follow-up contract decision required:
  - add a narrow project bootstrap path, or
  - define out-of-band project provisioning, or
  - revise the official public API list

### Implementation drifts still remaining

#### 1. Vite vs Next/OpenNext platform drift is high

Current state in both Phase 2A branches:

- still Vite SPA based
- no Next app structure
- no OpenNext build
- no web Worker runtime
- no web-to-api service binding

This is a real architecture drift from the target platform, not a documentation-only drift.

Recommended handling window:

- do not fold it into Phase 2B reconciliation
- do not block the immediate integration slice on it either
- handle it as a dedicated platform migration slice after the reconciled first wired slice is standing, and before deeper downstream screen work or public deployment

Reason:

- doing it inside reconciliation would create another broad overlap event
- postponing it too far would force more UI code to be ported twice

#### 2. Frontend theme-token drift exists inside the new app shell

Observed state:

- `packages/ui/src/styles/theme.css` defines the new `background/foreground/card/...` token system
- many frontend screen components still reference old tokens such as:
  - `--text-primary`
  - `--text-secondary`
  - `--accent-gold`
  - `--status-info`
  - `--status-warning`
  - `--status-success`
  - `--status-error`

Impact:

- not a contract blocker
- likely visual inconsistency once the frontend shell is integrated

Resolution:

- targeted frontend cleanup pass after merge-unit reconciliation, not before

#### 3. Frontend report/tree drift exists

Observed state:

- `apps/web/src/app/components/studio/*` exists in the frontend tree
- those files are not referenced by the canonical route/app shell
- they are not listed in the frontend report's exact file list

Impact:

- small documentation drift only

Resolution:

- treat them as non-authoritative and exclude from the first integration wave

## 6. Immediate next implementation order

This is the next execution order after reconciliation. It assumes a fresh integration worktree later, not a merge in this Phase 2B task.

1. Reapply backend workspace foundation first.
   - bring in `package.json`, `package-lock.json`, `tsconfig.base.json`, `wrangler.toml`, `apps/api/**`, `packages/shared/**`

2. Reapply the canonical frontend shell on top of that workspace.
   - add `packages/ui/**`
   - replace backend-carried legacy `apps/web` route/screens with the frontend canonical shell
   - hand-merge the 10 exact-overlap files

3. Reconcile `apps/web` config files before any product wiring.
   - `apps/web/package.json`
   - `apps/web/tsconfig.json`
   - `apps/web/vite.config.ts`
   - `apps/web/src/styles/index.css`

4. Replace frontend placeholder contract/domain ownership with `@skygems/shared`.
   - fix generation response shape
   - fix stage status enum usage
   - fix CAD formats
   - keep only a thin UI adapter layer

5. Resolve the project bootstrap gap.
   - this must happen before the create flow can be made fully real

6. Wire the first real backend-connected slice.
   - `POST /v1/prompt-preview`
   - `POST /v1/generate-design` with `Idempotency-Key`
   - `GET /v1/generations/:generationId`

7. Update the generation and selected-design UI to the real payloads.
   - singular `pair`
   - backend status names
   - real `selectedDesign` and recent generation/project payloads

8. Wire real refine next.
   - `POST /v1/designs/:designId/refine`
   - return user to real generation polling

9. Only after the above, move into downstream stage wiring in contract order.
   - spec
   - technical sheet
   - svg
   - cad

10. Schedule the Vite -> Next/OpenNext migration as its own platform slice before public deployment and before too many more frontend surfaces pile onto Vite.

## 7. Risks/blockers

- The biggest merge risk is not `apps/api`; it is `apps/web` because backend moved the old SPA there while frontend rewrote that same boundary.
- `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, and `apps/web/src/styles/index.css` are not safe blind cherry-picks.
- Frontend generation/status contracts are still placeholder-shaped and will break direct backend wiring unless normalized first.
- Project creation/provisioning is still unresolved at the public API level.
- `packages/ui` extraction is good, but the new frontend shell still references old theme variables heavily.
- If the Next/OpenNext migration is delayed too long, more code will need a second port later.
- If the Next/OpenNext migration is pulled into reconciliation now, scope will expand too much and Phase 2B will stop being a reconciliation task.

## 8. Recommended next Codex task

Recommended next task:

- Create a fresh integration worktree from `main`.
- Reapply Merge Units 1 through 5 only.
- Do not merge to `main` yet.
- End state for that task:
  - backend workspace foundation is present
  - `apps/api` and `packages/shared` are present
  - canonical frontend shell and `packages/ui` are present
  - the 10 exact-overlap files are hand-reconciled
  - backend-carried legacy `apps/web` screen set is removed or clearly superseded
  - no real API wiring yet except what is needed to compile

Recommended follow-up task after that:

- first real wired slice:
  - adopt `@skygems/shared` in the frontend adapter layer
  - resolve project bootstrap handling
  - wire `POST /v1/prompt-preview`
  - wire `POST /v1/generate-design`
  - wire `GET /v1/generations/:generationId`
  - normalize the frontend from plural generation pairs to the backend singular pair contract
