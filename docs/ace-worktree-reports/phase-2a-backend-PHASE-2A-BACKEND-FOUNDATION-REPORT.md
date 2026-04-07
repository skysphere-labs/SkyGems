# Phase 2A Backend Foundation Report

Date: 2026-04-05
Worktree: `/Users/acevashisth/emdash-projects/worktrees/phase-2a-skygems-monorepo-backend-foundation-and-contract-implementation-6oa`

## 1. What I implemented

### Monorepo / workspace foundation

- Converted the repo from a single-root Vite app into a workspace layout with:
  - `apps/web`
  - `apps/api`
  - `packages/shared`
- Added root workspace orchestration in `package.json`.
- Added `tsconfig.base.json` for shared compiler defaults.
- Added root `wrangler.toml` with current Cloudflare binding scaffolding for:
  - D1
  - R2
  - Queues
  - Workflows
  - Workers AI / AI Gateway binding
- Regenerated `package-lock.json` for the workspace layout.

### Shared contracts / domain package

- Implemented `packages/shared` as the locked contract/domain package.
- Added:
  - prefixed ID schemas and ID generators
  - canonical enums and status types
  - Zod request/response schemas for the locked public API
  - Zod agent output schemas
  - Zod queue payload schemas
  - canonical `design_dna` schema
  - deterministic `design_dna` derivation helpers
  - prompt-preview / prompt-bundle helpers
  - artifact key builders matching the locked R2 naming rules
  - stable JSON and SHA-256 helpers for idempotency and fingerprints

### D1 foundation

- Added `apps/api/migrations/0001_phase2a_foundation.sql`.
- The migration implements the locked schema for:
  - `tenants`
  - `users`
  - `project_memberships`
  - `projects`
  - `designs`
  - `generations`
  - `generation_pairs`
  - `design_workflow_runs`
  - `design_specs`
  - `technical_sheets`
  - `svg_assets`
  - `cad_jobs`
  - `artifacts`
  - `idempotency_records`
- Added the minimum index pack from the Phase 1A backend contract.

### API worker scaffold

- Added `apps/api/src/index.ts` with:
  - `/v1/*` router skeleton
  - header-based auth/tenant stub middleware
  - tenant/user auto-upsert for the auth stub
  - idempotency enforcement helper path for write endpoints
  - queue handler scaffold
  - workflow class scaffold
- Implemented schema-valid initial versions of:
  - `POST /v1/prompt-preview`
  - `POST /v1/generate-design`
  - `GET /v1/generations/:generationId`
  - `GET /v1/projects/:projectId`
  - `POST /v1/gallery/search`
- Added route skeletons for:
  - `POST /v1/designs/:designId/refine`
  - `POST /v1/designs/:designId/spec`
  - `POST /v1/designs/:designId/technical-sheet`
  - `POST /v1/designs/:designId/svg`
  - `POST /v1/designs/:designId/cad`

## 2. What existing code/assets I carried forward

### Carried into `packages/shared`

- `src/app/services/variationEngine.ts`
  - carried forward the five variation axes
  - carried forward the type-specific option sets
  - refactored into deterministic backend-owned `design_dna` helpers in:
    - `packages/shared/src/domain/design-dna.ts`
- `src/app/utils/promptGenerator.ts`
  - carried forward the composition-first prompt structure
  - carried forward the metal / gemstone / style vocabulary
  - refactored behind prompt/domain helpers in:
    - `packages/shared/src/domain/design-dna.ts`
    - `packages/shared/src/domain/vocab.ts`
- `src/app/screens/DesignGenerator.tsx`
  - carried forward the canonical initial controlled vocab:
    - jewelry types
    - metals
    - gemstones
    - styles
  - mapped into:
    - `packages/shared/src/contracts/enums.ts`
    - `packages/shared/src/domain/vocab.ts`
