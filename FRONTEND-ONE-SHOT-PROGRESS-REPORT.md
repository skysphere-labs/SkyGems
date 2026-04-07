# Frontend One-Shot Premium Completion — Progress Report

**Date:** 2026-04-07
**Branch:** `emdash/skygems-one-shot-premium-frontend-completion-1me`
**Status:** Implementation pass complete — build, typecheck, and all 12 tests passing.

---

## 1. What Was Implemented

### Design System & Animation Layer (`packages/ui/src/styles/`)
- **Refined skeleton shimmer** — Updated to `bg-elevated` + `rgba(255,255,255,0.04)` per design system spec.
- **Entrance animations** — `animate-entrance` (400ms), `animate-unveil` (600ms signature pair reveal), `stagger-children` (50ms cascading grid items).
- **Card hover** — `card-hover` utility for consistent border-brighten + micro-scale on interactive cards.
- **Image hover zoom** — `img-hover-zoom` (1.03x scale, 400ms ease-out) per design spec.
- **Hover overlay** — `hover-overlay` with bottom gradient for gallery-style image cards.
- **Gold utilities** — `gold-ambient`, `gold-ring`, refined `btn-gold` to use solid gold (not gradient) with active `scale(0.98)`.
- **Eyebrow refinement** — 11px/600 weight/0.1em tracking for sharper luxury signaling.
- **Border tokens** — `--border-default` → `0.06` opacity, `--border-hover` → `0.12`, added `--border-gold`.
- **Reduced motion** — All animations auto-disabled for `prefers-reduced-motion`.

### SelectedDesignScreen — The Emotional Center
- Full-bleed hero pair viewer with gold border glow and hover zoom.
- Vertical connected pipeline rail with icon indicators, status dots, processing pulse animation, gold completion indicators, and connecting lines.
- Design DNA tag chips.
- Entrance animation on mount.

### GenerationScreen — The Reveal Moment
- Signature `animate-unveil` animation (opacity + translateY + scale, 600ms).
- Gold-tinted polling indicator ("Crafting your design pair...").
- Custom shimmer-based skeleton pair cards.
- **Wired `postSelectDesign`** — "Select This Design" now calls `POST /v1/designs/:id/select` before navigating to workspace, with fallback navigation on error.
- Loading state during selection.

### CreateScreen
- `btn-gold` CTA for Generate button.
- `animate-entrance` on mount.

### GalleryScreen — Museum Energy
- Jewelry type filter chips (All/Ring/Necklace/Earrings/Bracelet/Pendant) with gold-active state.
- Image hover overlay gradient with "Open design" action hint.
- Design DNA tags on each card.
- Staggered grid entrance.
- `card-hover` on all cards.

### ProjectsIndex (Your Studio)
- Refined project card icons with gold-08 background + gold-12 border.
- Staggered grid entrance.
- `btn-gold` for all gold CTAs.
- Stronger empty state with bordered icon container.

### ProjectHome (Project Detail)
- Design thumbnails in the recent designs list.
- Generation status as colored pill badges.
- Design DNA tags in selected design hero.
- `img-hover-zoom` on hero sketch/render.
- Staggered activity lists.

### Downstream Screens (Spec / Technical Sheet / SVG / CAD)
- **"Not generated" empty states** with centered gold "Generate" CTA buttons.
- `animate-entrance` on all screens.
- Staggered data sections.
- Risk flag styling with severity-colored borders.
- Conditional "Continue to next stage" CTA.

### RefineDrawer
- **Wired to `postRefineDesign`** with loading state.
- `btn-gold` CTA.

### AppShell & ProjectLayout
- Rounded nav links and active indicators.
- **Contextual breadcrumbs** — Shows current screen name (Create, Results, Workspace, Specification, Technical Sheet, SVG Export, CAD Export).

### LandingPage
- `btn-gold` CTAs.
- `animate-entrance` with stagger.
- `card-hover` on feature cards.
- Reduced decorative glow intensity.

### PromptPreviewStatusCard
- **Source indicator** — Green/gray dot with "Live preview" / "Local preview" label.
- Styled mode indicator cards with subtle borders.
- Warning message borders.

### API Layer
- Fixed `buildRequestHeaders` return type to `Record<string, string>`.
- The concurrent linter/hook pass extended api.ts with significant live-truth adoption:
  - `fetchDesign` → tries `GET /v1/designs/:id` first
  - `fetchSelectedDesign` → tries `GET /v1/projects/:id` first
  - `fetchProjectDesigns` → tries `GET /v1/projects/:id/designs` first
  - `bootstrapProject` → tries `bootstrapLiveProject` (real `/v1/dev/bootstrap`) first
  - `postSelectDesign` → calls `POST /v1/designs/:id/select`

---

## 2. What Flows Are Now Truly Live vs Still Guarded

### Live-first with guarded fallback
| Endpoint | Status |
|----------|--------|
| `POST /v1/prompt-preview` | Tries real API first |
| `POST /v1/generate-design` | Tries real API first |
| `GET /v1/generations/:id` | Tries real API first |
| `GET /v1/projects/:id` | Tries real API first |
| `GET /v1/projects/:id/designs` | Tries real API first |
| `GET /v1/designs/:id` | Tries real API first |
| `POST /v1/designs/:id/select` | **Wired** (called on pair selection) |
| `POST /v1/gallery/search` | Tries real API first |
| `POST /v1/dev/bootstrap` | Tries real API first |

