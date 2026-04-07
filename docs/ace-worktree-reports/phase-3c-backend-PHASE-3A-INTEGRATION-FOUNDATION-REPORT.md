# Phase 3A Integration Foundation Report

Date: 2026-04-05
Branch: `emdash/phase-3a-skygems-unified-integration-foundation-cloudflare-resource-adoption-5pu`
Status: Integration complete. Not merged to main.

## 1. What was integrated

This branch reconciles the Phase 2A backend and frontend lanes into a single coherent monorepo foundation from main (commit `2835a39`).

### Merge Units applied

| Unit | Source | Scope | Status |
| --- | --- | --- | --- |
| 1. Backend workspace scaffold | main (already present) | Root `package.json`, `tsconfig.base.json`, `wrangler.toml`, monorepo workspace config | Complete |
| 2. Shared contracts/domain package | main (already present) | `packages/shared/**` — Zod contracts, enums, domain helpers, crypto, json utils | Complete |
| 3. API worker foundation | main (already present) | `apps/api/**` — Worker entry, auth, D1 helpers, HTTP utils, idempotency, migrations | Complete |
| 4. Canonical frontend app shell | Phase 2A frontend worktree | `apps/web/src/app/**` — WorkspaceScreen, tab-based navigation, status/create-flow components, contracts, domain, hooks | Complete |
| 5. Reusable UI package | Phase 2A frontend worktree | `packages/ui/**` — 11 UI primitives, ImageWithFallback, theme/fonts/utilities CSS, cn utility | Complete |

### Additional reconciliation performed

- Hand-merged 6 overlap files (Section 2)
- Replaced frontend placeholder contract types with `@skygems/shared` re-exports where safe
- Aligned CAD format options to backend-supported values (removed `3dm`, `obj`)
- Cleaned up dead MUI/Emotion/Popper dependencies from `apps/web/package.json`
- Removed old root SPA files (`src/`, root `index.html`, root `vite.config.ts`, root `tsconfig.json`, `postcss.config.mjs`, `.env.example`)

## 2. Exact files/areas reconciled

### Hand-merged overlap files

| File | Backend contribution | Frontend contribution | Result |
| --- | --- | --- | --- |
| `apps/web/package.json` | Full dependency set, workspace scripts, typecheck script | `@skygems/shared` and `@skygems/ui` workspace deps | Backend baseline + workspace deps added, dead MUI/Emotion deps removed |
| `apps/web/tsconfig.json` | `extends: "../../tsconfig.base.json"`, `@/*` path | `@skygems/ui` and `@skygems/ui/*` path aliases, `../../packages/ui/src` in include | Merged: backend extends + frontend aliases |
| `apps/web/vite.config.ts` | `@` alias, assetsInclude | `root: __dirname`, `@skygems/ui` alias | Merged: all combined |
| `apps/web/index.html` | SkyGems title, viewport-locked body | `class="dark"` on html, clean body | Frontend-authoritative: dark mode default, SkyGems title |
| `apps/web/src/styles/index.css` | Local font/theme imports | `packages/ui` style imports | Frontend-authoritative: imports from `packages/ui` |
| `apps/web/src/styles/tailwind.css` | Tailwind v4 source directive | Added `packages/ui` source path | Frontend-authoritative |

### Backend-carried legacy files removed

