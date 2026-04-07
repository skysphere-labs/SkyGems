# Phase 4A: Figma-First UX Overhaul — Architecture & Design System Brief

**Date:** 2026-04-06
**Branch:** `emdash/phase-4a-skygems-figma-first-ux-overhaul-architecture-and-design-system-brief-y0b`
**Status:** Design artifact. Not code. Not merged.
**Purpose:** Complete UX rethink for SkyGems — information architecture, user flows, screen map, backend truth mapping, and salvage/delete inventory.

---

## 1. Why a Full Rethink

### What's wrong today

The current SkyGems UI suffers from three compounding problems:

1. **Enterprise dashboard energy.** The app feels like a CRUD admin panel, not a premium creative tool. Sidebar navigation with 5+ items, text-heavy screens, flat cards, developer copy everywhere. A jewelry designer opening this sees "software," not "studio."

2. **Confused information architecture.** The original app had 6 flat routes (`/app/create`, `/app/gallery`, `/app/preview/:id`, `/app/copilot`, `/app/export`, `/app`). Phase 2A restructured to project-scoped routes with tabs (Create, Gallery, Projects, Pipeline, Export). Both models expose too much surface area simultaneously. The user's actual journey — *make something, see it, pick it, produce it* — is buried under navigation.

3. **Visual identity drift.** Phase 2A accidentally shifted from dark-luxury-gold to light-purple. The token names survived but the values changed. The result looks like a generic SaaS tool, not a premium jewelry studio.

### What we want instead

**OpenArt-like simplicity:** The user should feel creative momentum from the moment they open the app. The primary flow — create → see results → select → (optionally refine/produce) — should be obvious, fast, and visually stunning. Everything else should be discoverable but not in the way.

**Premium jewelry studio feel:** Dark surfaces, gold accents, large dramatic imagery, typographic luxury, restrained motion. The app should feel like stepping into a high-end atelier, not logging into a dashboard.

---

## 2. Backend Truth — What the Product Actually Does

Before redesigning, here is the exact capability set that the UI must serve. No fantasy features. No aspirational screens.

### Real backend endpoints (Phase 2A API Worker)

| Endpoint | Method | What it does | UI surface needed |
|---|---|---|---|
| `/v1/projects` | GET | List user's projects | Home / Projects view |
| `/v1/projects` | POST | Create new project | Create flow entry |
| `/v1/prompt-preview` | POST | Normalize input → design DNA → prompt text | Create flow (live preview) |
| `/v1/generate-design` | POST | Enqueue generation job (idempotent) | Create flow → Generate CTA |
| `/v1/generations/:id` | GET | Poll generation status + pair result | Results view (polling) |
| `/v1/designs/:id` | GET | Get selected design details | Design workspace |
| `/v1/designs/:id/spec` | POST/GET | Trigger/get structured specification | Pipeline: Spec stage |
| `/v1/designs/:id/technical-sheet` | POST/GET | Trigger/get technical sheet | Pipeline: Tech Sheet stage |
| `/v1/designs/:id/svg` | POST/GET | Trigger/get SVG output | Pipeline: SVG stage |
| `/v1/designs/:id/cad` | POST/GET | Trigger/get CAD files (STEP/STL/DXF) | Pipeline: CAD stage |
| `/v1/gallery` | GET | Cross-project design search/browse | Gallery view |

### Real data model

| Concept | Shape | What the user sees |
|---|---|---|
| **Project** | Container with name, description, created/updated dates | A folder for a collection of designs |
| **Generation** | Job with status (`running`/`succeeded`/`canceled`), produces one `pair` | A "batch" of AI-generated designs |
| **Pair** | Sketch image + render image (the atomic result unit) | Two images side-by-side: concept sketch and photorealistic render |
| **Design** | A selected pair promoted to its own entity | "My chosen design" — the thing you refine and produce |
| **Spec** | Structured specification with risk flags, missing-info markers | Design blueprint with manufacturing parameters |
| **Technical Sheet** | Detailed manufacturing document | Production-ready specifications |
| **SVG** | Vector output of the design | Scalable design file |
| **CAD** | STEP/STL/DXF files | Manufacturing-ready 3D/2D files |

