# SkyGems Phase 0 — Frontend/UX Reuse Audit & Target Flow Map

**Date:** 2026-04-05
**Author:** Claude (Phase 0 Discovery)
**Branch:** `emdash/phase-0-skygems-frontend-ux-reuse-audit-and-flow-map-2cg`
**Codebase snapshot:** commit `2835a39` — `feat: SkyGems clean UI shell — stripped from gemstudio-dark-redesign`

---

## 1. What I Inspected

| Area | Files Read | Method |
|------|-----------|--------|
| Root config | `package.json`, `tsconfig.json`, `vite.config.ts`, `postcss.config.mjs`, `.env.example`, `index.html` | Direct read |
| Docs | `README.md` (only doc — no `/docs` dir exists) | Direct read |
| Styles | `src/styles/theme.css`, `index.css`, `fonts.css`, `tailwind.css` | Direct read |
| Entry & routing | `src/main.tsx`, `src/app/App.tsx`, `src/app/routes.tsx` | Direct read |
| Layout | `src/app/layouts/RootLayout.tsx` (177 LOC) | Direct read |
| All 7 screens | `LandingPage.tsx` (286), `Dashboard.tsx` (337), `DesignGenerator.tsx` (376), `DesignGallery.tsx` (358), `DesignPreview.tsx` (275), `AICoPilot.tsx` (271), `CADExport.tsx` (245) | Direct read |
| Services | `storageService.ts` (479), `variationEngine.ts` (247) | Direct read |
| Utils | `promptGenerator.ts` (135) | Direct read |
| UI library | All 46 files in `src/app/components/ui/` + `components/figma/ImageWithFallback.tsx` | Sampled key files, cataloged all |
| Dependency tree | 54 production deps, 4 dev deps in `package.json` | Direct read |

**Total source files:** 63 TypeScript/TSX + 4 CSS files
**No monorepo config** — single Vite app, no workspaces, no wrangler.toml, no Cloudflare bindings yet.

---

## 2. Current Frontend Architecture Found

### Stack
- **React 18** + TypeScript (strict mode) + **Vite 6**
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no PostCSS chain needed)
- **React Router v7** — `createBrowserRouter` with nested routes
- **Motion** (Framer Motion successor) for animations
- **Radix UI** primitives + **shadcn/ui** pattern (46 component files copied in)
- **Lucide React** icons

### Architecture Diagram

```
index.html (viewport-locked: 100vh, overflow:hidden)
  └─ main.tsx
       └─ App.tsx → RouterProvider
            ├─ / → LandingPage (public, standalone)
            └─ /app → RootLayout (sidebar + Outlet)
                 ├─ index → Dashboard
                 ├─ create → DesignGenerator
                 ├─ gallery → DesignGallery
                 ├─ preview/:id → DesignPreview
                 ├─ copilot → AICoPilot
                 └─ export → CADExport
```

### State Management
- **None.** No Redux, Zustand, Jotai, or Context providers.
- Each screen manages its own `useState` hooks.
- Persistence via `StorageManager` singleton wrapping `localStorage`.

### Data Flow
- All data operations are **synchronous** localStorage reads.
- No API client, no fetch wrappers, no React Query/SWR.
- `handleGenerate()` in DesignGenerator has `// TODO: Wire up image generation service here`.
- `.env.example` references `VITE_XAI_API_KEY` (Grok/X.AI) — nothing consumes it.

### Design System
- **Dark luxury palette** — all colors via CSS custom properties in `theme.css`
- Backgrounds: `#0A0A0A` → `#111111` → `#1A1A1A` → `#222222` → `#2A2A2A`
- Gold accent: `#D4AF37` (primary), `#B8941F` (muted), `#F5DEB3` (light)
- Typography: Playfair Display (headings via Google Fonts) + Inter (body)
- Motion tokens: 150ms/250ms/400ms durations, spring easing
- Custom utilities: `.skeleton-shimmer`, `.gold-glow`, `.border-subtle`, `.eyebrow`, `.text-display`

### Authentication
- **Not implemented.** LandingPage "Sign In" links directly to `/app`. RootLayout shows hardcoded "User Account" / "Premium Plan" placeholder.

