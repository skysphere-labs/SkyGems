# UI Overhaul Implementation Backlog

**Date:** 2026-04-06
**Status:** Pending design approval. Do not begin implementation until the Figma screens are reviewed and signed off.
**Depends on:** `PHASE-4A-FIGMA-FIRST-UX-OVERHAUL.md`, `SKYGEMS-DESIGN-SYSTEM.md`, Figma screen generation via `FIGMA-MCP-PROMPT-PACK.md`

---

## Implementation Phases

The redesign is broken into 6 phases. Each phase produces a shippable increment. Phases must be executed in order — later phases depend on earlier ones.

**Estimated scope:** ~15-20 focused implementation tasks across all phases.

---

## Phase 0: Design Approval Gate

**Goal:** Validate the redesign before writing code.

| # | Task | Deliverable | Done when |
|---|---|---|---|
| 0.1 | Generate Figma screens using the prompt pack | 13 Figma pages | All screens match acceptance criteria in FIGMA-MCP-PROMPT-PACK.md Section 4 |
| 0.2 | Review screens against backend truth | Annotated feedback | Every screen maps to real endpoints; no fantasy features shown |
| 0.3 | Stakeholder sign-off | Approval | Go/no-go on implementation |

**Exit criteria:** Written approval to proceed. Any design changes from review are applied to Figma before Phase 1.

---

## Phase 1: Foundation — Shell, Theme, Routes

**Goal:** New app shell with correct navigation, routing, and visual identity. Everything after this builds on a correct foundation.

**Must start from:** Phase 3A integrated monorepo (`apps/web/`, `packages/ui/`, `packages/shared/`)

| # | Task | Files | Scope | Depends on |
|---|---|---|---|---|
| 1.1 | **Restore dark-luxury-gold theme** | `packages/ui/src/styles/theme.css` | Replace all purple token values with original gold values. Restore `--accent-gold: #D4AF37`. Remove `--sg-gradient`, `--sg-purple`, `--sg-blue`. Make dark mode the only mode. Add all new tokens from SKYGEMS-DESIGN-SYSTEM.md (spacing scale, motion tokens, shadow tokens). | — |
| 1.2 | **Implement new AppShell + TopNav** | `apps/web/src/app/layouts/AppShell.tsx`, new `TopNav.tsx` | Top bar navigation (56px, fixed). Logo + Home + Gallery + Avatar. No sidebar. Mobile hamburger variant. Replace `WorkspaceScreen.tsx` and old `RootLayout.tsx`. | 1.1 |
| 1.3 | **Implement new route structure** | `apps/web/src/app/routes.tsx`, `apps/web/src/app/lib/routes.ts` | 7 routes as defined in UX overhaul doc. Remove old tab-based routes. Wire breadcrumb context. Update route helpers. | 1.2 |
| 1.4 | **Implement Breadcrumb component** | New `Breadcrumb.tsx` | Project-aware breadcrumbs. "Home > Project Name > Screen" pattern. Links for all segments except current. | 1.3 |
| 1.5 | **Delete dead code** | Multiple files | Remove: `WorkspaceScreen.tsx`, `IconNav`, all tab components (`CreateTab`, `GalleryTab`, `ProjectsTab`, `PipelineTab`, `ExportTab`), old screen files from original app (`Dashboard.tsx`, `DesignPreview.tsx`, `AICoPilot.tsx`, `CADExport.tsx`), `storageService.ts`, `RootLayout.tsx`. Remove unused shadcn components (~35 files). | 1.3 |

**Phase 1 definition of done:**
- App loads with top-bar navigation
- All 7 routes resolve (pages can be empty shells)
- Theme renders dark-luxury-gold correctly
- Breadcrumbs show on project-scoped routes
- Build passes with no errors
- No dead code from old UI remains

---

## Phase 2: Home + Create (The Entry Flow)

**Goal:** Users can land on the app, see their projects, and configure a design generation.