- `src/app/services/storageService.ts`
  - reused the valid field ideas from `DesignFeatures` / `DesignVariation`
  - mapped them into:
    - `CreateDesignInputSchema`
    - `DesignDnaSchema`
    - `VariationOverrideSchema`

### Carried structurally, not behaviorally

- The existing frontend shell was preserved and moved under `apps/web` without route rewrites.
- I did not carry forward localStorage or route assumptions as backend truth.

## 3. Exact files changed/created

### Root

```text
package.json
package-lock.json
tsconfig.base.json
wrangler.toml
```

### `apps/api`

```text
apps/api/migrations/0001_phase2a_foundation.sql
apps/api/package.json
apps/api/src/index.ts
apps/api/src/lib/auth.ts
apps/api/src/lib/d1.ts
apps/api/src/lib/http.ts
apps/api/src/lib/idempotency.ts
apps/api/test/migrations.test.ts
apps/api/tsconfig.json
apps/api/worker-configuration.d.ts
```

### `packages/shared`

```text
packages/shared/package.json
packages/shared/src/contracts/agents.ts
packages/shared/src/contracts/api.ts
packages/shared/src/contracts/enums.ts
packages/shared/src/contracts/ids.ts
packages/shared/src/contracts/primitives.ts
packages/shared/src/contracts/queues.ts
packages/shared/src/contracts/schemas.test.ts
packages/shared/src/domain/artifacts.ts
packages/shared/src/domain/design-dna.ts
packages/shared/src/domain/vocab.ts
packages/shared/src/index.ts
packages/shared/src/lib/crypto.ts
packages/shared/src/lib/json.ts
packages/shared/tsconfig.json
```

### `apps/web` structure created from the existing frontend shell

Top-level moved files:

```text
apps/web/.env.example
apps/web/index.html
apps/web/package.json
apps/web/postcss.config.mjs
apps/web/tsconfig.json
apps/web/vite.config.ts
```

Moved source files:

```text
apps/web/src/app/App.tsx
apps/web/src/app/components/figma/ImageWithFallback.tsx
apps/web/src/app/components/ui/accordion.tsx
apps/web/src/app/components/ui/alert-dialog.tsx
apps/web/src/app/components/ui/alert.tsx
apps/web/src/app/components/ui/aspect-ratio.tsx
apps/web/src/app/components/ui/avatar.tsx
apps/web/src/app/components/ui/badge.tsx
apps/web/src/app/components/ui/breadcrumb.tsx
apps/web/src/app/components/ui/button.tsx
apps/web/src/app/components/ui/calendar.tsx
apps/web/src/app/components/ui/card.tsx
apps/web/src/app/components/ui/carousel.tsx
apps/web/src/app/components/ui/chart.tsx
apps/web/src/app/components/ui/checkbox.tsx
apps/web/src/app/components/ui/collapsible.tsx
apps/web/src/app/components/ui/command.tsx
apps/web/src/app/components/ui/context-menu.tsx
apps/web/src/app/components/ui/dialog.tsx
apps/web/src/app/components/ui/drawer.tsx
apps/web/src/app/components/ui/dropdown-menu.tsx
apps/web/src/app/components/ui/form.tsx
apps/web/src/app/components/ui/hover-card.tsx
apps/web/src/app/components/ui/input-otp.tsx
apps/web/src/app/components/ui/input.tsx
apps/web/src/app/components/ui/label.tsx
apps/web/src/app/components/ui/menubar.tsx
apps/web/src/app/components/ui/navigation-menu.tsx
apps/web/src/app/components/ui/pagination.tsx
apps/web/src/app/components/ui/popover.tsx
apps/web/src/app/components/ui/progress.tsx
apps/web/src/app/components/ui/radio-group.tsx
apps/web/src/app/components/ui/resizable.tsx
apps/web/src/app/components/ui/scroll-area.tsx
apps/web/src/app/components/ui/select.tsx
apps/web/src/app/components/ui/separator.tsx
apps/web/src/app/components/ui/sheet.tsx
apps/web/src/app/components/ui/sidebar.tsx
apps/web/src/app/components/ui/skeleton.tsx
apps/web/src/app/components/ui/slider.tsx
apps/web/src/app/components/ui/sonner.tsx
apps/web/src/app/components/ui/switch.tsx
apps/web/src/app/components/ui/table.tsx
apps/web/src/app/components/ui/tabs.tsx
apps/web/src/app/components/ui/textarea.tsx
apps/web/src/app/components/ui/toggle-group.tsx
apps/web/src/app/components/ui/toggle.tsx
apps/web/src/app/components/ui/tooltip.tsx
apps/web/src/app/components/ui/use-mobile.ts
apps/web/src/app/components/ui/utils.ts
apps/web/src/app/layouts/RootLayout.tsx
apps/web/src/app/routes.tsx
apps/web/src/app/screens/AICoPilot.tsx
apps/web/src/app/screens/CADExport.tsx
apps/web/src/app/screens/Dashboard.tsx
apps/web/src/app/screens/DesignGallery.tsx
apps/web/src/app/screens/DesignGenerator.tsx
apps/web/src/app/screens/DesignPreview.tsx
apps/web/src/app/screens/LandingPage.tsx
apps/web/src/app/services/storageService.ts
apps/web/src/app/services/variationEngine.ts
apps/web/src/app/utils/promptGenerator.ts
apps/web/src/main.tsx
apps/web/src/styles/fonts.css
apps/web/src/styles/index.css
apps/web/src/styles/tailwind.css
apps/web/src/styles/theme.css
```