---

## 3. Reuse Inventory: Keep / Refactor / Replace / Delete

### KEEP AS-IS (high-value, low-risk)

| Asset | Path | Why Keep |
|-------|------|----------|
| **Design token system** | `src/styles/theme.css` | Comprehensive, well-structured CSS custom properties. Gold luxury palette is on-brand. Tailwind `@theme` mapping is clean. |
| **Tailwind + Vite setup** | `vite.config.ts`, `tailwind.css` | Modern, minimal config. Tailwind v4 via Vite plugin is correct. |
| **All 46 shadcn/ui components** | `src/app/components/ui/*` | Standard, accessible, well-typed Radix primitives. These are copy-paste-own by design — no upgrade debt. Key pieces: `button`, `dialog`, `sheet`, `tabs`, `card`, `select`, `slider`, `form`, `badge`, `skeleton`, `scroll-area`, `command`, `tooltip`. |
| **`cn()` utility** | `src/app/components/ui/utils.ts` | Standard `clsx` + `tailwind-merge` — foundational. |
| **`useIsMobile` hook** | `src/app/components/ui/use-mobile.ts` | Clean responsive breakpoint hook (1024px). |
| **Layout constraint** | `index.html` + `RootLayout.tsx` | `h-screen overflow-hidden` viewport-lock is a correct SPA pattern. Well-documented in README. |
| **Motion import pattern** | All screens | `import { motion } from 'motion/react'` — correct, modern usage. |
| **Font setup** | `src/styles/fonts.css` | Google Fonts import for Inter + Playfair Display, with proper `font-display: swap`. |
| **ImageWithFallback** | `src/app/components/figma/ImageWithFallback.tsx` | Simple, useful error boundary for images. SVG fallback is reasonable. |

### REFACTOR (valuable concept, needs rework)

| Asset | Path | What to Change | Why |
|-------|------|----------------|-----|
| **RootLayout** | `src/app/layouts/RootLayout.tsx` | Extract sidebar nav items into config. Remove inline styles for hover states (use Tailwind or CSS). Add auth-gated user section. Prepare for breadcrumbs and status bar. | Currently functional but mixes data (nav items) with presentation. Inline `onMouseEnter/onMouseLeave` style handlers should be CSS. |
| **StorageManager** | `src/app/services/storageService.ts` | Replace localStorage with an API client that talks to Cloudflare D1/KV/R2. Keep the interface (`getAllDesigns`, `saveDesign`, etc.) but swap the implementation. | The interface is well-designed. The localStorage impl is throwaway for production but the method signatures are a good contract. |
| **VariationEngine** | `src/app/services/variationEngine.ts` | Keep the data structures and generation logic. Move config to a shared schema file. Add server-side validation. | Good domain logic. Type-specific overrides per jewelry type are well-thought-out. |
| **PromptGenerator** | `src/app/utils/promptGenerator.ts` | Keep composition-first prompt structure. Parameterize for different AI backends (not just Grok). Make variation injection configurable. | Solid prompt engineering. "Composition first, details second" is a good principle worth preserving. |
| **DesignGenerator screen** | `src/app/screens/DesignGenerator.tsx` | Extract selector components (TypeSelector, MetalSelector, GemstoneSelector, StyleSelector) into reusable pieces. Wire to actual API. Add loading/error states. The left-panel config UI is well-designed and close to production. | Currently a monolithic 376-line component with good UX but no extraction. |
| **Dashboard screen** | `src/app/screens/Dashboard.tsx` | Extract DesignCard into a shared component (used here and in Gallery). Replace hand-rolled dropdown with shadcn Select. Wire search to backend. | Good UX patterns (search, category buttons, recents grid) but inline components that should be shared. |
| **DesignGallery screen** | `src/app/screens/DesignGallery.tsx` | Extract gallery grid + detail panel pattern. Replace `window.confirm` with shadcn AlertDialog. Share DesignCard with Dashboard. | Good gallery UX with hover overlays. Detail panel is a pattern we'll reuse for Spec/TechSheet views. |
| **Sidebar component** | `src/app/components/ui/sidebar.tsx` (727 LOC) | Currently unused by RootLayout (which has its own inline sidebar). Decide: use the shadcn sidebar or keep the custom one. Don't ship both. | The shadcn sidebar is feature-rich (collapsible, mobile sheet, cookie persist, keyboard shortcut) but RootLayout rolls its own simpler version. |