| # | Task | Files | Scope | Depends on |
|---|---|---|---|---|
| 2.1 | **Build HomePage** | New `HomePage.tsx`, `ProjectCard.tsx`, `ProjectGrid.tsx` | Project grid with image-first cards. Empty state for new users. "New Project" CTA. Recent activity row. | Phase 1 |
| 2.2 | **Build CreatePage — ConfigPanel** | New `CreatePage.tsx`, `ConfigPanel.tsx` | Left column: all 5 pickers stacked vertically. Reuse Phase 2A picker components with gold theming upgrade. Generate CTA at bottom. | Phase 1 |
| 2.3 | **Upgrade create-flow pickers** | `JewelryTypePicker.tsx`, `MetalPicker.tsx`, `GemstonePicker.tsx`, `StylePicker.tsx`, `ComplexityControl.tsx` | Restore gold selection states. Add color swatches to MetalPicker. Add gem-colored dots to GemstonePicker. Gold fill track on ComplexitySlider. Remove developer copy. Apply design system spacing and typography. | 2.2 |
| 2.4 | **Build CreatePage — PromptPreview** | `PromptPreview.tsx` | Right column: live prompt preview card. Synced/Override mode indicator. Design DNA pills. "Reset to Auto" button. Wire to `useCreateDraftState`. | 2.2 |
| 2.5 | **Wire prompt-preview endpoint** | `apps/web/src/app/contracts/api.ts` | Replace stub `postPromptPreview()` with real `POST /v1/prompt-preview` call. Debounced on config change. | 2.4 |

**Phase 2 definition of done:**
- HomePage shows projects (stub data OK initially) with premium cards
- Empty state renders correctly for new users
- CreatePage two-column layout works
- All pickers render with gold theming
- Prompt preview updates on config changes
- Generate CTA is wired (can be stub initially)
- No developer copy visible

---

## Phase 3: Results + Workspace (The Core Experience)

**Goal:** Users can see generation results, select a design, and view it in the workspace with the hero pair viewer.

| # | Task | Files | Scope | Depends on |
|---|---|---|---|---|
| 3.1 | **Build ResultsPage** | New `ResultsPage.tsx`, `PairViewer.tsx` | Centered layout. Status banner (polling state). Large pair display (sketch + render). Skeleton loading state. "Select This Design" gold CTA. Previous generations row. | Phase 2 |
| 3.2 | **Upgrade PairCard/PairViewer** | Refactor `PairCardV1.tsx` → `PairViewer.tsx` | Dramatic size increase. Gold selection ring. Hover elevation. Entrance animation (fade-in + translate). Skeleton shimmer. Replace developer copy. | 3.1 |
| 3.3 | **Wire generation polling** | `apps/web/src/app/contracts/api.ts`, new `useGenerationPolling.ts` hook | Replace stub with real `GET /v1/generations/:id` polling. TanStack Query integration. Status mapping: `running→processing`, `succeeded→completed`. Normalize singular `pair` model. | 3.1 |
| 3.4 | **Build WorkspacePage — Hero + Info** | New `WorkspacePage.tsx`, `HeroPairViewer.tsx` | Full-width hero pair viewer. Design info bar (name, project link). Action bar (Refine, Download). Metadata pills row. | 3.1 |
| 3.5 | **Wire design endpoint** | `apps/web/src/app/contracts/api.ts` | Replace stub `getDesign()` with real `GET /v1/designs/:id`. | 3.4 |

**Phase 3 definition of done:**
- ResultsPage shows skeleton → pair unveiling animation on generation complete
- "Select This Design" promotes pair to design
- WorkspacePage shows hero pair viewer at dramatic scale
- Design info and metadata display correctly
- Generation polling works against real or stubbed backend
- The pair viewer IS the emotional centerpiece of the product

---

## Phase 4: Pipeline + Refine (Production Depth)

**Goal:** Users can trigger and view the full production pipeline and refine their designs.

