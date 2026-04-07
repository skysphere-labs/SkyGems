# Phase 0: Backend/Platform Reuse Audit & Contract Foundation Plan

**Date:** 2026-04-05
**Branch:** `emdash/phase-0-skygems-backend-platform-reuse-audit-contract-foundation-plan-5gh`
**Auditor:** Codex (Claude Opus 4.6)
**Repo:** SkyGems — single commit `2835a39` ("feat: SkyGems clean UI shell — stripped from gemstudio-dark-redesign")

---

## 1. What I Inspected

| Area | Files Read | Finding |
|------|-----------|---------|
| Root config | `package.json`, `vite.config.ts`, `tsconfig.json`, `.env.example`, `.gitignore`, `.emdash.json`, `postcss.config.mjs`, `index.html` | Single-package Vite 6 + React 18 SPA. No monorepo, no workspaces, no backend. |
| README | `README.md` | Documents routes, design system, styling rules. No backend/infra docs. |
| Routing | `src/app/routes.tsx` | React Router v7, 7 routes: `/`, `/app`, `/app/create`, `/app/gallery`, `/app/preview/:id`, `/app/copilot`, `/app/export` |
| Screens | All 7 screen components in `src/app/screens/` | Pure UI shells. Hardcoded placeholder data. No API calls. |
| Services | `src/app/services/storageService.ts` | localStorage-only persistence. `DesignMetadata` entity with CRUD. |
| Services | `src/app/services/variationEngine.ts` | Pure function: random variation selection for prompt diversity. No persistence. |
| Utilities | `src/app/utils/promptGenerator.ts` | Prompt builder for AI image generation. No API call — just string construction. |
| Components | `src/app/components/ui/*` (48 shadcn/ui components), `ImageWithFallback.tsx` | Standard shadcn/ui library + one custom component. |
| Styles | `src/styles/theme.css`, `fonts.css`, `index.css`, `tailwind.css` | Design tokens, Tailwind v4 integration. |
| Deployment config | None found | No `wrangler.toml`, no `Dockerfile`, no `cloudflare/`, no `workers/`, no CI/CD config. |
| Auth/tenant | None found | No auth, no session, no tenant resolution. Hardcoded "User Account" / "Premium Plan" in sidebar. |
| Database/ORM | None found | No D1, no Drizzle, no Prisma, no migrations, no schema files. |
| Queue/job/workflow | None found | No queue consumers, no Workflows, no background job definitions. |
| AI/provider adapters | None found | No API calls to any AI provider. `.env.example` mentions `VITE_XAI_API_KEY` (commented out) but nothing uses it. |
| Storage (R2/S3) | None found | No object storage integration. Images stored as data URIs in localStorage. |
| Git history | 1 commit total | Freshly initialized repo stripped from a prior `gemstudio-dark-redesign` branch. |

---

## 2. Current Backend/Platform Architecture Found

**There is no backend.** The repo is a **frontend-only UI shell** consisting of:

```
SkyGems/
  src/
    app/
      components/     # shadcn/ui library (48 files) + ImageWithFallback
      layouts/        # RootLayout (sidebar + Outlet)
      screens/        # 7 screen components (all UI-only, hardcoded data)
      services/       # storageService (localStorage) + variationEngine (pure fn)
      utils/          # promptGenerator (string builder)
      App.tsx          # RouterProvider
      routes.tsx       # React Router config
    styles/           # Design tokens, Tailwind
    main.tsx          # Entry point
  package.json        # Vite + React + Tailwind + shadcn + Motion
  vite.config.ts      # Standard Vite config, @ alias
```

### What exists in the services layer

1. **`storageService.ts`** — A `StorageManager` class wrapping `localStorage` with:
   - `DesignMetadata` interface: `{ id, prompt, imageUrl, imagePath, features, hash, liked, createdAt, updatedAt, tags, notes }`
   - `DesignFeatures` interface: `{ type, metal, gemstones[], style, complexity, variation }`
   - `DesignVariation` interface: `{ bandStyle, settingType, stonePosition, profile, motif }`
   - CRUD operations: save, get, getAll, update, delete, like/unlike, addTags, search by tags/features
   - Stats aggregation by type/metal/style
   - Export/import (JSON array)
   - Singleton pattern with module-level convenience functions

2. **`variationEngine.ts`** — Pure functions for random variation selection:
   - Per-type variation configs (ring, necklace, earrings, bracelet, pendant)
   - `generateVariations()`, `generateMultipleVariations()`, `formatVariationsForPrompt()`
   - Merge/validate helpers