### REPLACE (concept doesn't fit target flow)

| Asset | Path | Why Replace |
|-------|------|-------------|
| **DesignPreview screen** | `src/app/screens/DesignPreview.tsx` | 100% hardcoded data ("Diamond Solitaire Ring", "$3,600", "Platinum 950"). No dynamic data loading — doesn't use `:id` param. Uses `h-screen` (violates layout rules in README). Fake 3D viewer (CSS `rotateY` on a placeholder image). This screen's UX concept (split viewer + specs panel) is reusable, but the implementation must be rebuilt. |
| **AICoPilot screen** | `src/app/screens/AICoPilot.tsx` | Mock AI with `setTimeout(2000)`. No actual AI integration. Chat UX is fine as a reference, but this screen doesn't map to the target flow (Create → Generate Pair → Select → Spec → TechSheet → SVG → CAD). Copilot may become a future feature, but it's not in the critical path. |
| **CADExport screen** | `src/app/screens/CADExport.tsx` | Hardcoded specs, fake export (`setTimeout(2000)`), no actual file generation. The format selection UX is reusable, but the screen itself is a static mockup. Needs complete rebuild with real export pipeline. |
| **LandingPage screen** | `src/app/screens/LandingPage.tsx` | Marketing page with fake stats ("10K+ designs, 500+ CAD exports"). Not wrong — just not in the critical path for the app. Can be rebuilt later when marketing copy is real. |

### DELETE (dead weight or risk)

| Asset | Reason |
|-------|--------|
| **`@mui/material` + `@mui/icons-material` + `@emotion/react` + `@emotion/styled`** (4 deps in package.json) | **Not imported anywhere in the codebase.** These add ~2MB to `node_modules` and create a conflicting design system. Remove from `package.json`. |
| **`next-themes`** dependency | Imported only by `sonner.tsx` for toast theming. SkyGems is dark-only — no theme switching needed. Can be replaced with a static theme prop. |
| **`react-responsive-masonry`** dependency | Not imported anywhere. Dead dependency. |
| **`input-otp`** + `src/app/components/ui/input-otp.tsx` | OTP input component. No auth flow exists. Remove until auth is built. |
| **`react-day-picker`** + `calendar.tsx` | No date-picking use case in current or target flow. |
| **`recharts`** + `chart.tsx` | No analytics/chart use case in target flow. |
| **`embla-carousel-react`** + `carousel.tsx` | No carousel use case in target flow (gallery is grid-based). |
| **Several unused shadcn components** | `menubar.tsx`, `context-menu.tsx`, `navigation-menu.tsx`, `hover-card.tsx`, `resizable.tsx`, `pagination.tsx` — none referenced by any screen. Keep only what's used or immediately planned. |

---

## 4. Proposed Route & Screen Map for SkyGems Target Flow

### Target User Flow
```
Create → Generate Pair → Select → Spec → Technical Sheet → SVG → CAD
```

### Proposed Route Structure

```
/ → LandingPage (public — defer to later phase)

/app → RootLayout (sidebar + Outlet)
  ├─ /app                    → Dashboard (home: recent projects, quick-create)
  ├─ /app/create             → CreateDesign (Step 1: configure jewelry params)
  ├─ /app/create/results     → GenerationResults (Step 2: view generated pairs/grid)
  ├─ /app/design/:id         → DesignDetail (Step 3+4: selected design → spec view)
  ├─ /app/design/:id/tech    → TechnicalSheet (Step 5: full technical specifications)
  ├─ /app/design/:id/svg     → SVGPreview (Step 6: vector preview + annotation)
  ├─ /app/design/:id/export  → CADExport (Step 7: format selection + download)
  ├─ /app/gallery             → Gallery (browse all designs, filter, search)
  └─ /app/settings            → Settings (future: account, workspace, preferences)
```