### Real async infrastructure

| Resource | Purpose |
|---|---|
| D1 database (`skygems`) | All persistent state |
| R2 bucket (`skygems-artifacts`) | Pair images, tech sheets, SVGs, CAD files |
| Queue: `skygems-generate` | Async generation jobs |
| Queue: `skygems-refine` | Async refinement jobs |
| Queue: `skygems-spec` | Async spec/pipeline jobs |
| Workflow: `skygems-design-pipeline` | Orchestrates spec → tech sheet → SVG → CAD |
| AI Gateway | Routes to xAI (primary) or Google (fallback) for image generation |

### Real provider routing

| Priority | Provider | Use |
|---|---|---|
| Primary | xAI | Sketch + render pair generation |
| Secondary | Google (Nano Banana Pro 2) | High-quality fallback |
| Future | Stitch API | Design assistance tooling |

---

## 3. Redesigned Information Architecture

### Design principle: Four rooms, one hallway

The app has exactly **four primary surfaces** ("rooms") connected by a clear linear flow ("hallway"). Everything else is either a sub-surface within a room or an overlay.

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│          │     │          │     │          │     │          │
│   HOME   │────▶│  CREATE  │────▶│ RESULTS  │────▶│WORKSPACE │
│          │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
      │                                                   │
      │           ┌──────────┐                            │
      └──────────▶│ GALLERY  │◀───────────────────────────┘
                  └──────────┘
```

| Room | Purpose | Entry point |
|---|---|---|
| **Home** | Your projects and recent designs. The launchpad. | App open, logo click |
| **Create** | Configure and generate a design. The creative act. | "New Design" from Home, or from within a project |
| **Results** | See your generation pairs. Pick your favorite. | Automatic after generation submits |
| **Workspace** | Your selected design's home. Refine + produce. | Clicking a selected design |
| **Gallery** | Browse all designs across projects. | Nav link, always accessible |

### Why four rooms, not seven tabs or six flat routes

- **The user's mental model is linear:** "I want to make a ring → I see options → I pick one → I get it made."
- **Tabs/sidebar items create choice paralysis.** The current 5-tab WorkspaceScreen forces the user to understand the entire product surface before doing anything.
- **Gallery is the only non-linear surface.** It's a cross-cutting "library" view, not part of the linear flow.
- **The production pipeline (spec → tech sheet → SVG → CAD) lives INSIDE the Workspace**, not as separate top-level destinations. This is progressive disclosure: you only see pipeline stages after you've selected a design and want to produce it.

### Navigation model

```
┌─────────────────────────────────────────────────────┐
│  [Logo]           Home    Gallery         [Avatar]  │
└─────────────────────────────────────────────────────┘
```

**Top bar only. No sidebar.** Two navigation items plus logo and user menu. That's it.

- **Logo** → Home
- **Home** → Projects and recent designs
- **Gallery** → Cross-project browse
- **Avatar** → Settings, account, sign out

Within a project, breadcrumbs provide context:
```
Home > Engagement Ring Collection > Create
Home > Engagement Ring Collection > Generation #3 > Results
Home > Engagement Ring Collection > "Art Deco Solitaire" > Workspace
```

### Route map (maps to real backend)

| Route | Room | Backend endpoint(s) |
|---|---|---|
| `/` | Landing (public) | None |
| `/app` | Home | `GET /v1/projects` |
| `/app/projects/:projectId` | Project detail (sub-view of Home) | `GET /v1/projects`, `GET /v1/gallery?project=:id` |
| `/app/projects/:projectId/create` | Create | `POST /v1/prompt-preview`, `POST /v1/generate-design` |
| `/app/projects/:projectId/generations/:generationId` | Results | `GET /v1/generations/:id` |
| `/app/projects/:projectId/designs/:designId` | Workspace | `GET /v1/designs/:id`, `POST /v1/designs/:id/spec`, `POST /v1/designs/:id/technical-sheet`, `POST /v1/designs/:id/svg`, `POST /v1/designs/:id/cad` |
| `/app/gallery` | Gallery | `GET /v1/gallery` |

**7 routes total.** Down from 12+ in Phase 2A. Every route maps to real backend endpoints.

---

## 4. User Flows

### Flow 1: First-time user (Landing → First generation)

```
1. User lands on / (Landing Page)
2. Clicks "Start Designing" → signs in (Auth0)
3. Arrives at /app (Home) — empty state with prominent "Create Your First Project" CTA
4. Creates project → arrives at /app/projects/:id/create (Create)
5. Selects: Ring → Gold → Diamond → Art Deco → 60% complexity
6. Sees live prompt preview updating on the right
7. Clicks "Generate Designs"
8. Automatically navigates to /app/projects/:id/generations/:genId (Results)
9. Sees skeleton pair cards → pairs arrive (sketch + render)
10. Clicks favorite pair → pair is promoted to a Design
11. Navigates to /app/projects/:id/designs/:designId (Workspace)
12. Sees hero pair viewer with the sketch and render at full size
```

### Flow 2: Returning user (Home → Quick create)

```
1. Opens /app (Home)
2. Sees project cards with recent designs as thumbnails
3. Clicks project → sees project's designs and generations
4. Clicks "New Design" within project → Create flow
5. OR clicks an existing design → Workspace
```

### Flow 3: Design refinement

```
1. In Workspace for a selected design
2. Clicks "Refine" → RefineDrawer slides in from right
3. Describes changes: "Make the band thinner, add pavé setting"
4. Submits → new generation queued
5. New pair appears → compare with original
6. Accept refinement or discard
```

### Flow 4: Production pipeline

```
1. In Workspace for a selected design
2. Below the hero viewer, sees Pipeline section with 4 stages:
   [Spec] → [Tech Sheet] → [SVG] → [CAD]