3. **`promptGenerator.ts`** — Builds AI image generation prompts:
   - Composition-first prompt structure per jewelry type
   - Metal, gemstone, style, complexity descriptors
   - Integrates variation engine output into prompt string
   - No API call — just returns the prompt string

### What the screens expect but don't have

| Screen | Expected Backend Capability | Current State |
|--------|---------------------------|---------------|
| `DesignGenerator` | Image generation API | `console.log('Generate designs with config:', config)` — TODO comment |
| `AICoPilot` | Chat API for design refinement | Fake `setTimeout` that echoes user input after 2s |
| `DesignPreview` | Design data loading by `:id` | Hardcoded "Diamond Solitaire Ring", "Design #4127", static specs |
| `CADExport` | CAD file generation + download | Fake `setTimeout` export, hardcoded specs |
| `Dashboard` | Design listing | Reads from localStorage (works but no real data) |
| `DesignGallery` | Design CRUD | Reads from localStorage (works but no real data) |
| `LandingPage` | Auth/signup | "Sign In" links to `/app` with no auth |

---

## 3. Reuse Inventory: Keep / Refactor / Replace / Unknown

### KEEP as-is

| Item | Rationale |
|------|-----------|
| Design token system (`theme.css`) | Comprehensive, well-structured. Maps to shadcn/ui token system. Transfer directly to Next.js. |
| shadcn/ui component library (48 components) | Standard shadcn/ui — copy to `packages/ui` or equivalent. |
| `ImageWithFallback` component | Small, useful utility. Keep. |
| `variationEngine.ts` | Pure functions, no dependencies. Extract to shared package. |
| `promptGenerator.ts` | Pure functions, integrates with variation engine. Extract to shared package. Good prompt engineering. |
| Jewelry domain constants | Type lists, metal lists, gemstone lists, style lists hardcoded in screens. Extract to shared constants. |

### REFACTOR (extract, restructure, or adapt)

| Item | What Changes | Target |
|------|-------------|--------|
| `storageService.ts` — `DesignMetadata` interface | Extract as shared type, strip localStorage coupling | D1 entity types in `packages/shared` |
| `storageService.ts` — CRUD operations | Reimplement as D1 repository + API routes | API Worker `/v1/designs/*` |
| `storageService.ts` — search/filter logic | Move to D1 SQL queries with proper indexing | API Worker query endpoints |
| Route structure (`routes.tsx`) | Migrate from React Router to Next.js App Router file-system routing | `app/(app)/` directory structure |
| `RootLayout.tsx` | Adapt to Next.js layout component | `app/(app)/layout.tsx` |
| Screen components (all 7) | Wire to real API endpoints instead of localStorage/hardcoded data | Next.js page components with server components for data fetching |

### REPLACE (build new)

| Item | Rationale |
|------|-----------|
| localStorage persistence | Replace with D1 + API Worker |
| No auth system | Build auth/session/tenant resolution from scratch |
| No image generation API | Build queue-based generation pipeline (Queue -> AI Gateway -> R2) |
| No chat/copilot API | Build chat API with AI Gateway routing |
| No CAD export pipeline | Build Workflow: spec -> technical-sheet -> SVG -> CAD (Container) |
| No file storage | Build R2-backed artifact storage with signed URLs |
| No deployment infrastructure | Build Cloudflare Workers + OpenNext + wrangler config |
| No multi-tenancy | Design and build tenant isolation from Day 1 |

### UNKNOWN / NEEDS INVESTIGATION

| Item | Question |
|------|----------|
| Original `gemstudio-dark-redesign` branch | Was there prior backend work in the parent branch that was stripped? Worth checking if any backend patterns exist in the original repo. |
| xAI API key in `.env.example` | Was xAI the intended image generation provider? The prompt generator is provider-agnostic but clearly designed for image generation models. |
| Design metrics in `DesignPreview` (symmetry, feasibility, durability) | Are these planned AI-computed metrics or static UI mockup data? Affects whether we need a metrics computation step in the workflow. |
| Cost estimation in `DesignPreview` | Is material/manufacturing cost estimation a real feature requirement? Would need a pricing service. |

---

## 4. Recommended Repo/Platform Shape for Target Architecture

### Proposed monorepo structure