### Screen-by-Screen Map

| # | Route | Screen Name | Purpose | Reuse Source | Build Effort |
|---|-------|-------------|---------|--------------|-------------|
| 1 | `/app` | **Dashboard** | Recent projects, quick-create buttons, search | Refactor existing `Dashboard.tsx` | Low |
| 2 | `/app/create` | **CreateDesign** | Type/metal/gem/style/complexity config → prompt → generate | Refactor existing `DesignGenerator.tsx` — extract selectors, wire API | Medium |
| 3 | `/app/create/results` | **GenerationResults** | Grid of generated design pairs, compare side-by-side, select favorites | **NEW** — use gallery grid pattern from `DesignGallery.tsx` | Medium |
| 4 | `/app/design/:id` | **DesignDetail** | Selected design view: image + basic spec + actions (edit, proceed to tech sheet) | Partial reuse of `DesignPreview.tsx` layout concept (split viewer + panel), but rebuild with real data | Medium |
| 5 | `/app/design/:id/tech` | **TechnicalSheet** | Full manufacturing specs: dimensions, weights, tolerances, materials, gemstone specs, manufacturing feasibility | **NEW** — use spec panel pattern from `DesignPreview.tsx` right panel, but as full page | Medium |
| 6 | `/app/design/:id/svg` | **SVGPreview** | Rendered SVG vector view with annotation layers, multiple views (front, side, top) | **NEW** — no existing SVG viewer | High |
| 7 | `/app/design/:id/export` | **CADExport** | Format selection + real file generation + download | Refactor existing `CADExport.tsx` — format selector UX is good, needs real backend | Medium |
| 8 | `/app/gallery` | **Gallery** | Browse all designs across projects, filter, tag, search | Refactor existing `DesignGallery.tsx` | Low |

### Flow Diagram

```
┌─────────┐    ┌──────────────┐    ┌───────────────────┐    ┌──────────────┐
│Dashboard │───▶│ CreateDesign  │───▶│ GenerationResults │───▶│ DesignDetail │
│  /app    │    │ /app/create  │    │ /app/create/results│   │ /app/design/:id│
└─────────┘    └──────────────┘    └───────────────────┘    └──────┬───────┘
                                                                    │
                                          ┌─────────────────────────┤
                                          ▼                         ▼
                                   ┌──────────────┐         ┌─────────────┐
                                   │TechnicalSheet│         │   Gallery   │
                                   │ .../tech     │         │ /app/gallery│
                                   └──────┬───────┘         └─────────────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │  SVGPreview  │
                                   │  .../svg     │
                                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │  CADExport   │
                                   │  .../export  │
                                   └──────────────┘
```

---

## 5. Proposed Component & State Boundaries

### Shared Components to Extract

| Component | Extracted From | Used By |
|-----------|---------------|---------|
| `DesignCard` | Dashboard + DesignGallery (both render design cards inline) | Dashboard, Gallery, GenerationResults |
| `TypeSelector` | DesignGenerator (inline) | CreateDesign, Dashboard quick-create |
| `MetalSelector` | DesignGenerator (inline) | CreateDesign |
| `GemstoneSelector` | DesignGenerator (inline) | CreateDesign |
| `StyleSelector` | DesignGenerator (inline) | CreateDesign |
| `ComplexitySlider` | DesignGenerator (inline) | CreateDesign |
| `SpecPanel` | DesignPreview right panel (inline) | DesignDetail, TechnicalSheet |
| `FormatSelector` | CADExport (inline) | CADExport |
| `DesignViewer` | DesignPreview (inline) | DesignDetail, SVGPreview |
| `ProgressStep` | **New** | Flow progress indicator across create → results → detail → tech → svg → cad |

### State Architecture (Recommended)

