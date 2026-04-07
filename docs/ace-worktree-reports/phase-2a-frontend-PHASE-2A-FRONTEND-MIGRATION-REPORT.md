# PHASE-2A Frontend Migration Report

Date: 2026-04-05
Worktree: `/Users/acevashisth/emdash-projects/worktrees/phase-2a-skygems-frontend-app-shell-migration-and-reusable-ui-port-3qp`

## 1. What I implemented

- Created the new frontend app shell in `apps/web` with the canonical Phase 1A route tree:
  - `/app`
  - `/app/projects`
  - `/app/projects/:projectId`
  - `/app/projects/:projectId/create`
  - `/app/projects/:projectId/generations/:generationId`
  - `/app/projects/:projectId/designs/:designId`
  - `/app/projects/:projectId/designs/:designId/spec`
  - `/app/projects/:projectId/designs/:designId/technical-sheet`
  - `/app/projects/:projectId/designs/:designId/svg`
  - `/app/projects/:projectId/designs/:designId/cad`
  - `/app/gallery`
- Implemented the canonical project-aware shell and nested project layout:
  - primary nav is now `Projects / Create / Gallery`
  - preview/copilot/export assumptions are removed from the new shell
  - project-scoped routes render with a `FlowStepRail`
- Ported the shared visual system and required reusable primitives into `packages/ui`.
- Implemented the required reusable status/state building blocks:
  - `FlowStepRail`
  - `GenerationStatusBanner`
  - `StageStatusPill`
  - `PromptPreviewStatusCard`
  - `PairCardV1`
- Extracted the create flow out of the old monolithic generator into reusable controls:
  - `JewelryTypePicker`
  - `MetalPicker`
  - `GemstonePicker`
  - `StylePicker`
  - `ComplexityControl`
- Added contextual refine UI via `RefineDrawer` inside the selected-design workspace instead of a standalone copilot route.
- Added typed placeholder contracts, stub data, and async adapter functions aligned to the Phase 1A names and flow.
- Implemented richer downstream shells for Spec, Technical Sheet, SVG, and CAD using the locked route/state model.
- Implemented a secondary gallery/search surface that reopens designs inside project context.

## 2. What existing code/assets I carried forward

- `src/styles/theme.css`
  - Ported into `packages/ui/src/styles/theme.css`
- `src/styles/fonts.css`
  - Ported into `packages/ui/src/styles/fonts.css`
- Useful shadcn/ui primitives
  - Kept and ported the primitives actually used now: `badge`, `button`, `card`, `input`, `progress`, `select`, `separator`, `sheet`, `skeleton`, `tabs`, `textarea`
- `ImageWithFallback.tsx`
  - Ported into `packages/ui/src/components/media/image-with-fallback.tsx`
- Structured create-flow ideas from `DesignGenerator.tsx`
  - Rebuilt as extracted create controls plus a prompt-preview state card
- Useful workspace/layout concepts from `RootLayout.tsx`
  - Reused the sidebar/workspace-shell pattern, but replaced the route model and nav
- Browse/search presentation ideas from Dashboard/Gallery
  - Reused the browse-card framing and added a gallery detail panel with project-context reopen
- CAD format-selection ideas from `CADExport.tsx`
  - Reused as the CAD format tile grid plus per-format job/status list
- Prompt/domain vocabulary from the old frontend
  - Reused the composition-first prompt builder and variation vocabulary as local fallback scaffolding only

## 3. Exact files changed/created