```
SkyGems/
  apps/
    web/                     # Next.js app (OpenNext on Cloudflare Workers)
      app/
        (marketing)/         # Landing page, public routes
        (app)/               # Authenticated app routes
          dashboard/
          create/
          gallery/
          preview/[id]/
          copilot/
          export/
          layout.tsx         # RootLayout (sidebar + Outlet)
      components/            # App-specific components
      lib/                   # Client-side hooks, context
    api/                     # API Worker (Cloudflare Worker)
      src/
        routes/              # Hono or itty-router route handlers
          v1/
            designs.ts       # /v1/designs CRUD
            generate.ts      # /v1/generate (queue submission)
            chat.ts          # /v1/chat (copilot)
            export.ts        # /v1/export (CAD pipeline trigger)
            artifacts.ts     # /v1/artifacts (R2 signed URLs)
        middleware/
          auth.ts            # Auth/session validation
          tenant.ts          # Tenant resolution
        db/
          schema.ts          # Drizzle schema (D1)
          migrations/        # SQL migrations
          repository.ts      # Data access layer
        queue/
          handlers.ts        # Queue consumer handlers
        workflows/
          design-pipeline.ts # Cloudflare Workflow: spec->tech->svg->cad
  packages/
    shared/                  # Shared types, constants, domain logic
      types/
        design.ts            # DesignMetadata, DesignFeatures, etc.
        api.ts               # API request/response types
        queue.ts             # Queue payload types
      constants/
        jewelry.ts           # Type lists, metals, gemstones, styles
      domain/
        prompt-generator.ts  # Extracted from current utils/
        variation-engine.ts  # Extracted from current services/
    ui/                      # shadcn/ui component library
      components/            # All 48 shadcn components + ImageWithFallback
      styles/                # theme.css, tokens
  wrangler.toml              # Cloudflare bindings config
  turbo.json / pnpm-workspace.yaml  # Monorepo config
```

### Why this shape

1. **`apps/web`** — Next.js via OpenNext on Cloudflare Workers. Handles all UI rendering. Server Components can fetch from API Worker directly via service bindings (no public network hop).

2. **`apps/api`** — Separate Cloudflare Worker for `/v1/*` API. Clean separation of concerns. Binds to D1, R2, Queues, AI Gateway. This is the enforcement layer for auth, tenancy, and idempotency.

3. **`packages/shared`** — Extracted domain logic (prompt generator, variation engine, type definitions). Used by both web and api. This is where current `storageService` types and `variationEngine`/`promptGenerator` logic moves.

4. **`packages/ui`** — shadcn/ui components + design tokens. Shared across web app. Could be used by future admin tools.

### Early restructuring needed: YES

The current flat Vite SPA structure does not support the target architecture. The restructuring should happen in Phase 1 as the first task:

1. Initialize monorepo (pnpm workspaces + Turborepo)
2. Create `packages/shared` with extracted types and domain logic
3. Create `packages/ui` with extracted shadcn components and tokens
4. Create `apps/web` as Next.js app importing from shared/ui
5. Create `apps/api` as Cloudflare Worker with Hono
6. Add `wrangler.toml` with D1, R2, Queue, AI Gateway bindings

---

## 5. Proposed Core D1 Entities and Relationships

### Entity-Relationship Model