```
Global State (Zustand or Jotai — pick one)
├─ auth: { user, session, tenant }          ← Phase 1
├─ currentProject: { id, designs[], status }  ← Phase 1
└─ ui: { sidebarCollapsed, toasts[] }       ← Phase 1

Per-Route State (React hooks + URL params)
├─ CreateDesign: form state (type, metal, gems, style, complexity)
├─ GenerationResults: generated designs[], selected design id
├─ DesignDetail: design data from API, edit mode
├─ TechnicalSheet: tech specs from API
├─ SVGPreview: SVG data, annotation layer state, view angle
└─ CADExport: selected formats[], export status

Server State (React Query or SWR)
├─ useDesigns(filters) → GET /api/designs
├─ useDesign(id) → GET /api/designs/:id
├─ useGenerate(config) → POST /api/generate (streaming)
├─ useTechSheet(designId) → GET /api/designs/:id/tech
├─ useSVG(designId) → GET /api/designs/:id/svg
└─ useExport(designId, formats) → POST /api/designs/:id/export
```

### Data Types (Extend Existing)

The existing `DesignMetadata` and `DesignFeatures` interfaces in `storageService.ts` are a good starting point. Extend with:

```typescript
// New types needed for target flow
interface Project {
  id: string;
  name: string;
  tenantId: string;
  designs: DesignMetadata[];
  createdAt: number;
  updatedAt: number;
}

interface GenerationRequest {
  config: DesignFeatures;
  prompt: string;
  pairCount: number;  // how many pairs to generate
}

interface GenerationResult {
  requestId: string;
  designs: DesignMetadata[];  // generated pair
  status: 'pending' | 'generating' | 'complete' | 'failed';
}

interface TechnicalSheet {
  designId: string;
  dimensions: { width: number; height: number; depth: number; unit: 'mm' };
  weight: { value: number; unit: 'g' };
  tolerances: Record<string, number>;
  materials: MaterialSpec[];
  gemstones: GemstoneSpec[];
  manufacturingFeasibility: number;  // 0-100
  validationChecks: ValidationCheck[];
}

interface SVGOutput {
  designId: string;
  views: { name: string; svgData: string; }[];  // front, side, top
  annotations: Annotation[];
}
```

---

## 6. Docs-vs-Code Contradictions

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | **README says "Pages use `h-full`"** but `DesignPreview.tsx:12`, `DesignGallery.tsx:94`, and `AICoPilot.tsx:69` all use `h-screen`** | README line 56 vs. 3 screen files | **High** — causes double-scrollbar or content overflow when sidebar is present. `h-screen` on a child inside a `h-screen` parent means the child ignores the sidebar height. |
| 2 | **README lists "Real-time 3D Preview" as a feature** but no 3D viewer exists | README (via LandingPage features section) vs. actual code | **Medium** — marketing copy is ahead of implementation. Not a code bug, but sets false expectations. |
| 3 | **README says "CAD File Export"** but export is a `setTimeout` mock | README features vs. `CADExport.tsx:38-44` | **Medium** — same as above. |
| 4 | **Dashboard shows 8 jewelry categories** (including brooch, anklet, tiara) but **DesignGenerator only supports 5** (ring, necklace, earrings, bracelet, pendant) | `Dashboard.tsx:8-17` vs. `DesignGenerator.tsx:6-12` | **Medium** — clicking "Brooch" on Dashboard navigates to `/app/create?type=brooch` but DesignGenerator has no brooch option. The param is silently ignored. |
| 5 | **DesignGenerator doesn't read query params** — Dashboard passes `?type=ring` but DesignGenerator doesn't consume `useSearchParams()` | `Dashboard.tsx:42` vs. `DesignGenerator.tsx:38-47` | **Low** — wasted navigation context. Easy fix. |
| 6 | **`sonner` toast library is installed + component exists** (`sonner.tsx`) but **never used** — `DesignGallery` uses `window.confirm()` instead | `package.json` + `sonner.tsx` vs. `DesignGallery.tsx:62` | **Low** — should use the installed toast system instead of browser dialogs. |

---

## 7. Risks, Blockers, Stale Areas, and Cleanup Opportunities

### Blockers (Must Fix Before Phase 1)