3. Each stage shows: not started / processing / ready / stale
4. Clicks "Generate Spec" → spec processes → arrives with risk flags
5. Reviews spec → clicks "Generate Tech Sheet" → processes
6. Reviews tech sheet → clicks "Generate SVG"
7. Reviews SVG → clicks "Generate CAD" → selects format (STEP/STL/DXF)
8. Downloads CAD files
```

### Flow 5: Gallery browse and re-entry

```
1. Clicks Gallery in nav
2. Sees masonry grid of all designs across projects
3. Searches "emerald ring" → filtered results
4. Clicks a design → opens in its project's Workspace
5. OR likes/bookmarks from the gallery card hover
```

---

## 5. Screen Map — Detailed Specifications

### Screen 1: Landing Page

**Purpose:** Marketing homepage. Convert visitors to users.
**Route:** `/`
**Layout:** Full-width, scroll-based sections

**Sections:**
1. **Nav bar** — Logo, product links, "Sign In" / "Start Designing" CTA
2. **Hero** — Large headline ("Design Jewelry with AI"), subhead, hero CTA, decorative gold glow
3. **Social proof** — Stats bar (designs created, exports, accuracy)
4. **Product preview** — Large screenshot/mockup of the Create and Results screens
5. **Features** — 3-4 key capabilities (not 6), each with icon and one-liner
6. **CTA** — Final conversion section
7. **Footer** — Minimal

**What changes from current:** Simplify features section from 6 to 3-4 (remove AI Co-Pilot as standalone, remove Design Library as separate feature). Add real product screenshots when available. Tighten copy.

**Salvage:** Current LandingPage.tsx is ~80% there. Gold-glow effects, glassmorphism nav, stats section are all good. Needs copy tightening and feature consolidation.

---

### Screen 2: Home

**Purpose:** Projects hub. The user's launchpad.
**Route:** `/app`
**Layout:** Top nav + centered content

**Sections:**
1. **Header** — "Your Studio" or "Projects" heading (Playfair Display)
2. **Quick create CTA** — Prominent "New Project" button (gold, top-right or centered in empty state)
3. **Projects grid** — Cards showing: project name, thumbnail (most recent pair render), design count, last updated
4. **Recent activity** — Optional: last 3-4 designs across all projects as a "Recent" row

**Empty state:** Centered icon (gem/ring), "Start your first collection", "Create Project" gold CTA.

**Project card interaction:**
- Click → expand project detail (or navigate to project sub-view)
- Project sub-view shows: project's designs grid, "New Design" CTA, generation history

**What changes from current:**
- Replaces Dashboard.tsx entirely (was a flat design list with search/filter)
- Replaces Phase 2A's WorkspaceScreen+ProjectsTab (was tab-based)
- Project-scoped, not flat

**Salvage:** Dashboard.tsx's search bar pattern is useful for the Gallery, not here. The quick-action category buttons from Dashboard become the type picker in Create.

---

### Screen 3: Create

**Purpose:** Configure and generate a jewelry design.
**Route:** `/app/projects/:projectId/create`
**Layout:** Two-column, left config / right preview

**Left column (configuration, ~400px):**
1. **Jewelry Type** — Icon picker grid (ring, necklace, earrings, bracelet, pendant)
2. **Metal** — Button group with color swatches (Gold, Silver, Platinum, Rose Gold)
3. **Gemstone** — Toggle chips (Diamond, Ruby, Emerald, Sapphire, Pearl)
4. **Style** — Button group (Temple, Vintage, Floral, Geometric, Contemporary, Minimalist)
5. **Complexity** — Slider with gold fill track (0-100%)
6. **Prompt** — Textarea showing auto-generated prompt. Editable (switches to "override" mode). Reset button to revert to auto.
7. **Generate** — Hero CTA button, gold, full-width at bottom of left column

**Right column (preview, flex-1):**
1. **Live prompt preview card** — Shows normalized input + design DNA summary
2. **Design preview placeholder** — Subtle illustration or last generation's pair as context
3. **Status indicator** — Shows when prompt preview is loading/syncing

**Interaction model:**
- Each picker change triggers debounced `POST /v1/prompt-preview`
- Prompt textarea shows result of preview; user can override
- "Generate" triggers `POST /v1/generate-design` with idempotency key
- On success, auto-navigate to Results

**What changes from current:**
- Replaces DesignGenerator.tsx (similar structure but was flat-routed, had developer copy, purple CTAs)
- Replaces Phase 2A CreateTab (was inside a tab panel)
- Removes "variations count" slider (backend generates one pair per generation; user can generate multiple times)
- Removes the right-panel text wall from Phase 2A

**Salvage:** Phase 2A create-flow components (JewelryTypePicker, MetalPicker, GemstonePicker, StylePicker, ComplexityControl) are structurally correct. Need visual upgrade + gold theming. `useCreateDraftState` hook is correct, keep it.

---

### Screen 4: Results

**Purpose:** Show generation pairs. Let user select a favorite.
**Route:** `/app/projects/:projectId/generations/:generationId`
**Layout:** Centered content, full-width pair display

**Sections:**
1. **Header** — Breadcrumb + "Your Designs" heading
2. **Generation status banner** — Shows polling state (generating → ready)
3. **Pair display** — Large, dramatic sketch (left) + render (right) side by side
   - Skeleton loading with pulse animation until images arrive
   - Gold selection ring on hover
   - Click to select → promotes to Design
4. **Actions** — "Select This Design" primary CTA, "Generate Again" secondary, "Back to Create" tertiary
5. **Previous generations** — If user has generated multiple times, show a row of previous pair thumbnails below

**Interaction model:**
- Page polls `GET /v1/generations/:id` until status = `succeeded`
- Skeleton pair cards shown during polling
- When pair arrives, fade-in with slight upward translate (unveiling effect)
- "Select" promotes pair to a Design → navigates to Workspace

**What changes from current:**
- Replaces Phase 2A GenerationScreen (had raw generation IDs, text cards, developer copy)
- Pair display is MUCH larger — the sketch/render pair is the visual centerpiece, not a small card in a grid
- No multi-pair grid (backend produces one pair per generation; if we want more results, user generates again)

**Salvage:** Phase 2A PairCardV1 structure is correct (sketch/render, states, skeleton). Needs dramatic visual upgrade and size increase.

---

### Screen 5: Workspace

**Purpose:** The selected design's home. View, refine, produce.
**Route:** `/app/projects/:projectId/designs/:designId`
**Layout:** Full-width hero + sections below

**Sections:**
1. **Hero pair viewer** — Full-width, generous height. Sketch (left) + render (right) at dramatic scale. Subtle gold border. This is the emotional center of the product.
2. **Design info bar** — Name/label, project context, creation date, generation lineage
3. **Action bar** — "Refine" (opens drawer), "Share" (future), design metadata
4. **Pipeline section** — Horizontal step indicator showing the four production stages:

```
   [ Spec ]  →  [ Tech Sheet ]  →  [ SVG ]  →  [ CAD ]
    ready          processing       pending      pending