```
tenants
  id              TEXT PRIMARY KEY  -- ULID
  name            TEXT NOT NULL
  slug            TEXT NOT NULL UNIQUE
  plan            TEXT NOT NULL DEFAULT 'free'  -- free|pro|enterprise
  created_at      TEXT NOT NULL  -- ISO 8601
  updated_at      TEXT NOT NULL

users
  id              TEXT PRIMARY KEY  -- ULID
  tenant_id       TEXT NOT NULL REFERENCES tenants(id)
  email           TEXT NOT NULL
  name            TEXT
  role            TEXT NOT NULL DEFAULT 'member'  -- owner|admin|member
  created_at      TEXT NOT NULL
  updated_at      TEXT NOT NULL
  UNIQUE(tenant_id, email)

projects
  id              TEXT PRIMARY KEY  -- ULID
  tenant_id       TEXT NOT NULL REFERENCES tenants(id)
  name            TEXT NOT NULL
  description     TEXT
  created_by      TEXT NOT NULL REFERENCES users(id)
  created_at      TEXT NOT NULL
  updated_at      TEXT NOT NULL

designs
  id              TEXT PRIMARY KEY  -- ULID
  tenant_id       TEXT NOT NULL REFERENCES tenants(id)
  project_id      TEXT REFERENCES projects(id)
  created_by      TEXT NOT NULL REFERENCES users(id)
  prompt          TEXT NOT NULL
  status          TEXT NOT NULL DEFAULT 'pending'  -- pending|generating|completed|failed
  jewelry_type    TEXT NOT NULL
  metal           TEXT NOT NULL
  style           TEXT NOT NULL
  complexity      INTEGER NOT NULL
  gemstones       TEXT NOT NULL  -- JSON array
  variation       TEXT NOT NULL  -- JSON object (bandStyle, settingType, etc.)
  liked           INTEGER NOT NULL DEFAULT 0
  tags            TEXT  -- JSON array
  notes           TEXT
  idempotency_key TEXT UNIQUE  -- For dedup
  created_at      TEXT NOT NULL
  updated_at      TEXT NOT NULL

design_artifacts
  id              TEXT PRIMARY KEY  -- ULID
  tenant_id       TEXT NOT NULL REFERENCES tenants(id)
  design_id       TEXT NOT NULL REFERENCES designs(id)
  artifact_type   TEXT NOT NULL  -- concept_image|technical_sheet|svg|stl|step|dxf|rhino|obj
  r2_key          TEXT NOT NULL  -- R2 object key
  file_name       TEXT NOT NULL
  content_type    TEXT NOT NULL
  size_bytes      INTEGER
  hash            TEXT  -- SHA-256 for dedup
  metadata        TEXT  -- JSON (dimensions, version, etc.)
  created_at      TEXT NOT NULL

design_versions
  id              TEXT PRIMARY KEY  -- ULID
  tenant_id       TEXT NOT NULL REFERENCES tenants(id)
  design_id       TEXT NOT NULL REFERENCES designs(id)
  version         INTEGER NOT NULL
  prompt          TEXT NOT NULL
  change_summary  TEXT  -- What changed from previous version
  created_by      TEXT NOT NULL REFERENCES users(id)
  created_at      TEXT NOT NULL
  UNIQUE(design_id, version)

chat_sessions
  id              TEXT PRIMARY KEY  -- ULID
  tenant_id       TEXT NOT NULL REFERENCES tenants(id)
  design_id       TEXT REFERENCES designs(id)
  created_by      TEXT NOT NULL REFERENCES users(id)
  created_at      TEXT NOT NULL
  updated_at      TEXT NOT NULL

chat_messages
  id              TEXT PRIMARY KEY  -- ULID
  tenant_id       TEXT NOT NULL REFERENCES tenants(id)
  session_id      TEXT NOT NULL REFERENCES chat_sessions(id)
  role            TEXT NOT NULL  -- user|assistant|system
  content         TEXT NOT NULL
  metadata        TEXT  -- JSON (model used, tokens, etc.)
  created_at      TEXT NOT NULL

jobs
  id              TEXT PRIMARY KEY  -- ULID
  tenant_id       TEXT NOT NULL REFERENCES tenants(id)
  design_id       TEXT REFERENCES designs(id)
  job_type        TEXT NOT NULL  -- generate|refine|export_cad|spec_to_svg
  status          TEXT NOT NULL DEFAULT 'queued'  -- queued|processing|completed|failed
  input_payload   TEXT NOT NULL  -- JSON
  output_payload  TEXT  -- JSON (result or error)
  idempotency_key TEXT UNIQUE
  attempts        INTEGER NOT NULL DEFAULT 0
  max_attempts    INTEGER NOT NULL DEFAULT 3
  started_at      TEXT
  completed_at    TEXT
  created_at      TEXT NOT NULL
```

### Key indexes

```sql
CREATE INDEX idx_designs_tenant ON designs(tenant_id);
CREATE INDEX idx_designs_tenant_project ON designs(tenant_id, project_id);
CREATE INDEX idx_designs_tenant_status ON designs(tenant_id, status);
CREATE INDEX idx_designs_idempotency ON designs(idempotency_key);
CREATE INDEX idx_artifacts_design ON design_artifacts(design_id);
CREATE INDEX idx_artifacts_tenant ON design_artifacts(tenant_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_jobs_tenant_status ON jobs(tenant_id, status);
CREATE INDEX idx_jobs_idempotency ON jobs(idempotency_key);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_projects_tenant ON projects(tenant_id);
```

### Relationships summary

```
tenant 1:N users
tenant 1:N projects
tenant 1:N designs
project 1:N designs
design 1:N design_artifacts
design 1:N design_versions
design 1:N chat_sessions (via copilot)
chat_session 1:N chat_messages
design 1:N jobs
```

### Design decisions