| # | Blocker | Impact | Effort |
|---|---------|--------|--------|
| B1 | **No API layer exists** — all data is localStorage. Cannot build real generation or persistence without a backend client. | Blocks all dynamic features. | Medium — create API client module + React Query setup |
| B2 | **No authentication** — no login, no session, no tenant isolation. Multi-tenant is a stated goal. | Blocks any production deployment. | High — auth flow + middleware + session management |
| B3 | **No Cloudflare integration** — no wrangler.toml, no Workers, no D1/KV/R2 bindings. The app is a pure client-side SPA. | Blocks the backend that feeds the target flow. | High — but this is backend work, not frontend |

### Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | **MUI + Emotion deps in package.json are unused but present** — if someone accidentally imports MUI, the app gets a conflicting design system and +300KB bundle | Medium | Delete `@mui/*` and `@emotion/*` from `package.json` immediately |
| R2 | **Inline style handlers everywhere** — `onMouseEnter/onMouseLeave` with `style` mutations bypass React's rendering model and can't be theme-toggled | Low (works, but fragile) | Migrate to Tailwind `hover:` utilities or CSS custom property-based hover states |
| R3 | **No error boundaries** — if any screen throws, the entire app white-screens | Medium | Add React Error Boundary at RootLayout level |
| R4 | **No loading states for real data** — all screens assume synchronous data. When API calls are added, every screen needs loading/error states. | High (deferred) | Address during Phase 1 API integration |
| R5 | **Sidebar duplication** — RootLayout has a custom sidebar (177 LOC), but shadcn's `sidebar.tsx` (727 LOC) is also shipped. Two sidebar implementations in the bundle. | Low | Pick one. The shadcn sidebar has more features (mobile sheet, keyboard shortcut, cookie persist). |
| R6 | **No code splitting** — all 7 screens load in the initial bundle. As screens grow, this will slow initial load. | Low now, Medium later | Add `React.lazy()` + `Suspense` for route-level code splitting |

### Stale Areas

| Area | Why Stale |
|------|-----------|
| `LandingPage.tsx` | Marketing copy with fake stats. Not in critical path. |
| `AICoPilot.tsx` | Mock AI chat. Not in target flow. Park it. |
| `DesignPreview.tsx` | 100% hardcoded data. Useful only as a layout reference. |
| `CADExport.tsx` | Fake export. Format selector UX is reusable; everything else is mock. |
| Placeholder images | All screens use `via.placeholder.com` URLs — will 404 or look broken without network. |

### Cleanup Opportunities