| # | Task | Files | Scope | Depends on |
|---|---|---|---|---|
| 4.1 | **Build PipelineRail** | New `PipelineRail.tsx`, `StageCard.tsx` | Horizontal 4-stage indicator with connecting line. Stage cards with status, CTA, gold indicators for completion. Responsive: vertical on mobile. | Phase 3 |
| 4.2 | **Build Spec stage content** | New `SpecContent.tsx` | Expandable card within workspace. Structured sections (dimensions, materials, gemstones, manufacturing). Risk flags with severity colors. | 4.1 |
| 4.3 | **Build remaining stage content** | New `TechSheetContent.tsx`, `SvgContent.tsx`, `CadContent.tsx` | Tech Sheet: collapsible sections. SVG: vector preview with zoom. CAD: format selector (STEP/STL/DXF), per-format download buttons. | 4.1 |
| 4.4 | **Wire pipeline endpoints** | `apps/web/src/app/contracts/api.ts` | Wire all 8 pipeline endpoints (POST trigger + GET result for each of spec, tech-sheet, svg, cad). Polling for processing states. | 4.2, 4.3 |
| 4.5 | **Build RefineDrawer** | Upgrade existing `RefineDrawer.tsx` | Premium drawer treatment. Suggestion chips. Text input with gold focus. "Refine" gold CTA. Preservation note. Wire to `POST /v1/generate-design` with refine params. | Phase 3 |

**Phase 4 definition of done:**
- Pipeline rail shows all 4 stages with correct status indicators
- Each stage can be triggered and shows real or stubbed content
- Stage progression is visually connected (gold line fills as stages complete)
- Spec content shows structured data with risk flags
- CAD stage shows 3 format options (STEP/STL/DXF)
- RefineDrawer opens from workspace with suggestion chips
- Refinement triggers new generation

---

## Phase 5: Gallery (Browse + Library)

**Goal:** Users can browse all their designs across projects in a premium gallery.

| # | Task | Files | Scope | Depends on |
|---|---|---|---|---|
| 5.1 | **Build GalleryPage** | New `GalleryPage.tsx`, `DesignCard.tsx`, `DesignGrid.tsx` | Masonry/uniform grid. Search bar. Filter chips (by type). Sort dropdown. Image-first cards with hover overlays. | Phase 1 |
| 5.2 | **Build gallery card interactions** | `DesignCard.tsx` | Hover: image zoom, gradient overlay, quick-action buttons (Open, Like). Click: navigate to design's workspace. | 5.1 |
| 5.3 | **Wire gallery endpoint** | `apps/web/src/app/contracts/api.ts` | Wire `GET /v1/gallery` with search and filter params. Infinite scroll with intersection observer. | 5.1 |

**Phase 5 definition of done:**
- Gallery shows designs from all projects in an image-first grid
- Search filters results
- Type filter chips work
- Card hover shows zoom + overlay + quick actions
- Clicking a card navigates to the design's workspace
- Infinite scroll loads more results

---

## Phase 6: Polish + States + Motion (Finish)

**Goal:** Premium-quality loading states, empty states, error handling, motion, and responsive behavior across the entire app.

| # | Task | Files | Scope | Depends on |
|---|---|---|---|---|
| 6.1 | **Skeleton loading states** | New `SkeletonSet.tsx` variants | Per-page skeleton layouts: Home (project cards), Create (pickers + preview), Results (pair), Workspace (hero + pipeline), Gallery (grid). Shimmer animation. | Phases 2-5 |
| 6.2 | **Empty states** | New `EmptyState.tsx` | Centered icon + headline + body + CTA pattern. Variants: no projects, no generations, no gallery results, pipeline stage not started. | Phases 2-5 |
| 6.3 | **Error states + boundaries** | New `ErrorBoundary.tsx`, error state components | Route-level error boundary with recovery CTA. API error handling with retry. Toast notifications (sonner) for errors/warnings only. | Phases 2-5 |
| 6.4 | **Motion layer** | Across all components | Card entrance animations (staggered fade-in). Pair unveiling animation. Button press feedback. Page transitions (subtle fade). Skeleton shimmer. Processing pulse. `prefers-reduced-motion` respect. | Phases 2-5 |
| 6.5 | **Product copy pass** | All screen and component files | Replace any remaining developer copy with product language. Verify all headings use Playfair Display. Verify overline pattern. Verify CTA copy. | Phases 2-5 |
| 6.6 | **Responsive pass** | All page and component files | Mobile breakpoint (<640px): single column, stacked pairs, hamburger nav. Tablet (640-1024px): adapted grid, full nav. Touch targets ≥44px. Pipeline rail vertical on mobile. | Phases 2-5 |
| 6.7 | **Accessibility pass** | All components | Keyboard navigation on all pickers and interactive elements. Focus rings (gold). ARIA labels on icons, status pills, interactive cards. Screen reader text for pipeline status. | 6.6 |