1. **`tenant_id` on every table** — Required by target architecture. Every query scopes by tenant. No cross-tenant access.
2. **ULIDs not UUIDs** — Lexicographically sortable, works as TEXT in D1/SQLite. Better than auto-increment for distributed ID generation.
3. **JSON columns for arrays** — D1/SQLite doesn't have array types. `gemstones`, `variation`, `tags`, `metadata` stored as JSON TEXT. Parse in application layer.
4. **`design_artifacts` separate from `designs`** — One design can have many artifacts (concept image, technical sheet, SVG, multiple CAD formats). R2 keys stored here, actual files in R2.
5. **`jobs` table** — Tracks all async work. Queue messages reference jobs by ID. Job status drives UI polling/websocket updates.
6. **`idempotency_key`** — On both `designs` and `jobs` for safe retries. Client generates key, server enforces uniqueness.

---

## 6. Proposed API Contracts, Queue Payloads, Workflow Boundaries, and Idempotency Model

### API Endpoints (`/v1/*`)

#### Designs

```
POST   /v1/designs                    # Create design + enqueue generation
GET    /v1/designs                    # List designs (paginated, filterable)
GET    /v1/designs/:id                # Get design by ID
PATCH  /v1/designs/:id                # Update design metadata (like, tags, notes)
DELETE /v1/designs/:id                # Soft-delete design
POST   /v1/designs/:id/refine         # Submit refinement via copilot (enqueues job)
POST   /v1/designs/:id/export         # Trigger CAD export pipeline (enqueues job)
GET    /v1/designs/:id/artifacts      # List artifacts for a design
GET    /v1/designs/:id/versions       # List version history
```

#### Artifacts

```
GET    /v1/artifacts/:id/url          # Get signed R2 download URL (time-limited)
DELETE /v1/artifacts/:id              # Delete artifact (also removes from R2)
```

#### Chat (Copilot)

```
POST   /v1/chat/sessions              # Create chat session (optionally linked to design)
GET    /v1/chat/sessions/:id          # Get session with messages
POST   /v1/chat/sessions/:id/messages # Send message (streams response via SSE)
```

#### Jobs

```
GET    /v1/jobs/:id                   # Get job status
GET    /v1/designs/:id/jobs           # List jobs for a design
```

#### Generation

```
POST   /v1/generate                   # Submit generation request
  Body: {
    jewelry_type: string,
    metal: string,
    gemstones: string[],
    style: string,
    complexity: number,
    variations: number,             // How many variants to generate
    custom_prompt?: string,         // User-edited prompt override
    idempotency_key: string         // Client-generated
  }
  Response: {
    design_id: string,
    job_id: string,
    status: "queued"
  }
```

#### Auth

```
POST   /v1/auth/login                 # Login (returns session token)
POST   /v1/auth/logout                # Invalidate session
GET    /v1/auth/me                    # Get current user + tenant
```

### Request/Response Conventions

```typescript
// All responses follow this envelope
interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
}

// Error responses
interface ApiError {
  error: {
    code: string;       // machine-readable: "DESIGN_NOT_FOUND"
    message: string;    // human-readable
    details?: unknown;
  };
}

// All list endpoints accept:
// ?page=1&per_page=20&sort=created_at&order=desc
// ?filter[jewelry_type]=ring&filter[status]=completed

// All mutation endpoints require:
// Header: Idempotency-Key: <client-generated-ulid>
```

### Queue Payloads

Three queues, all scoped by tenant:

#### `generate-queue`

```typescript
interface GeneratePayload {
  job_id: string;
  tenant_id: string;
  design_id: string;
  prompt: string;
  variations: number;
  provider: "xai" | "google" | "claude";  // AI Gateway routing
  idempotency_key: string;
}
```

Consumer: Calls AI Gateway -> stores images in R2 -> creates `design_artifacts` rows -> updates `designs.status` to `completed` -> updates `jobs.status`.

#### `refine-queue`

```typescript
interface RefinePayload {
  job_id: string;
  tenant_id: string;
  design_id: string;
  session_id: string;
  message: string;
  context: {
    current_prompt: string;
    current_features: DesignFeatures;
    history: { role: string; content: string }[];
  };
  idempotency_key: string;
}
```

Consumer: Calls AI Gateway (Claude for reasoning) -> generates refined prompt -> optionally triggers new image generation -> creates chat_message rows.

#### `export-queue`

```typescript
interface ExportPayload {
  job_id: string;
  tenant_id: string;
  design_id: string;
  formats: ("svg" | "stl" | "step" | "dxf" | "rhino" | "obj")[];
  source_artifact_id: string;  // The concept image to convert
  idempotency_key: string;
}
```

Consumer: Triggers Cloudflare Workflow `design-pipeline`.

### Workflow Boundaries

#### `design-pipeline` Workflow (Cloudflare Workflows)