```

   Each stage card shows:
   - Stage name and icon
   - Status (not started / processing / ready / stale)
   - "Start" or "View" CTA depending on state
   - When expanded: stage content (spec details, tech sheet preview, SVG viewer, CAD download)

5. **Refine drawer** — Slides from right. Text input for refinement instructions. Contextual to this design.

**Pipeline stage detail views (within Workspace, not separate routes):**

| Stage | Content when ready |
|---|---|
| **Spec** | Structured sections: dimensions, materials, gemstone settings, manufacturing notes. Risk flags with severity colors (red/amber/blue). Missing-info markers. |
| **Tech Sheet** | Multi-section manufacturing document. Collapsible sections. Print-ready layout. |
| **SVG** | Vector preview with zoom/pan. Download button. Light/dark background toggle. |
| **CAD** | Format selector (STEP/STL/DXF). Per-format download buttons with file size. Progress indicators during generation. |

**What changes from current:**
- Replaces DesignPreview.tsx entirely (had fake 3D viewer, rotation controls, irrelevant metrics)
- Replaces Phase 2A SelectedDesignScreen (was text-heavy, no hero viewer)
- Absorbs Phase 2A SpecScreen, TechnicalSheetScreen, SvgScreen, CadScreen into a single Workspace with expandable pipeline sections (not 4 separate routes)
- Replaces CADExport.tsx (was a standalone route with 6 formats; now 3 real formats within Workspace)

**Salvage:**
- Phase 2A RefineDrawer placement (contextual, not standalone) — correct
- Phase 2A StageStatusPill — correct logic, needs visual upgrade
- Phase 2A downstream stage data models — correct shapes
- CADExport.tsx format selection pattern — useful, but only 3 formats (STEP/STL/DXF)

---

### Screen 6: Gallery

**Purpose:** Browse all designs across projects.
**Route:** `/app/gallery`
**Layout:** Masonry grid with search/filter bar

**Sections:**
1. **Header** — "Gallery" heading + search bar
2. **Filter bar** — Chips for jewelry type, metal, style. Sort by date/name
3. **Design grid** — Masonry or uniform grid of design cards
   - Card shows: render image (primary), design name, project name, jewelry type badge
   - Hover: gradient overlay from bottom, "Open" and "Like" quick actions
   - Click: navigate to design's Workspace in its project context
4. **Empty state** — "No designs yet. Start creating." with CTA to Home

**What changes from current:**
- Replaces DesignGallery.tsx (had like/tag/delete inline, detail sidebar — too busy)
- Replaces Phase 2A GalleryTab/GalleryScreen
- Simpler: image-first cards, fewer inline actions, click-through to Workspace for full interaction

**Salvage:** DesignGallery.tsx search and filter pattern. Phase 2A gallery search with project-context reopen.

---

## 6. What to Delete, Keep, or Rebuild

### DELETE — Remove entirely

| Asset | Reason |
|---|---|
| `DesignPreview.tsx` | Replaced by Workspace hero viewer. Fake 3D viewer is misleading. |
| `AICoPilot.tsx` | Standalone chat route is wrong model. Refine is contextual in Workspace. |
| `CADExport.tsx` (as standalone route) | CAD export lives inside Workspace pipeline. Standalone route is unnecessary. |
| `Dashboard.tsx` | Replaced by Home (project-centric, not flat design list). |
| `storageService.ts` | localStorage persistence replaced by real API. |
| `RootLayout.tsx` sidebar model | Replaced by top-bar navigation. Sidebar is enterprise energy. |
| Phase 2A WorkspaceScreen + IconNav tabs | Tab-based workspace is the wrong model. Replaced by four distinct rooms. |
| Phase 2A ProjectsTab, PipelineTab, ExportTab | Absorbed into Home (projects) and Workspace (pipeline). Not separate tabs. |
| Purple theme values | Accidental drift. Restore gold. |
| ~35 unused shadcn components | Dead weight. Keep only the ~15 that are actually used. |
| Developer copy in all screens | Replace with product copy. |

### KEEP — Carry forward as-is

| Asset | Why |
|---|---|
| `theme.css` token structure (original gold values) | Production-quality dark luxury palette |
| `fonts.css` (Playfair Display + Inter) | Correct premium font pairing |
| `ImageWithFallback` | Small, correct, reusable media component |
| `variationEngine.ts` domain axes | Structured randomness vocabulary — domain logic, not UI |
| `promptGenerator.ts` composition-first structure | Reference logic and local fallback |
| `LandingPage.tsx` (~80%) | Good premium marketing page, needs minor refinement |
| `useCreateDraftState` hook | Correct state machine for create flow |
| Shared contracts (`@skygems/shared`) | Zod-validated contract types |
| API stubs / typed adapter functions | Ready for real endpoint wiring |
| Route helpers in `lib/routes.ts` | Forward-compatible URL construction |

### REBUILD — Keep structure, redesign visuals and interaction

| Asset | What to keep | What to rebuild |
|---|---|---|
| Phase 2A create-flow components (JewelryTypePicker, MetalPicker, etc.) | Picker logic, options, structure | Visual: gold theming, selection effects, spacing |
| Phase 2A PairCardV1 | Pair model, state handling, sketch/render layout | Visual: dramatic size, gold selection ring, hover elevation, entrance animation |
| Phase 2A FlowStepRail | Step model, status tracking | Visual: vertical connected line, gold indicators, pulse animation. Repurpose as Pipeline indicator in Workspace |
| Phase 2A GenerationStatusBanner | Status mapping logic | Visual: premium treatment, animation |
| Phase 2A StageStatusPill | Status-to-color mapping | Visual: dot indicator, contextual animation |
| Phase 2A PromptPreviewStatusCard | Synced/override model | Visual: gold accent, better layout |
| Phase 2A RefineDrawer | Contextual placement, input model | Visual: premium drawer treatment |
| Phase 2A AppShell | Layout shell concept | Complete redesign: sidebar → top bar |
| `packages/ui` primitives (button, card, input, etc.) | Component API, accessibility | Theme: restore gold tokens, dark-first defaults |

---

## 7. Component Architecture (Redesigned)

### Layout components

| Component | Purpose |
|---|---|
| `AppShell` | Top nav bar + main content area. No sidebar. |
| `TopNav` | Logo, Home link, Gallery link, user avatar. Fixed top. |
| `Breadcrumb` | Context trail: Home > Project > Screen |

### Page components (one per room)

| Component | Route | Sections |
|---|---|---|
| `HomePage` | `/app` | ProjectGrid, RecentDesigns, EmptyState |
| `CreatePage` | `/app/projects/:id/create` | ConfigPanel, PromptPreview, GenerateCTA |
| `ResultsPage` | `/app/projects/:id/generations/:id` | StatusBanner, PairViewer, SelectCTA, PreviousGenerations |
| `WorkspacePage` | `/app/projects/:id/designs/:id` | HeroPairViewer, DesignInfo, ActionBar, PipelineRail, RefineDrawer |
| `GalleryPage` | `/app/gallery` | SearchBar, FilterChips, DesignGrid |

### Shared components

| Component | Used in | Purpose |
|---|---|---|
| `PairViewer` | ResultsPage, WorkspacePage, GalleryCard | Sketch + render display at various sizes |
| `PairCard` | ResultsPage, GalleryPage | Compact pair display with status states |
| `PipelineRail` | WorkspacePage | Horizontal 4-stage progression indicator |
| `StageCard` | WorkspacePage (within PipelineRail) | Individual stage: status, CTA, expandable content |
| `StageStatusPill` | StageCard, PipelineRail | Status badge with dot + color + animation |
| `ProjectCard` | HomePage | Project thumbnail, name, stats |
| `DesignCard` | GalleryPage, HomePage | Design thumbnail for grid display |
| `ConfigPanel` | CreatePage | Left-column picker stack |
| `PromptPreview` | CreatePage | Right-column live preview card |
| `GenerationStatusBanner` | ResultsPage | Polling status feedback |
| `RefineDrawer` | WorkspacePage | Slide-in refinement interface |
| `EmptyState` | All pages | Centered icon + headline + CTA pattern |
| `SkeletonSet` | All pages | Per-page skeleton loading layouts |

### Create-flow sub-components (within ConfigPanel)

| Component | Purpose |
|---|---|
| `JewelryTypePicker` | 5-icon grid selector |
| `MetalPicker` | 4-button color swatch selector |
| `GemstonePicker` | Toggle chip selector |
| `StylePicker` | 6-button selector |
| `ComplexitySlider` | Gold-fill slider 0-100% |

---

## 8. State Architecture

### Global state (minimal)

| State | Source | Scope |
|---|---|---|
| Auth context | Auth0 JWT | Entire app |
| Current project | URL param `:projectId` | Project-scoped pages |
| Projects list | `GET /v1/projects` (cached) | HomePage |

### Page-local state

| Page | Key state | Source |
|---|---|---|
| CreatePage | Draft config + prompt mode (synced/override) | `useCreateDraftState` hook |
| CreatePage | Prompt preview result | `POST /v1/prompt-preview` (debounced) |
| ResultsPage | Generation status + pair | `GET /v1/generations/:id` (polled) |
| WorkspacePage | Design + stage statuses | `GET /v1/designs/:id` + stage endpoints |
| GalleryPage | Search results | `GET /v1/gallery` (paginated) |

### Data fetching strategy

- **TanStack Query** (React Query) for all API calls — gives us caching, polling, stale-while-revalidate for free
- **Polling** for generation status (ResultsPage) with configurable interval
- **On-demand** fetching for pipeline stages (user clicks "Generate Spec" → trigger → poll)
- **Prefetch** project designs when hovering project card on HomePage

---

## 9. What the App Should Feel Like

### First impression (0-5 seconds)
Dark, warm, luxurious. Gold glows subtly. Large typography. The user feels they've entered somewhere premium. Not a dashboard. A studio.

### Creating a design (Create page)
Focused and confident. Left panel is a clean vertical stack of choices — each selection feels decisive (gold highlight, subtle bounce). The prompt preview on the right updates smoothly. The "Generate" button is the only gold CTA on the page — obvious and inviting.

### Waiting for results (Results page)
Anticipation. Skeleton pair cards pulse with a warm gold shimmer. Status text says "Designing your piece..." — not "Polling generation status." When the pair arrives, it fades in with a gentle upward motion — an unveiling, not a page load.

### Selecting a design (Results → Workspace)
Commitment. Clicking "Select This Design" has weight — a brief gold flash, then navigation to the Workspace where the pair is displayed at hero scale. This is YOUR design now.

### The Workspace
Creative control room. The hero pair viewer dominates — large, dramatic, cinematic. Below, the pipeline stages are visible but not demanding. Refine is one click away. Everything about this screen says "your design is valuable and we're going to produce it with care."

### Production pipeline
Progressive confidence. Each stage goes from "not started" to "processing" (subtle pulse) to "ready" (solid gold indicator). The pipeline rail connects stages visually. Completing each stage feels like progress toward something real.

### Gallery
Museum energy. Large images, generous spacing, subtle hover effects. Browsing feels like walking through a collection, not scrolling a spreadsheet.

---

## 10. Migration Strategy

### Phase 1: Shell + Theme (prerequisite for all visual work)
1. Implement new AppShell with top-bar navigation (no sidebar)
2. Restore dark-luxury-gold theme tokens
3. Implement new route structure (7 routes)
4. Wire breadcrumb system

### Phase 2: Home + Create (the entry flow)
1. Build HomePage with ProjectGrid
2. Build CreatePage with ConfigPanel + PromptPreview
3. Wire `POST /v1/prompt-preview` and `POST /v1/generate-design`

### Phase 3: Results + Workspace (the core experience)
1. Build ResultsPage with dramatic PairViewer
2. Build WorkspacePage with HeroPairViewer + PipelineRail
3. Wire `GET /v1/generations/:id` polling
4. Wire `GET /v1/designs/:id`

### Phase 4: Pipeline + Refine (production depth)
1. Build pipeline stage cards with expand/collapse
2. Wire all four stage endpoints
3. Build RefineDrawer with generation flow

### Phase 5: Gallery + Polish (browse + finish)
1. Build GalleryPage with masonry grid
2. Wire `GET /v1/gallery` with search/filter
3. Loading/skeleton states across all pages
4. Motion layer (entrance animations, transitions)
5. Empty states, error states, product copy

---

## 11. Open Questions

| Question | Impact | Proposed answer |
|---|---|---|
| Should project detail be a separate route or expandable on Home? | IA complexity | Separate route (`/app/projects/:id`) — cleaner URL model, better deep linking |
| Should pipeline stages be expandable cards or tabs within Workspace? | Workspace layout | Expandable cards — tabs add another navigation layer, cards are progressive disclosure |
| How many generations should Results show at once? | Results layout | One primary pair (current generation) + thumbnail row of previous generations |
| Should Gallery support infinite scroll or pagination? | Gallery UX | Infinite scroll with intersection observer — premium creative tool pattern |
| Should "Generate Again" from Results re-use same config or go back to Create? | Flow friction | Stay on Results, re-trigger with same config. "Edit Config" goes back to Create. |

---

## Appendix A: Route Comparison

| Current (original) | Phase 2A | Redesign |
|---|---|---|
| `/` | `/` | `/` |
| `/app` (Dashboard) | `/app` (WorkspaceScreen) | `/app` (Home) |
| `/app/create` | `/app/projects/:id/create` (CreateTab) | `/app/projects/:id/create` |
| `/app/gallery` | `/app/gallery` (GalleryTab) | `/app/gallery` |
| `/app/preview/:id` | `/app/projects/:id/designs/:id` | `/app/projects/:id/designs/:id` (Workspace) |
| `/app/copilot` | — (RefineDrawer) | — (RefineDrawer in Workspace) |
| `/app/export` | `/app/projects/:id/designs/:id/cad` | — (Pipeline in Workspace) |
| — | `/app/projects/:id/generations/:id` | `/app/projects/:id/generations/:id` |
| — | `/app/projects/:id/designs/:id/spec` | — (Pipeline in Workspace) |
| — | `/app/projects/:id/designs/:id/technical-sheet` | — (Pipeline in Workspace) |
| — | `/app/projects/:id/designs/:id/svg` | — (Pipeline in Workspace) |
| — | `/app/projects` (ProjectsTab) | `/app` (Home IS projects) |

**Net: 7 routes total. Clean. Project-scoped. Every route maps to real backend.**

## Appendix B: Backend Endpoint → UI Surface Mapping

| Backend Endpoint | UI Surface | Interaction |
|---|---|---|
| `GET /v1/projects` | Home → ProjectGrid | Load on mount |
| `POST /v1/projects` | Home → "New Project" dialog | User action |
| `POST /v1/prompt-preview` | Create → PromptPreview | Debounced on config change |
| `POST /v1/generate-design` | Create → Generate CTA | User action, idempotent |
| `GET /v1/generations/:id` | Results → PairViewer | Polled until succeeded |
| `GET /v1/designs/:id` | Workspace → HeroPairViewer | Load on mount |
| `POST /v1/designs/:id/spec` | Workspace → Pipeline → Spec stage | User action |
| `GET /v1/designs/:id/spec` | Workspace → Pipeline → Spec content | Load after trigger |
| `POST /v1/designs/:id/technical-sheet` | Workspace → Pipeline → Tech Sheet stage | User action |
| `GET /v1/designs/:id/technical-sheet` | Workspace → Pipeline → Tech Sheet content | Load after trigger |
| `POST /v1/designs/:id/svg` | Workspace → Pipeline → SVG stage | User action |
| `GET /v1/designs/:id/svg` | Workspace → Pipeline → SVG content | Load after trigger |
| `POST /v1/designs/:id/cad` | Workspace → Pipeline → CAD stage | User action |
| `GET /v1/designs/:id/cad` | Workspace → Pipeline → CAD downloads | Load after trigger |
| `GET /v1/gallery` | Gallery → DesignGrid | Load on mount, search/filter |
