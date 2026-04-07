# Phase 3B Frontend Wiring And Visual Restoration Report

Date: 2026-04-05
Branch: `emdash/phase-3b-skygems-frontend-real-prompt-preview-generation-wiring-dark-luxury-restoration-60v`
Status: Frontend slice implemented on top of the Phase 3A route shell and shared-contract direction.

## 1. What I Implemented

### 1.1 Reapplied the Phase 3A canonical frontend shell
- Restored the project-scoped router and shell as the active app path:
  - `/app/projects`
  - `/app/projects/:projectId`
  - `/app/projects/:projectId/create`
  - `/app/projects/:projectId/generations/:generationId`
  - `/app/projects/:projectId/designs/:designId`
  - downstream `/spec`, `/technical-sheet`, `/svg`, `/cad`
- Brought back `AppShell`, `ProjectLayout`, `FlowStepRail`, and the route-based screen set so the frontend no longer depends on the single-screen tab workspace as the main app path.
- Kept a small compatibility `WorkspaceScreen` file in place so the older WIP lane does not break compilation, but it is no longer the canonical route model.

### 1.2 Wired the create → preview → generate → status path to real backend endpoints with guarded fallback
- `POST /v1/prompt-preview`
  - Frontend now attempts the real API first.
  - If the current project is not available in the backend yet, it falls back to the local prompt composer instead of breaking create mode.
- `POST /v1/generate-design`
  - Frontend now sends the real backend-shaped payload:
    - `projectId`
    - structured create inputs
    - `pairStandardVersion`
    - `promptTextOverride` when prompt override mode is active
  - Adds `Idempotency-Key`.
  - Mirrors live generation metadata into frontend session storage and the local generation store so the route shell, flow rail, and generation screen stay coherent after submission.
- `GET /v1/generations/:generationId`
  - Generation screen now polls the real status endpoint.
  - Backend status is normalized for the current UI:
    - `running -> processing`
    - `succeeded -> completed`
  - Live generation responses are adapted into the existing pair-card UI shape.
- `GET /v1/projects/:projectId`
  - Frontend now attempts the real project endpoint first, then falls back to local data.
- `POST /v1/gallery/search`
  - Frontend now attempts the real gallery search endpoint first, then falls back to local search.
- Added Vite dev proxy support for `/v1` so local web dev can hit the API worker without hardcoding same-origin deployment.

### 1.3 Normalized frontend data closer to the backend contract
- Replaced invalid placeholder IDs like `proj-obsidian-bloom` and `gen-obsidian-bloom-r2` with backend-compatible prefixed IDs in the stub layer.
- Updated stub project/generation/design relationships to keep the route model and shared schemas aligned.
- Added optional frontend transport metadata on generation records:
  - `source: "live" | "fallback"`
  - `lastCheckedAt`
- For live generation responses, the frontend now synthesizes a minimal selected-design workspace record from:
  - the live generation response
  - cached create inputs
  - local design-DNA derivation
  so that a real generation can open into the selected-design workspace even though the backend does not yet expose a full design detail endpoint.

### 1.4 Restored the SkyGems dark-luxury / gold identity
- Replaced the light/purple design token direction with dark-first gold-accent tokens in the shared UI package.
- Rebuilt the landing page to match the intended SkyGems identity:
  - dark luxury foundation
  - gold gradient actions
  - pair-first hero surface
  - editorial typography
- Upgraded the route-based project screens away from implementation-copy and toward product copy.

### 1.5 Built the highest-value visual/product surfaces for this slice
- Create workspace:
  - stronger hero header
  - premium gold CTA treatment
  - explicit live vs fallback preview status
  - better prompt-preview framing
- Generation workspace:
  - real polling loop
  - transport-aware status surface
  - better handoff from create to generation
- Selected design workspace:
  - implemented a real hero pair viewer
  - upgraded summary panel into an image-first control room
  - kept downstream stage readiness visible without flattening the experience
- Pair cards and status surfaces:
  - elevated card treatment
  - safer action handling for non-ready pairs
  - clearer generation source and readiness cues

## 2. What From The Existing Frontend I Preserved

- The Phase 3A route/app shell direction:
  - project-scoped routes
  - `AppShell`
  - `ProjectLayout`
  - `FlowStepRail`
- The extracted create-flow components:
  - `JewelryTypePicker`
  - `MetalPicker`
  - `GemstonePicker`
  - `StylePicker`
  - `ComplexityControl`
- The reusable status components and signatures:
  - `PairCardV1`
  - `GenerationStatusBanner`
  - `PromptPreviewStatusCard`
  - `SelectionSummaryPanel`
  - `StageStatusPill`
- The prompt/domain fallback logic:
  - `promptGenerator`
  - `variationEngine`
- The shared UI package structure and typography direction:
  - Playfair display treatment
  - Inter body typography
  - gold-accent utility classes

## 3. Exact Files Changed

### Route shell and screen restoration
- `apps/web/src/app/routes.tsx`
- `apps/web/src/app/layouts/AppShell.tsx`
- `apps/web/src/app/layouts/ProjectLayout.tsx`
- `apps/web/src/app/components/status/FlowStepRail.tsx`
- `apps/web/src/app/screens/CreateRedirect.tsx`
- `apps/web/src/app/screens/CreateScreen.tsx`
- `apps/web/src/app/screens/GenerationScreen.tsx`
- `apps/web/src/app/screens/SelectedDesignScreen.tsx`
- `apps/web/src/app/screens/ProjectHome.tsx`
- `apps/web/src/app/screens/ProjectsIndex.tsx`
- `apps/web/src/app/screens/GalleryScreen.tsx`
- `apps/web/src/app/screens/SpecScreen.tsx`
- `apps/web/src/app/screens/TechnicalSheetScreen.tsx`
- `apps/web/src/app/screens/SvgScreen.tsx`
- `apps/web/src/app/screens/CadScreen.tsx`
- `apps/web/src/app/screens/WorkspaceResolver.tsx`
- `apps/web/src/app/screens/WorkspaceScreen.tsx`