```
Step 1: spec-generation
  Input:  design record + concept image URL from R2
  Action: Call AI Gateway (Claude) to generate technical specification JSON
  Output: Technical spec stored as artifact (JSON in R2)
  Idempotency: Keyed on (design_id, version, "spec")

Step 2: technical-sheet
  Input:  Technical spec from Step 1
  Action: Call AI Gateway to generate annotated technical drawing
  Output: Technical sheet image stored as artifact in R2
  Idempotency: Keyed on (design_id, version, "tech-sheet")

Step 3: svg-generation
  Input:  Technical spec + concept image
  Action: Call AI Gateway to generate vector SVG
  Output: SVG artifact in R2
  Idempotency: Keyed on (design_id, version, "svg")

Step 4: cad-conversion (Container)
  Input:  SVG + technical spec
  Action: Run CAD conversion in Cloudflare Container (headless Rhino/OpenSCAD/FreeCAD)
  Output: STL, STEP, DXF, 3DM, OBJ files -> R2
  Idempotency: Keyed on (design_id, version, format)
  Note:   Only this step requires a Container. All other steps run in Workers.
```

Each step updates the `jobs` table with progress. Steps are independently retryable.

### Idempotency Model

| Layer | Mechanism | Key Format |
|-------|-----------|-----------|
| API (client -> server) | `Idempotency-Key` header | Client-generated ULID per mutation request |
| Design creation | `designs.idempotency_key` UNIQUE constraint | Same as API key |
| Job creation | `jobs.idempotency_key` UNIQUE constraint | `{design_id}:{job_type}:{version}` |
| Queue processing | Check `jobs.status` before processing | If already `completed`, skip and ack |
| Workflow steps | Per-step artifact existence check | `{design_id}/{version}/{artifact_type}` in R2 |
| Artifact storage | `design_artifacts.hash` SHA-256 | Dedup identical files |

**Retry behavior:**
- API: Return cached response for duplicate idempotency key within 24h window
- Queue: Dead-letter after `max_attempts` (3). Exponential backoff.
- Workflow: Each step checks if output artifact already exists in R2. If yes, skip to next step.
- All mutations are idempotent at the database level via UNIQUE constraints.

### Artifact Naming Convention

```
R2 key format:
  {tenant_id}/{design_id}/{version}/{artifact_type}.{ext}

Examples:
  tenant_01J5/design_01K7/v1/concept.png
  tenant_01J5/design_01K7/v1/spec.json
  tenant_01J5/design_01K7/v1/technical-sheet.png
  tenant_01J5/design_01K7/v1/drawing.svg
  tenant_01J5/design_01K7/v1/model.stl
  tenant_01J5/design_01K7/v1/model.step
```

Tenant isolation is enforced at the R2 key prefix level. No cross-tenant key access.

### Tenant Isolation

1. **Database**: Every query includes `WHERE tenant_id = ?`. Enforced in repository layer, not optional.
2. **R2**: Keys prefixed with `tenant_id/`. Signed URLs scoped to tenant prefix.
3. **Queues**: Payload always includes `tenant_id`. Consumer validates tenant exists before processing.
4. **API**: Tenant resolved from auth session. Injected into every handler via middleware.
5. **AI Gateway**: Per-tenant rate limits. Tenant ID passed as metadata for billing/tracking.

---

## 7. Docs-vs-Code Contradictions

| # | Contradiction | Severity | Detail |
|---|--------------|----------|--------|
| 1 | README claims "React Router v7" routing but no API or backend docs exist | Medium | README is accurate for the frontend shell but gives no indication this is a frontend-only project requiring a full backend build. Misleading for anyone joining the project expecting a functional app. |
| 2 | README lists `/app/copilot` as "Chat-based design editor" | Low | The component exists but is entirely mocked — `setTimeout` echoes input. This is UI prototype, not functional. |
| 3 | README lists `/app/export` as "Multi-format CAD export" | Low | Same — pure UI mockup. Export button triggers a fake 2-second timer. |
| 4 | `DesignPreview` shows hardcoded specs (Platinum 950, 4.2g, VS1 clarity, $3,600) | Low | These are not real computed values. If anyone treats them as representative, they'll get wrong expectations about the data model. |
| 5 | `.env.example` references `VITE_XAI_API_KEY` | Low | Nothing in the code uses this key. Unclear if xAI is the intended provider or leftover from prior work. |
| 6 | `storageService.ts` comments say "could be backend later" | Info | Accurate — this confirms the frontend was designed with backend migration in mind. The interfaces are clean enough to reuse as D1 entity types. |
| 7 | Landing page claims "10K+ Designs Generated", "500+ CAD Exports", "98% Accuracy Rate" | Info | Marketing placeholder text. Not connected to any real data. |