```text
PHASE-2A-FRONTEND-MIGRATION-REPORT.md
apps/web/index.html
apps/web/package.json
apps/web/tsconfig.json
apps/web/vite.config.ts
apps/web/src/main.tsx
apps/web/src/styles/index.css
apps/web/src/styles/tailwind.css
apps/web/src/app/App.tsx
apps/web/src/app/routes.tsx
apps/web/src/app/layouts/AppShell.tsx
apps/web/src/app/layouts/ProjectLayout.tsx
apps/web/src/app/lib/routes.ts
apps/web/src/app/hooks/useCreateDraftState.ts
apps/web/src/app/contracts/api.ts
apps/web/src/app/contracts/constants.ts
apps/web/src/app/contracts/stubs.ts
apps/web/src/app/contracts/types.ts
apps/web/src/app/domain/promptGenerator.ts
apps/web/src/app/domain/variationEngine.ts
apps/web/src/app/components/ProjectSwitcher.tsx
apps/web/src/app/components/RefineDrawer.tsx
apps/web/src/app/components/create-flow/ComplexityControl.tsx
apps/web/src/app/components/create-flow/GemstonePicker.tsx
apps/web/src/app/components/create-flow/JewelryTypePicker.tsx
apps/web/src/app/components/create-flow/MetalPicker.tsx
apps/web/src/app/components/create-flow/StylePicker.tsx
apps/web/src/app/components/status/FlowStepRail.tsx
apps/web/src/app/components/status/GenerationStatusBanner.tsx
apps/web/src/app/components/status/PairCardV1.tsx
apps/web/src/app/components/status/PromptPreviewStatusCard.tsx
apps/web/src/app/components/status/SelectionSummaryPanel.tsx
apps/web/src/app/components/status/StageStatusPill.tsx
apps/web/src/app/screens/CadScreen.tsx
apps/web/src/app/screens/CreateRedirect.tsx
apps/web/src/app/screens/CreateScreen.tsx
apps/web/src/app/screens/GalleryScreen.tsx
apps/web/src/app/screens/GenerationScreen.tsx
apps/web/src/app/screens/LandingPage.tsx
apps/web/src/app/screens/ProjectHome.tsx
apps/web/src/app/screens/ProjectsIndex.tsx
apps/web/src/app/screens/SelectedDesignScreen.tsx
apps/web/src/app/screens/SpecScreen.tsx
apps/web/src/app/screens/SvgScreen.tsx
apps/web/src/app/screens/TechnicalSheetScreen.tsx
apps/web/src/app/screens/WorkspaceResolver.tsx
packages/ui/package.json
packages/ui/tsconfig.json
packages/ui/src/index.ts
packages/ui/src/lib/utils.ts
packages/ui/src/styles/fonts.css
packages/ui/src/styles/index.css
packages/ui/src/styles/theme.css
packages/ui/src/components/media/image-with-fallback.tsx
packages/ui/src/components/ui/badge.tsx
packages/ui/src/components/ui/button.tsx
packages/ui/src/components/ui/card.tsx
packages/ui/src/components/ui/input.tsx
packages/ui/src/components/ui/progress.tsx
packages/ui/src/components/ui/select.tsx
packages/ui/src/components/ui/separator.tsx
packages/ui/src/components/ui/sheet.tsx
packages/ui/src/components/ui/skeleton.tsx
packages/ui/src/components/ui/tabs.tsx
packages/ui/src/components/ui/textarea.tsx
```

## 4. Assumptions awaiting backend foundation merge

- Real networking is still placeholder-only for:
  - `POST /v1/prompt-preview`
  - `POST /v1/generate-design`
  - `GET /v1/generations/:generationId`
  - `POST /v1/designs/:designId/refine`
  - downstream trigger endpoints
  - `POST /v1/gallery/search`
- Project creation is still routed through placeholder logic because the backend foundation for lightweight project creation is not merged in this branch.
- Selection persistence, stale-downstream confirmation flows, and generation polling resilience are modeled in UI/state shape, but not yet backed by real server state.
- The local prompt preview remains a fallback only; backend preview output should become the canonical prompt source once merged.
- Where the UX pack appendix constants drifted from the backend-aligned design DNA vocabulary, I stayed aligned to the Phase 1A backend contract plus the existing prompt/variation vocabulary already present in the repo.

## 5. Blockers / risks

- No real backend/auth/project persistence is available in this branch, so all project/design/generation data is still typed placeholder data.
- Downstream stage screens are structurally aligned, but they are not yet driven by real workflow job state.
- The app shell and UI package are now self-contained without root workspace config changes; if the backend foundation later standardizes workspace tooling, that integration still needs to happen explicitly.
- TypeScript CLI was not available in the repo root toolchain during validation, so the strongest successful local validation here is the Vite production build.

## 6. Recommended next frontend task

- Wire the first real product slice against backend foundation:
  - real `POST /v1/prompt-preview`
  - real `POST /v1/generate-design`
  - real `GET /v1/generations/:generationId`
  - preserve the current route shell and state components
  - replace placeholder generation payloads with real `pair_v1` polling data

## Validation

- Passed: `npm --prefix apps/web run build`
- Not run: standalone `tsc` typecheck, because a TypeScript CLI binary was not present in the current repo toolchain