### Still stub/fallback only
| Endpoint | Status |
|----------|--------|
| `GET /v1/projects` (list) | Returns stub/cached projects |
| `POST /v1/designs/:id/spec` | CTA present, not wired |
| `POST /v1/designs/:id/technical-sheet` | CTA present, not wired |
| `POST /v1/designs/:id/svg` | CTA present, not wired |
| `POST /v1/designs/:id/cad` | CTA present, not wired |
| `POST /v1/designs/:id/refine` | Uses local stub generation |

---

## 3. Exact Files Changed

### Design system (2 files)
- `packages/ui/src/styles/theme.css` — Refined border tokens, added --border-gold
- `packages/ui/src/styles/utilities.css` — Complete rewrite: entrance/unveil/stagger animations, card-hover, img-hover-zoom, hover-overlay, gold utilities, reduced-motion support

### Screens (11 files)
- `apps/web/src/app/screens/SelectedDesignScreen.tsx` — Full rewrite: hero viewer, vertical pipeline rail
- `apps/web/src/app/screens/GenerationScreen.tsx` — Unveil animation, gold polling, selection API wiring
- `apps/web/src/app/screens/CreateScreen.tsx` — btn-gold, entrance animation
- `apps/web/src/app/screens/GalleryScreen.tsx` — Filter chips, hover overlay, stagger, tags
- `apps/web/src/app/screens/ProjectsIndex.tsx` — Refined cards, stagger, btn-gold
- `apps/web/src/app/screens/ProjectHome.tsx` — Thumbnails, badges, tags, stagger
- `apps/web/src/app/screens/SpecScreen.tsx` — Empty state CTA, entrance, stagger, risk borders
- `apps/web/src/app/screens/TechnicalSheetScreen.tsx` — Empty state CTA, entrance, stagger
- `apps/web/src/app/screens/SvgScreen.tsx` — Empty state CTA, entrance, stagger
- `apps/web/src/app/screens/CadScreen.tsx` — Gold borders, entrance, stagger
- `apps/web/src/app/screens/LandingPage.tsx` — btn-gold, entrance, card-hover

### Layouts (2 files)
- `apps/web/src/app/layouts/AppShell.tsx` — Rounded nav links, rounded active indicator
- `apps/web/src/app/layouts/ProjectLayout.tsx` — Contextual breadcrumbs

### Components (2 files)
- `apps/web/src/app/components/RefineDrawer.tsx` — Wired to API, loading state, btn-gold
- `apps/web/src/app/components/status/PromptPreviewStatusCard.tsx` — Source indicator, styled borders

### API (1 file)
- `apps/web/src/app/contracts/api.ts` — Fixed buildRequestHeaders return type

---

## 4. Design/UX Decisions Made

1. **Solid gold over gradients for CTAs** — Per design system spec.
2. **Vertical pipeline rail** — Connected-stage layout with icons, status dots, and gold completion instead of flat 4-card grid.
3. **Kept separate downstream routes** — Workspace pipeline rail links to them; preserves URL addressability.
4. **Gold-tinted polling** — Generation waiting state uses gold accent instead of blue.
5. **Filter chips in gallery** — Quick jewelry type filtering without search.
6. **Design thumbnails in project home** — Visual recognition over text-only cards.
7. **Contextual breadcrumbs** — Third segment shows current screen name for orientation.
8. **"Generate" CTAs on empty stages** — Clear gold CTA when stage has no data.
9. **`prefers-reduced-motion`** — All animations auto-disabled.
10. **Live/fallback source indicator** — Users see whether they're hitting real backend.
11. **Selection calls real API** — `postSelectDesign` wired before workspace navigation.

---

## 5. Remaining Blockers

1. **Pipeline stage triggers** — Generate Spec/Tech Sheet/SVG/CAD buttons need `POST /v1/designs/:id/{stage}` wiring.
2. **Refine still stub** — `postRefineDesign` creates local stub generation.
3. **Gallery images are stubs** — Inline SVG poster placeholders, not real R2-served images.
4. **Bundle size** — ~477 KB JS (141 KB gzip). Code splitting by route would improve initial load.
5. **No auth flow** — No Auth0 integration. Placeholder auth headers.
6. **Old workspace files** — Deleted in working tree but not staged.

---

## 6. Exact Next Recommended Work Item

**Wire pipeline stage triggers to real backend endpoints.**

1. Wire "Generate Specification" → `POST /v1/designs/:id/spec` with polling
2. Wire "Generate Technical Sheet" → `POST /v1/designs/:id/technical-sheet` with polling
3. Wire "Generate SVG" → `POST /v1/designs/:id/svg` with polling
4. Wire "Generate CAD" per-format → `POST /v1/designs/:id/cad` with format selection and polling
5. Wire refine → real `POST /v1/designs/:id/refine` instead of stub
6. Add route-level code splitting to reduce initial bundle

---

## Validation

```
npm run typecheck    ✓ (all 3 workspaces pass)
npm run build:web    ✓ (1805 modules, 1.13s, no errors)
npm test             ✓ (12/12 tests pass, 0 failures)
```