---

## 8. Risks, Blockers, Stale Areas, and Cleanup Opportunities

### Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **No backend exists at all** — the entire backend is greenfield | High | The good news: no legacy code to fight. The bad news: every API endpoint, database table, queue handler, and workflow step must be built from scratch. Sequence carefully. |
| **localStorage persistence has no migration path** | Medium | When the backend launches, existing localStorage data is orphaned. Build an import/migration UI or accept that prototype data is disposable. |
| **AI provider choice is ambiguous** | Medium | `.env.example` suggests xAI. Target architecture says "AI Gateway for Claude + Google + xAI routing." Decide primary provider early — prompt format may need tuning per provider. |
| **CAD pipeline is the highest-risk workflow** | High | Container-based CAD conversion (Step 4 of the pipeline) is the most complex and least standard part. Needs prototype validation before committing to the full workflow. |
| **Multi-tenancy is Day 1 but no auth exists** | High | Tenant isolation must be designed into every layer from the start. Retrofitting tenant_id onto an existing schema is painful. Start with tenancy in the schema even if single-tenant initially. |
| **D1 limitations** | Medium | D1 is SQLite — no stored procedures, limited concurrent writes, 10GB per database. JSON column queries are slower than normalized data. Design schema with these constraints in mind. |

### Blockers

| Blocker | Resolution needed before |
|---------|------------------------|
| No Cloudflare account/project setup | Phase 1 task 1 |
| No auth provider selected (Clerk? Auth.js? Custom?) | Phase 1 schema work |
| No AI Gateway configuration | Phase 1 generation pipeline |
| No OpenNext configuration for Cloudflare | Phase 1 web app migration |

### Stale Areas

| Item | Status | Action |
|------|--------|--------|
| MUI dependencies in `package.json` (`@mui/material`, `@mui/icons-material`, `@emotion/*`) | Unused — no MUI imports found in any source file | Remove in Phase 1 cleanup |
| `@popperjs/core` + `react-popper` | Unused — Radix/shadcn handle positioning | Remove in Phase 1 cleanup |
| `next-themes` | Unused — single dark theme, no theme switching | Remove in Phase 1 cleanup |
| `react-day-picker`, `input-otp`, `embla-carousel-react` | shadcn dependencies, may not be actively used | Audit during UI migration |
| `recharts` | Unused in current screens | Keep if dashboard analytics are planned |

### Cleanup Opportunities

1. **Remove unused MUI dependencies** — ~4 packages contributing to bundle size with zero usage.
2. **Extract domain types** — `DesignMetadata`, `DesignFeatures`, `DesignVariation` from `storageService.ts` into shared types before building the backend.
3. **Extract domain constants** — Jewelry types, metals, gemstones, styles are duplicated between `Dashboard.tsx`, `DesignGenerator.tsx`, and the prompt generator. Centralize.
4. **Normalize variation engine config** — Type-specific configs in `variationEngine.ts` duplicate some default values. Could be tighter.

---

## 9. Recommended Backend/Platform Task Breakdown for Phase 1 and Phase 2

### Phase 1: Foundation (Backend Core + Monorepo)

Phase 1 establishes the monorepo structure, D1 schema, API skeleton, and first working pipeline (image generation).

| # | Task | Depends On | Deliverable |
|---|------|-----------|-------------|
| 1.1 | **Monorepo initialization** | None | pnpm workspaces + Turborepo. Create `apps/web`, `apps/api`, `packages/shared`, `packages/ui`. |
| 1.2 | **Extract shared types and domain logic** | 1.1 | Move `DesignMetadata` types, `variationEngine`, `promptGenerator`, jewelry constants to `packages/shared`. |
| 1.3 | **Extract UI library** | 1.1 | Move shadcn/ui components and design tokens to `packages/ui`. |
| 1.4 | **D1 schema and migrations** | 1.1 | Drizzle ORM schema for all entities (Section 5). Initial migration. `wrangler.toml` D1 binding. |
| 1.5 | **API Worker skeleton** | 1.1, 1.4 | Hono-based Worker with health check, CORS, error handling, tenant middleware stub. Route structure for `/v1/*`. |
| 1.6 | **Design CRUD endpoints** | 1.4, 1.5 | `POST/GET/PATCH/DELETE /v1/designs`. Repository layer with tenant scoping. |
| 1.7 | **Auth foundation** | 1.5 | Auth middleware (decide provider: Clerk/Auth.js/custom). Session token validation. User + tenant resolution. |
| 1.8 | **R2 artifact storage** | 1.5 | R2 binding. Upload/download with signed URLs. Tenant-prefixed key structure. |
| 1.9 | **Generation queue** | 1.5, 1.6 | Queue binding. `POST /v1/generate` -> enqueue. Consumer: call AI Gateway -> store in R2 -> update D1. |
| 1.10 | **AI Gateway configuration** | 1.9 | Gateway setup for primary provider (xAI or Google). Provider adapter pattern for future multi-provider routing. |
| 1.11 | **Next.js migration** | 1.1, 1.3 | Migrate Vite SPA to Next.js App Router. OpenNext config for Cloudflare. Wire Dashboard and Gallery to API. |
| 1.12 | **Remove stale dependencies** | 1.11 | Drop MUI, popper, next-themes, and other unused packages. |