1. **Remove dead deps:** `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `react-responsive-masonry`
2. **Remove unused components:** `menubar`, `context-menu`, `navigation-menu`, `hover-card`, `input-otp`, `calendar`, `chart`, `carousel`, `resizable`, `pagination` (10 files)
3. **Fix `h-screen` violations:** `DesignPreview.tsx:12`, `DesignGallery.tsx:94`, `AICoPilot.tsx:69` should be `h-full`
4. **Replace `window.confirm`** in `DesignGallery.tsx:62` with shadcn `AlertDialog`
5. **Wire `sonner` toasts** — the component exists but is never rendered in the app tree

---

## 8. Recommended Frontend Task Breakdown

### Phase 1 — Foundation & Core Flow (Create → Generate → Select)

| # | Task | Depends On | Effort | Priority |
|---|------|------------|--------|----------|
| 1.1 | **Cleanup: remove dead deps + unused components** | None | 1h | P0 |
| 1.2 | **Fix h-screen violations** in DesignPreview, DesignGallery, AICoPilot | None | 30min | P0 |
| 1.3 | **Install Zustand (or Jotai)** — add minimal global store for UI state + current project | None | 2h | P0 |
| 1.4 | **Install React Query** — add QueryClientProvider, create API client module with typed fetch wrapper | None | 3h | P0 |
| 1.5 | **Extract shared DesignCard component** from Dashboard + Gallery | None | 2h | P1 |
| 1.6 | **Extract selector components** (Type, Metal, Gemstone, Style, Complexity) from DesignGenerator | None | 3h | P1 |
| 1.7 | **Refactor CreateDesign screen** — use extracted selectors, read `?type=` query param, wire to generation API | 1.4, 1.6 | 4h | P1 |
| 1.8 | **Build GenerationResults screen** (`/app/create/results`) — grid of generated pairs, selection UX, "proceed with selected" action | 1.4, 1.5 | 6h | P1 |
| 1.9 | **Build DesignDetail screen** (`/app/design/:id`) — fetch design by ID, display image + basic specs + action bar (Edit, Tech Sheet, Export) | 1.4 | 4h | P1 |
| 1.10 | **Add ProgressStep component** — visual flow indicator (Create → Results → Detail → Tech → SVG → CAD) | None | 2h | P2 |
| 1.11 | **Refactor RootLayout** — extract nav config, add auth placeholder, wire sonner Toaster, add error boundary | 1.3 | 3h | P1 |
| 1.12 | **Update routes.tsx** for new route structure | 1.7–1.9 | 1h | P1 |
| 1.13 | **Refactor Dashboard** — use shared DesignCard, fix dropdown to use shadcn Select, wire to API | 1.4, 1.5 | 3h | P2 |
| 1.14 | **Refactor Gallery** — use shared DesignCard, replace window.confirm with AlertDialog, wire to API | 1.4, 1.5 | 3h | P2 |

**Phase 1 total: ~37 hours of focused frontend work**

### Phase 2 — Spec → SVG → CAD Pipeline

| # | Task | Depends On | Effort | Priority |
|---|------|------------|--------|----------|
| 2.1 | **Build TechnicalSheet screen** (`/app/design/:id/tech`) — full manufacturing specs, validation checklist, material breakdown | 1.9 | 6h | P1 |
| 2.2 | **Build SVGPreview screen** (`/app/design/:id/svg`) — multi-view SVG renderer, annotation layer, zoom/pan controls | 1.9 | 8h | P1 |
| 2.3 | **Refactor CADExport screen** (`/app/design/:id/export`) — wire format selector to real export API, streaming download, progress indicator | 1.4 | 5h | P1 |
| 2.4 | **Add breadcrumb navigation** — show current position in design flow (Design > Tech Sheet > SVG > Export) | 1.10 | 2h | P2 |
| 2.5 | **Add design comparison view** — side-by-side comparison of two designs from GenerationResults | 1.8 | 4h | P2 |
| 2.6 | **Build auth flow** — login/signup screens, session management, route guards | 1.3, 1.4 | 8h | P1 |
| 2.7 | **Add workspace/project model** — project CRUD, design-to-project association, project switcher in sidebar | 2.6 | 6h | P2 |
| 2.8 | **Mobile responsive pass** — verify all new screens work on tablet/mobile, sidebar converts to sheet | All Phase 1 | 4h | P2 |

**Phase 2 total: ~43 hours of focused frontend work**

### Sequencing Recommendation

```
Week 1: 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 (foundation)
Week 2: 1.7 → 1.8 → 1.9 → 1.11 → 1.12 (core flow screens)
Week 3: 1.10 → 1.13 → 1.14 → 2.1 (polish + tech sheet)
Week 4: 2.2 → 2.3 → 2.4 (SVG + CAD pipeline)
Week 5: 2.5 → 2.6 → 2.7 → 2.8 (comparison, auth, projects, mobile)
```

---

## Summary

**What's good:** The design system (tokens, shadcn components, dark luxury palette) is production-quality and fully reusable. The DesignGenerator config UI, Dashboard layout, and Gallery grid/detail patterns are solid foundations. The prompt engineering in `promptGenerator.ts` and variation logic in `variationEngine.ts` represent real domain value.

**What's dangerous:** MUI dependency contamination, three screens using `h-screen` in violation of their own rules, zero API integration, zero auth, and multiple screens that are 100% hardcoded mockups presented as functional features.

**What's missing:** The entire middle of the target flow (GenerationResults, TechnicalSheet, SVGPreview) doesn't exist yet. No state management beyond useState. No server communication. No multi-tenant support.

**Bottom line:** ~40% of the frontend surface area is reusable as-is or with light refactoring. The other ~60% needs to be built from scratch, but the design system and component library mean that new screens can be built fast because the visual language is already established.