### Real/fallback API wiring and contract alignment
- `apps/web/src/app/contracts/api.ts`
- `apps/web/src/app/contracts/stubs.ts`
- `apps/web/src/app/contracts/types.ts`
- `apps/web/src/app/hooks/useCreateDraftState.ts`
- `apps/web/src/vite-env.d.ts`
- `apps/web/vite.config.ts`

### Visual restoration and premium surface work
- `apps/web/src/app/screens/LandingPage.tsx`
- `apps/web/src/app/components/status/PromptPreviewStatusCard.tsx`
- `apps/web/src/app/components/status/GenerationStatusBanner.tsx`
- `apps/web/src/app/components/status/PairCardV1.tsx`
- `apps/web/src/app/components/status/SelectionSummaryPanel.tsx`
- `apps/web/src/app/components/RefineDrawer.tsx`
- `packages/ui/src/styles/theme.css`
- `packages/ui/src/styles/fonts.css`
- `packages/ui/src/styles/utilities.css`

### Foundation/lockfile alignment carried in this worktree
- `package-lock.json`

### Legacy workspace-tab lane files still present in the worktree
- `apps/web/src/app/components/workspace/CanvasGallery.tsx`
- `apps/web/src/app/components/workspace/DesignDetailDrawer.tsx`
- `apps/web/src/app/components/workspace/IconNav.tsx`
- `apps/web/src/app/components/workspace/tabs/CreateTab.tsx`
- `apps/web/src/app/components/create-flow/GemstonePicker.tsx`
- `apps/web/src/app/components/status/StageStatusPill.tsx`

These are not on the active canonical route path after the Phase 3A shell reapply, but they remain in the tree and should be cleaned up in a later consolidation slice.

## 4. What Is Now Wired For Real vs Still Placeholder

### Wired for real first, with guarded fallback
- `POST /v1/prompt-preview`
- `POST /v1/generate-design`
- `GET /v1/generations/:generationId`
- `GET /v1/projects/:projectId`
- `POST /v1/gallery/search`
- Request auth header injection for the current backend placeholder auth model
- `Idempotency-Key` generation for design submission
- Local dev `/v1` proxy path in Vite

### Still placeholder or partial
- Project creation/bootstrap is still frontend-local.
  - There is still no backend-owned project bootstrap path being used here.
- Full design detail fetch is still frontend-synthesized for live generations.
  - The backend generation status route does not return full design detail/state, so the frontend builds a minimal design record from cached create inputs.
- Pair selection persistence is still incomplete for the live path.
  - The selected-design route can open for a live generated pair, but full selected-design/project truth is not yet persisted via a backend design endpoint.
- Downstream stage routes remain frontend-local shells:
  - spec
  - technical sheet
  - svg
  - cad
- Refine submission remains a prepared surface, not a real wired live workflow.

## 5. Visual Identity Changes Made

- Restored the SkyGems dark-first visual system in shared tokens.
- Restored gold as the true accent role instead of purple.
- Reintroduced a luxury display hierarchy and richer glow/gradient surfaces.
- Rebuilt the landing page into a pair-first, editorial, gold-on-dark presentation.
- Removed implementation-flavored copy from the main route screens and replaced it with product-facing language.
- Added the selected-design hero pair viewer so the chosen design is the dominant visual surface instead of a flat summary card.
- Strengthened CTA hierarchy and status cue styling across create and generation.

## 6. Blockers / Risks

- The backend still requires a real project row for `POST /v1/prompt-preview` and `POST /v1/generate-design`.
  - If the current project is not provisioned in D1, the frontend will fall back to local preview/generation behavior.
- The backend still lacks a frontend-owned-safe project bootstrap endpoint.
  - This is the main reason the live path remains guarded instead of unconditional.
- `GET /v1/generations/:generationId` returns a singular pair and not a full design detail object.
  - The frontend now bridges that gap, but it is still an adapter, not end-state truth.
- The older workspace-tab lane still exists in the codebase.
  - It is no longer the active route shell, but some legacy WIP files remain present and should be cleaned up in a later slice.
- Web build still emits a large chunk warning (`~533 kB` JS after minification).
  - This is not a blocker for this slice, but chunking/code-splitting should be addressed later.
- Root `npm run typecheck` still emits a Wrangler log permission warning inside the sandbox.
  - Type generation and typecheck still completed successfully.

## 7. Recommended Next Claude Task

**Task: make the live path unconditional and finish the route-truth transition**

Recommended scope:
- Add or align a narrow backend-owned project bootstrap path so prompt-preview and generate-design do not need guarded fallback for normal dev use.
- Add a real design detail endpoint or expand generation status response enough to remove frontend-synthesized live design records.
- Wire selected-design persistence and pair selection truth to the backend.
- Wire the downstream stage routes (`spec`, `technical-sheet`, `svg`, `cad`) to real backend data.
- Remove or archive the obsolete workspace-tab lane once the canonical route shell is the only maintained UI path.

## Verification

- `npm run typecheck`
  - Passed.
  - Wrangler emitted a sandbox log-file permission warning while writing `~/.wrangler/logs`, but type generation still completed.
- `npm run build:web`
  - Passed.
  - Vite emitted a large-chunk warning only.