**Phase 1 exit criteria:**
- Monorepo builds and deploys to Cloudflare
- Design CRUD works end-to-end (create -> list -> view -> update -> delete)
- Image generation pipeline works (create design -> queue -> AI Gateway -> R2 -> viewable in gallery)
- Auth flow works (login -> session -> tenant-scoped API access)
- D1, R2, and Queue bindings are live

### Phase 2: Workflows + Copilot + CAD

Phase 2 builds the advanced features: chat-based refinement, the CAD pipeline, and export functionality.

| # | Task | Depends On | Deliverable |
|---|------|-----------|-------------|
| 2.1 | **Chat/Copilot API** | 1.6, 1.7, 1.10 | Chat sessions + messages in D1. SSE streaming from AI Gateway (Claude). `POST /v1/chat/sessions/:id/messages`. |
| 2.2 | **Refine queue** | 2.1, 1.9 | Queue for design refinement. Consumer: Claude analyzes chat -> generates refined prompt -> optionally triggers re-generation. |
| 2.3 | **Design versioning** | 1.6 | `design_versions` table. Track prompt changes. Copilot creates new versions on refinement. |
| 2.4 | **Design pipeline Workflow** | 1.8, 1.10 | Cloudflare Workflow: Step 1 (spec) + Step 2 (tech sheet) + Step 3 (SVG). Each step stores artifact in R2. |
| 2.5 | **CAD Container** | 2.4 | Cloudflare Container with headless CAD engine. SVG + spec -> STL/STEP/DXF/3DM/OBJ. |
| 2.6 | **Export queue + endpoint** | 2.4, 2.5 | `POST /v1/designs/:id/export`. Triggers pipeline. Tracks progress in jobs table. |
| 2.7 | **Artifact management UI** | 1.8, 2.6 | Wire CADExport screen to real API. Download signed URLs. Progress indicators for pipeline steps. |
| 2.8 | **Job status polling/SSE** | 1.9 | `GET /v1/jobs/:id` with SSE option for real-time status. Wire to DesignGenerator and CADExport screens. |
| 2.9 | **Multi-provider AI routing** | 1.10 | AI Gateway routes to Claude (reasoning), xAI/Google (image gen) based on task type. Fallback logic. |
| 2.10 | **Copilot UI integration** | 2.1, 2.2 | Wire AICoPilot screen to real chat API. SSE streaming. Design preview updates on refinement. |

**Phase 2 exit criteria:**
- Copilot chat works end-to-end with real AI responses
- Design pipeline produces at least SVG from concept image
- CAD export produces at least one format (STL) from SVG
- Job tracking works with real-time status updates
- All queue/workflow steps are idempotent and retryable

---

## Summary

**Current state:** Pure frontend UI shell with no backend. 7 screens, localStorage persistence, prompt generator, variation engine. Zero API calls, zero auth, zero deployment config.

**Reuse assessment:**
- **High reuse value:** Design token system, shadcn/ui library, `variationEngine.ts`, `promptGenerator.ts`, `DesignMetadata`/`DesignFeatures` type definitions
- **Refactor and migrate:** All 7 screen components (wire to real API), route structure (React Router -> Next.js App Router), `storageService` types (localStorage -> D1)
- **Build from scratch:** Everything else — API Worker, D1 schema, R2 storage, Queues, Workflows, auth, multi-tenancy, AI Gateway, CAD pipeline, deployment

**Key recommendation:** The frontend shell is well-built and the domain types are clean. The prompt engineering work in `promptGenerator.ts` is particularly good and should be preserved. But the backend is 100% greenfield — there is nothing to migrate, only domain logic to extract and a UI to rewire. Phase 1 should prioritize the monorepo restructure and the core generation pipeline (D1 + API + Queue + AI Gateway + R2) since that unblocks all other work.