**Phase 6 definition of done:**
- Every page has a polished skeleton loading state
- Every page has a meaningful empty state with CTA
- Errors are caught and shown with recovery options
- Motion is restrained but present (entrances, hover, pair unveil)
- All copy is product-quality (no developer text)
- Mobile layouts work on iPhone/Android
- Keyboard navigation works on all interactive elements

---

## Implementation Constraints

### Non-negotiable rules for all phases

1. **Start each task from the latest `main`** after the previous task merges
2. **Never modify `@skygems/shared` contract types** during UI work — if the UI needs a different shape, add an adapter in the frontend
3. **Never add light-mode styles.** Dark mode only.
4. **Never use purple, blue, teal, or non-gold chromatic accents** (except status colors)
5. **Only ONE gold CTA per viewport.** If you need two actions, make one secondary.
6. **No sidebar navigation.** Top bar only.
7. **Preserve `useCreateDraftState` hook logic.** It's the correct state machine.
8. **Use TanStack Query for data fetching.** Not raw `useEffect` + `fetch`.
9. **Test each phase's build** before merging (`npm run build` must pass)
10. **Replace developer copy immediately** when building each component — don't leave it for Phase 6

### Merge cadence

Each numbered task (1.1, 1.2, etc.) is a single merge unit. Complete it, verify it, merge it to `main`, then start the next task from fresh `main`. No mega-merges.

### Dependencies that may block

| Blocker | Affects | Resolution |
|---|---|---|
| Figma design not approved | All implementation | Complete Phase 0 first |
| D1 database not provisioned | Tasks 2.5, 3.3, 3.5, 4.4, 5.3 (real endpoint wiring) | Use stub data during UI build; wire real endpoints in a separate pass |
| Auth not wired | All authenticated routes | Use stub auth context during UI build |
| TanStack Query not installed | Phases 3-5 | Add to `apps/web/package.json` in Phase 1 |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Design changes after Phase 1 starts | Medium | Rework in Phases 2-5 | Keep Phase 0 gate strict. Get explicit sign-off. |
| Pipeline stage content too long for expandable cards | Medium | Workspace page becomes unwieldy | Fall back to tab-based pipeline if card expansion exceeds 600px |
| Mobile layouts need more than a responsive pass | Low | Extra mobile-specific components | Design mobile explicitly in Figma (Page 12). Build mobile-first variants. |
| Team wants light mode later | Low | Theme rework | The token system supports it (all tokens are CSS variables). But dark-only for now. |
| Performance with large gallery | Low | Slow scrolling, high memory | Virtualized grid (react-window/tanstack-virtual) if gallery exceeds 100 items |

---

## Summary: Task Count by Phase

| Phase | Tasks | Primary deliverable |
|---|---|---|
| 0. Design approval | 3 | Approved Figma screens |
| 1. Foundation | 5 | App shell, routes, theme |
| 2. Home + Create | 5 | Entry flow (projects → config → generate) |
| 3. Results + Workspace | 5 | Core experience (pairs → select → workspace) |
| 4. Pipeline + Refine | 5 | Production depth (spec → tech → SVG → CAD) |
| 5. Gallery | 3 | Browse + library |
| 6. Polish | 7 | Loading, empty, error, motion, copy, responsive, a11y |
| **Total** | **33** | **Complete premium redesign** |

Each task is scoped to be completable in a single focused session without merge conflicts. The total represents a comprehensive redesign, not a patch — but each individual task is narrow and shippable.
