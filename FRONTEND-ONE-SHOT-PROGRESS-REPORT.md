# Frontend One-Shot Progress Report

Date: 2026-04-07
Branch: `emdash/skygems-one-shot-premium-frontend-completion-1me`
Status: Implementation-heavy frontend pass completed and validated.

## 1. What I Implemented

### 1.1 Real dev-session + live-truth adoption in the frontend contract layer
- Added a real frontend path for `POST /v1/dev/bootstrap` and cached the returned bearer session locally.
- Hydrated cached live projects back into the in-memory workspace map on reload so route-based project pages no longer depend on hardcoded stub state.
- Kept the stub path intact, but moved the frontend from “pretend live” headers toward actual backend auth/session truth.

### 1.2 Stronger live backend reads and writes
- Expanded the frontend contract layer to use backend truth for:
  - `GET /v1/projects/:projectId`
  - `GET /v1/projects/:projectId/designs`
  - `GET /v1/designs/:designId`
  - `POST /v1/designs/:designId/select`
  - `GET /v1/generations/:generationId`
  - `POST /v1/gallery/search`
- Added live-to-local syncing so fetched projects/designs update the route shell, project selection state, and cached workspace state.
- Added a recovery path for cached live projects so prompt preview and generate can re-bootstrap a dev session and stay live after reload instead of immediately dropping to fallback.

### 1.3 Explicit design selection flow polish
- Generation results now distinguish between a ready candidate and an already-selected active design.
- The generation CTA now attempts real explicit selection via `POST /v1/designs/:id/select` before routing into the workspace.
- The selected-design route now supports promoting a candidate into the active workspace directly from the design page.

### 1.4 Stronger selected-design workspace
- Added an “active workspace truth” vs “candidate workspace” state surface.
- Added design DNA context cards so the workspace carries more actual product information, not just imagery.
- Added recent generation-cycle links on the selected-design screen to make create/refine lineage easier to navigate.

### 1.5 Project and gallery surfaces tightened around selection truth
- Project home now highlights the active design more clearly and shows selection-state/status context for recent designs and generations.
- Gallery cards now surface selection state directly and include a loading state instead of feeling blank during search refreshes.
- Project layout now fetches project truth instead of assuming every project already exists in the local stub map.

### 1.6 Downstream route shells made more useful without faking missing artifacts
- Spec and Technical Sheet routes now stay informative even when downstream artifacts are not yet exposed by the backend.
- Instead of dropping into near-empty placeholders, those routes now show live design-DNA-derived baseline fields, notes, and current stage-truth messaging.
- SVG and CAD routes now include clearer stage-summary messaging and disable dead-end “generate” actions when the backend stage is still guarded.

### 1.7 Refine entry tightened
- The refine drawer now requires an actual instruction/preset before submission.
- Refine still falls back to the local queued-generation path, but the UX now behaves like a real queued action instead of a loose link-out.

## 2. What Flows Are Now Truly Live vs Still Guarded

### Truly live when a dev bootstrap session is available
- Project bootstrap via `POST /v1/dev/bootstrap`
- Prompt preview via `POST /v1/prompt-preview`
- Generate via `POST /v1/generate-design`
- Generation polling via `GET /v1/generations/:generationId`
- Project detail via `GET /v1/projects/:projectId`
- Project design list via `GET /v1/projects/:projectId/designs`
- Design detail via `GET /v1/designs/:designId`
- Explicit design selection via `POST /v1/designs/:designId/select`
- Gallery search via `POST /v1/gallery/search`

### Still guarded or partially local
- Projects index remains a merged cached-live + stub surface because there is still no canonical `GET /v1/projects` list route in main.
- Project generation history on Project Home still depends on local/stub state because there is no dedicated per-project generation list route exposed to the frontend.
- Refine submission still falls back to the local queued-generation path because the backend refine route is still intentionally stubbed.
- Spec / technical sheet / SVG / CAD execution is still guarded because those backend routes remain stubbed for execution and field-level artifact retrieval is not exposed.
- SVG/CAD download actions remain shell-level unless actual artifacts already exist in local state.

## 3. Exact Files Changed

- `apps/web/src/app/components/RefineDrawer.tsx`
- `apps/web/src/app/contracts/api.ts`
- `apps/web/src/app/contracts/stubs.ts`
- `apps/web/src/app/layouts/ProjectLayout.tsx`
- `apps/web/src/app/screens/CadScreen.tsx`
- `apps/web/src/app/screens/GalleryScreen.tsx`
- `apps/web/src/app/screens/GenerationScreen.tsx`
- `apps/web/src/app/screens/ProjectHome.tsx`
- `apps/web/src/app/screens/SelectedDesignScreen.tsx`
- `apps/web/src/app/screens/SpecScreen.tsx`
- `apps/web/src/app/screens/SvgScreen.tsx`
- `apps/web/src/app/screens/TechnicalSheetScreen.tsx`
- `FRONTEND-ONE-SHOT-PROGRESS-REPORT.md`

## 4. Design / UX Decisions Made

- Kept the route-based premium shell intact and pushed it closer to “selected design as the center of truth” instead of reviving workspace-tab behavior.
- Preferred explicit active/candidate labeling over hidden selection state so the generation-to-workspace handoff feels intentional.
- Chose live design-DNA baseline content for downstream routes rather than empty placeholders or fake generated artifacts.
- Disabled dead-end downstream actions where the backend is still stubbed instead of presenting misleading clickable CTAs.
- Preserved the dark luxury / gold system and kept the flow visually image-first rather than turning the app back into a dashboard.

## 5. Remaining Blockers

- No canonical live projects list endpoint exposed to the frontend.
- No dedicated live per-project generation list endpoint.
- `POST /v1/designs/:id/refine` is still intentionally stubbed in the backend.
- Downstream execution routes for spec / technical sheet / SVG / CAD are still intentionally stubbed.
- Field-level downstream artifact/detail reads are still missing, so the frontend can only show baseline context plus stage truth.

## 6. Exact Next Recommended Work Item

Implement the real downstream pipeline slice:
- expose frontend-safe reads for generated spec / technical sheet / SVG / CAD artifacts
- wire the existing downstream route screens to those artifact/detail reads
- then enable the corresponding POST stage triggers and polling so the selected-design workspace can drive the full production lane without guarded shells

## 7. Validation

- `npm run typecheck --workspace @skygems/web`
  - Passed.
- `npm run build:web`
  - Passed.
  - Output:
    - `dist/assets/index-Bg1VUPvK.css` `48.06 kB`
    - `dist/assets/index-CTHeIxFa.js` `491.59 kB`