| File/Area | Reason |
| --- | --- |
| `apps/web/src/app/screens/{Dashboard,DesignGenerator,DesignGallery,DesignPreview,AICoPilot,CADExport}.tsx` | Replaced by canonical WorkspaceScreen with tab architecture |
| `apps/web/src/app/layouts/RootLayout.tsx` | Replaced by WorkspaceScreen (contains its own IconNav layout) |
| `apps/web/src/app/services/{storageService,variationEngine}.ts` | Replaced by `apps/web/src/app/domain/` and `@skygems/shared` |
| `apps/web/src/app/utils/promptGenerator.ts` | Replaced by `apps/web/src/app/domain/promptGenerator.ts` |
| `apps/web/src/app/components/ui/**` (50+ shadcn files) | Replaced by `packages/ui` |
| `apps/web/src/app/components/figma/ImageWithFallback.tsx` | Replaced by `packages/ui/src/components/media/image-with-fallback.tsx` |
| `apps/web/src/styles/{fonts,theme}.css` | Replaced by `packages/ui/src/styles/` |
| `apps/web/.env.example`, `apps/web/postcss.config.mjs` | No longer needed in workspace structure |
| Root `src/**`, `index.html`, `vite.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `.env.example` | Old root SPA superseded by monorepo |

### Contract adapter reconciliation

| Contract area | Action taken |
| --- | --- |
| `JewelryType`, `Metal`, `Gemstone`, `SelectionState`, `SourceKind`, `CadFormat`, `DesignDna` | Re-exported from `@skygems/shared` |
| `DesignStyle` | Aliased from `@skygems/shared`'s `Style` |
| `GenerationStatus` | Kept local with TODO — backend uses `running`/`succeeded`/`canceled`, frontend uses `processing`/`completed` |
| `StageStatus` | Kept local with TODO — backend uses `not_requested`/`running`/`succeeded`/`skipped`, frontend uses `absent`/`processing`/`ready`/`stale` |
| `CadFormat` options | Reduced from 5 to 3: only `step`, `stl`, `dxf` (backend-supported) |
| `Generation.pairs` (plural) | Kept local with TODO — backend returns singular `pair`, frontend models plural `pairs[]` |

## 3. What from existing SkyGems was preserved

### Preserved intact from backend lane

- Root monorepo configuration (workspace scripts, TypeScript base, wrangler bindings)
- `apps/api` — complete Worker entry with all 10 API endpoint handlers, queue consumers, workflow entrypoint
- `apps/api/src/lib` — auth, D1, HTTP, idempotency helpers
- `apps/api/migrations/0001_phase2a_foundation.sql` — D1 schema
- `packages/shared` — all Zod contracts (api, agents, enums, ids, primitives, queues), domain helpers (design-dna, vocab, artifacts), utilities (crypto, json)

### Preserved intact from frontend lane

- WorkspaceScreen tab-based architecture (IconNav, TabPanel, CanvasGallery, DesignDetailDrawer)
- 5 tab panels (Create, Gallery, Projects, Pipeline, Export)
- 5 create-flow components (JewelryTypePicker, MetalPicker, GemstonePicker, StylePicker, ComplexityControl)
- 5 status components (GenerationStatusBanner, PairCardV1, PromptPreviewStatusCard, SelectionSummaryPanel, StageStatusPill)
- ProjectSwitcher, RefineDrawer
- `useCreateDraftState` hook with synced/override prompt mode
- Typed API stubs with delay simulation
- Mock data layer (3 projects, 4 designs, generations, gallery search)
- Domain logic (promptGenerator, variationEngine) as frontend fallbacks
- Forward-compatible route helpers in `lib/routes.ts`
- `packages/ui` — 11 UI primitives, ImageWithFallback, complete dark-luxury theme CSS

### Preserved from original repo

- LandingPage.tsx marketing screen
- Design system: dark luxury palette (#0A0A0A), gold accent (#D4AF37), Playfair Display + Inter fonts
- All CSS custom property tokens from `packages/ui/src/styles/theme.css`

## 4. Cloudflare/GemStudio resource strategy

### Inspected resources

| Resource | Source | Finding |
| --- | --- | --- |
| D1: `tenant-prod-baseline-prod` | Account inventory | GemStudio/OpenClaw tenant DB. Multi-tenant schema with `tenants`, `users`, `memberships`. |
| D1: `tenant-prod-baseline-staging` | Account inventory | Staging mirror of above. |
| D1: `skystudio-control-prod` | Account inventory | GemStudio control plane DB. |
| D1: `skystudio-control-staging` | Account inventory | Staging mirror. |
| D1: `brands-dashboard` | Account inventory | Separate dashboard DB. Not relevant to SkyGems. |
| D1: `cmip-sessions` | Account inventory | Session storage. Not relevant. |
| Gateway Worker: `gemforge-gateway` | `wrangler.gateway.toml` | Edge gateway with JWT validation, rate limiting, tenant routing. Uses Auth0 (`gemstudio.auth0.com`), KV for tenant state/JWKS cache/rate limits. Routes to `app.skyslab.ai`. |
| Sandbox Worker: `tool-sandbox` | `wrangler.sandbox.toml` | Agent testing sandbox at `sandbox.skyslab.ai`. Not relevant to SkyGems core. |

### Resource decisions

| Resource type | Decision | Rationale |
| --- | --- | --- |
| **D1 database** | **Create new**: `skygems` | SkyGems has its own schema (`0001_phase2a_foundation.sql`) with jewelry-specific tables (designs, generations, generation_pairs, design_specs, etc.). The existing `tenant-prod-baseline` and `skystudio-control` DBs serve GemStudio's different domain model. Reusing them would create coupling and schema conflicts. `wrangler.toml` already declares `database_name = "skygems"` with placeholder ID. |
| **R2 bucket** | **Create new**: `skygems-artifacts` | SkyGems artifact types (pair sketches, renders, tech sheets, SVGs, CAD files) are distinct from GemStudio assets. `wrangler.toml` already declares `bucket_name = "skygems-artifacts"`. |
| **Queues** | **Create new**: `skygems-generate`, `skygems-refine`, `skygems-spec` | SkyGems-specific async job queues for generation/refine/spec. Already declared in `wrangler.toml`. |
| **Workflows** | **Create new**: `skygems-design-pipeline` | Dedicated workflow for the spec → technical-sheet → SVG → CAD pipeline. Already declared in `wrangler.toml`. |
| **AI Gateway** | **Reuse pattern, new binding** | The `gemforge-gateway` pattern (JWT validation + rate limiting + tenant routing) is a good reference architecture. SkyGems should adopt the same Auth0-based JWT validation pattern and the KV-based tenant/JWKS cache approach. However, SkyGems uses `AI_GATEWAY` as a direct Workers AI binding, not as a proxy worker. For provider routing (xAI primary, Google secondary), configure the AI Gateway binding to route through Cloudflare's AI Gateway product which supports multiple providers. |
| **Auth/tenant bootstrap** | **Adopt GemStudio pattern with new tenant** | Reuse the Auth0 issuer (`gemstudio.auth0.com`) and audience pattern from the gateway worker. SkyGems API already has `resolveAuthContext()` and `ensureTenantAndUser()` stubs in `apps/api/src/lib/auth.ts`. Wire these to the same Auth0 tenant but with SkyGems-specific RBAC scopes. |
| **KV namespaces** | **Create new if needed** | The gateway's `GATEWAY_KV` and `ASSET_CACHE_KV` patterns are useful references. SkyGems may need similar KV for JWKS cache and gallery search cache, but this can be deferred until the auth and caching slices. |
| **DNS/routing** | **Defer** | The gateway routes to `app.skyslab.ai` and `*.skyslab.ai`. SkyGems deployment routing is a post-integration concern. |

### Provider routing strategy

| Priority | Provider | Usage | Configuration |
| --- | --- | --- | --- |
| Primary | xAI | Image generation (sketch + render pair production) | Route through Cloudflare AI Gateway. API key via Worker secret (`XAI_API_KEY`), never in repo. |
| Secondary | Google (Nano Banana Pro 2) | Fallback/high-quality alternative | Same AI Gateway routing. API key via Worker secret (`GOOGLE_API_KEY`). |
| Tool | Stitch API | Frontend/design assistance (future) | Not wired in this phase. Key in local context only. |

### What should NOT be reused from GemStudio

- The `tenant-prod-baseline` and `skystudio-control` D1 databases — different schema, different domain
- The `brands-dashboard` and `cmip-sessions` databases — unrelated
- The `tool-sandbox` worker — testing infrastructure, not product
- Any hardcoded GemStudio-specific tenant slugs or resource IDs

## 5. Current blocker list

| Blocker | Impact | Resolution path |
| --- | --- | --- |
| **D1 database not provisioned** | Cannot run backend locally with real data | Run `npx wrangler d1 create skygems` and update `database_id` in `wrangler.toml` |
| **R2 bucket not provisioned** | Cannot store artifacts | Run `npx wrangler r2 bucket create skygems-artifacts` |
| **Queues not provisioned** | Cannot test async generation | Run `npx wrangler queues create skygems-generate` (and refine, spec) |
| **Auth not wired** | `resolveAuthContext()` returns placeholder | Wire Auth0 JWT validation with real issuer/audience |
| **Project bootstrap gap** | No `POST /v1/projects` endpoint exists | Add narrow project creation endpoint or define out-of-band provisioning |
| **Frontend GenerationStatus drift** | Cannot wire real polling without mapping layer | Add status adapter: `running→processing`, `succeeded→completed` |
| **Frontend plural pairs model** | Cannot wire real `GET /v1/generations/:id` response | Normalize frontend to singular `pair` model |
| **npm install not run** | Dependencies not installed in this worktree | Run `npm install` to resolve workspace dependencies |
| **Vite→Next/OpenNext migration pending** | SPA cannot be deployed as Cloudflare Pages Worker with service bindings | Deferred to dedicated platform slice |

## 6. What is ready for the first real wired slice

### Ready now

- **Backend API skeleton** is complete with all 10 endpoint handlers, queue consumers, and workflow
- **D1 schema** is ready to apply (`0001_phase2a_foundation.sql`)
- **Shared contracts** are locked and exported with Zod validation
- **Frontend workspace** is functional with stub data and all UI components
- **`@skygems/shared` is wired** into `apps/web/src/app/contracts/types.ts` for matching types
- **Forward-compatible route helpers** exist in `lib/routes.ts`
- **Provider preference** is documented (xAI primary, Google secondary)
- **Cloudflare resource strategy** is explicit

### First wired slice targets

1. Provision Cloudflare resources (D1, R2, Queues)
2. Wire `POST /v1/prompt-preview` — frontend calls real endpoint, returns `normalizedInput + designDnaPreview + promptSummary + promptText`
3. Wire `POST /v1/generate-design` with `Idempotency-Key` — enqueue to `GENERATE_QUEUE`
4. Wire `GET /v1/generations/:generationId` — poll generation status with real singular `pair` response
5. Normalize frontend Generation model from plural `pairs[]` to singular `pair`
6. Add GenerationStatus adapter: `running→processing`, `succeeded→completed`
7. Wire real pair display (sketch/render URLs from R2 signed URLs)

## 7. Recommended next Codex task

**Task: Cloudflare resource provisioning + first prompt-preview wired slice**

Scope:
1. Create D1 database `skygems`, apply migration, update `wrangler.toml` with real ID
2. Create R2 bucket `skygems-artifacts`
3. Create queues: `skygems-generate`, `skygems-refine`, `skygems-spec`
4. Set provider API keys as Worker secrets (not committed)
5. Wire `POST /v1/prompt-preview` end-to-end:
   - Frontend `postPromptPreview()` calls real API
   - API handler calls shared `buildPromptPreview()` with xAI provider
   - Returns real `normalizedInput`, `designDnaPreview`, `promptSummary`, `promptText`
6. Add narrow project bootstrap path (seed a default project for dev)
7. Verify with `npm run dev:api` + `npm run dev:web`

This is the smallest useful wired slice that proves the integration works end-to-end without requiring generation polling or pair display changes.

**Follow-up task after that:**
- Wire `POST /v1/generate-design` + `GET /v1/generations/:generationId` + normalize frontend to singular pair model

## Appendix: Final integrated file tree

```
.
├── package.json                          # Root monorepo (workspaces: apps/*, packages/*)
├── package-lock.json
├── tsconfig.base.json                    # Shared TypeScript base config
├── wrangler.toml                         # Cloudflare Workers/D1/R2/Queues/Workflows
├── README.md
│
├── apps/api/                             # Backend API Worker
│   ├── package.json
│   ├── tsconfig.json
│   ├── worker-configuration.d.ts
│   ├── migrations/0001_phase2a_foundation.sql
│   ├── test/migrations.test.ts
│   └── src/
│       ├── index.ts                      # All endpoint handlers, queue consumers, workflow
│       └── lib/
│           ├── auth.ts                   # Auth context resolution
│           ├── d1.ts                     # D1 query helpers
│           ├── http.ts                   # HTTP response/error helpers
│           └── idempotency.ts            # Idempotency key management
│
├── apps/web/                             # Frontend Vite SPA
│   ├── package.json                      # Reconciled: backend deps + workspace refs
│   ├── tsconfig.json                     # Reconciled: extends base + @skygems/ui aliases
│   ├── vite.config.ts                    # Reconciled: root + all aliases
│   ├── index.html                        # Dark mode default
│   └── src/
│       ├── main.tsx
│       ├── styles/
│       │   ├── index.css                 # Imports tailwind + packages/ui styles
│       │   └── tailwind.css              # Tailwind v4 with packages/ui source
│       └── app/
│           ├── App.tsx
│           ├── routes.tsx                # Landing + WorkspaceScreen + catch-all
│           ├── lib/routes.ts             # Forward-compatible URL helpers
│           ├── screens/
│           │   ├── LandingPage.tsx
│           │   └── WorkspaceScreen.tsx   # Tab-based workspace shell
│           ├── components/
│           │   ├── workspace/            # IconNav, TabPanel, CanvasGallery, DesignDetailDrawer
│           │   │   └── tabs/             # CreateTab, GalleryTab, ProjectsTab, PipelineTab, ExportTab
│           │   ├── status/               # GenerationStatusBanner, PairCardV1, StageStatusPill, etc.
│           │   ├── create-flow/          # JewelryTypePicker, MetalPicker, GemstonePicker, etc.
│           │   ├── ProjectSwitcher.tsx
│           │   └── RefineDrawer.tsx
│           ├── contracts/
│           │   ├── types.ts              # Reconciled: re-exports @skygems/shared + local UI types
│           │   ├── api.ts                # Typed API stubs (ready for real fetch replacement)
│           │   ├── constants.ts          # UI options (CAD formats aligned to backend)
│           │   └── stubs.ts              # Mock data layer
│           ├── domain/
│           │   ├── promptGenerator.ts    # Frontend fallback prompt generation
│           │   └── variationEngine.ts    # Frontend fallback variation engine
│           └── hooks/
│               └── useCreateDraftState.ts # Create flow state machine
│
├── packages/shared/                      # Canonical contracts + domain
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                      # Barrel export
│       ├── contracts/                    # Zod schemas: api, agents, enums, ids, primitives, queues
│       ├── domain/                       # design-dna, vocab, artifacts
│       └── lib/                          # crypto (ULID, SHA256), json (stable stringify)
│
└── packages/ui/                          # Reusable UI primitives
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts                      # Barrel export
        ├── lib/utils.ts                  # cn() utility
        ├── styles/                       # theme.css, fonts.css, utilities.css
        └── components/
            ├── media/image-with-fallback.tsx
            └── ui/                       # badge, button, card, input, progress, select, etc.
```