## 4. What still remains stubbed

- Queue consumers are scaffolded only; the worker currently acks messages and does not run generation/refine/spec execution.
- `DesignPipelineWorkflow` is a valid stub workflow entrypoint, not the real downstream orchestrator yet.
- `POST /v1/designs/:designId/refine` exists only as a route skeleton and does not yet create a child design/generation.
- Downstream stage POST routes (`spec`, `technical-sheet`, `svg`, `cad`) exist only as route skeletons.
- `GET /v1/generations/:generationId` supports the locked response shape, but real `pair_v1` artifacts are not produced yet because the generate consumer is not implemented.
- Artifact URLs are currently stubbed URL placeholders derived from the artifact row and R2 key; real signed URL generation is not implemented yet.
- The auth boundary is intentionally a header-driven stub:
  - `x-skygems-tenant-id`
  - `x-skygems-user-id`
  - `x-skygems-auth-subject`
  - `x-skygems-user-email`
- There is still no public project creation endpoint in v1, so project rows must be seeded/provisioned externally for now.

## 5. Blockers / risks

- Wrangler type generation required running outside the sandbox because Wrangler writes logs and binds locally while generating runtime types.
- `apps/api/worker-configuration.d.ts` is generated from the current `wrangler.toml`; it must be regenerated if bindings change.
- The worker currently persists real rows for `generate-design`, but without consumer implementation those generations will remain `queued`.
- Since project creation is outside the locked public API surface, local/manual seeding or upstream provisioning is still required to exercise the happy path.
- Signed R2 download URLs are still stubbed, so pair/spec/svg/cad artifact readback is not production-ready.

## 6. Recommended next backend task

Implement the real generate/refine execution lane next:

1. `POST /v1/designs/:designId/refine`
2. generate/refine queue consumers
3. real `generation_pairs` + `artifacts` persistence
4. real pair artifact URL signing/readback

Reason:

- it completes the first meaningful product slice behind the locked contracts
- it turns `GET /v1/generations/:generationId` from a persistence stub into a real pair poller
- it de-risks the downstream workflow work by proving the artifact registry and `design_dna` foundation first

## Verification run

The strongest local checks completed in this wave:

```text
npm install
npm run cf:typegen
npm run typecheck --workspace @skygems/shared
npm run typecheck --workspace @skygems/api
npm run typecheck --workspace @skygems/web
npm test
npm run build:web
```
