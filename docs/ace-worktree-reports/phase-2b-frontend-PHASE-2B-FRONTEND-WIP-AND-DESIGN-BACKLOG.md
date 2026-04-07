# Phase 2B: Frontend WIP Continuity & Elite UI Design Backlog

**Date:** 2026-04-05
**Worktree:** `phase-2b-skygems-frontend-wip-continuity-and-elite-ui-backlog-6z7`
**Status:** Planning/review only. No merge. No broad rewrites.
**Purpose:** Evaluate Phase 2A frontend progress, identify elite-quality gaps, produce actionable refinement backlog.

---

## 1. What I Inspected

### Source documents read

| Document | Location | Purpose |
|---|---|---|
| Phase 2A Frontend Migration Report | `phase-2a-frontend/.../PHASE-2A-FRONTEND-MIGRATION-REPORT.md` | What was built, what was carried forward, what remains stubbed |
| Phase 2A Backend Foundation Report | `phase-2a-backend/.../PHASE-2A-BACKEND-FOUNDATION-REPORT.md` | Backend contract state, what frontend can wire to next |
| Phase 1A UX/State Contract Pack | `phase-1a/.../PHASE-1A-UX-CONTRACT-PACK.md` | The locked product flow, route map, state machines, component specs |
| SkyGems Frontend Design Reference | Hermes context | Visual direction, quality bar, reuse rules |
| SkyGems Execution Policy | Hermes context | Merge cadence, carry-forward rules |
| Frontend Design Playbook (SKILL) | Hermes skills | Task briefing pattern, review checklist |
| Frontend Design Sources | Hermes skills | Reference source list |
| OpenArt Style Brief | Hermes skills | Premium creative-tool quality criteria |
| awesome-design-md (VoltAgent) | GitHub | 55 DESIGN.md files; 9-section design system standard |

### Code inspected directly

| Area | Worktree | Files read |
|---|---|---|
| Original frontend theme | This worktree (phase-2b) | `theme.css`, `fonts.css` |
| Original frontend layout | This worktree | `RootLayout.tsx` |
| Original frontend screens | This worktree | `LandingPage.tsx`, file listing of all screens |
| Phase 2A app shell | Phase 2A frontend worktree | `AppShell.tsx`, `ProjectLayout.tsx` |
| Phase 2A screens | Phase 2A frontend worktree | `CreateScreen.tsx`, `GenerationScreen.tsx`, `SelectedDesignScreen.tsx`, `GalleryScreen.tsx`, `SpecScreen.tsx` |
| Phase 2A reusable components | Phase 2A frontend worktree | `PairCardV1.tsx`, `FlowStepRail.tsx`, `JewelryTypePicker.tsx` |
| Phase 2A UI package theme | Phase 2A frontend worktree | `packages/ui/src/styles/theme.css` |

---

## 2. What Phase 2A Already Got Right

Phase 2A delivered the structural foundation correctly. These accomplishments should be preserved and built upon, not reworked:

### Architecture wins

1. **Canonical route tree implemented.** All 12 project-scoped routes from the Phase 1A contract are in place: `/app`, `/app/projects`, `/app/projects/:projectId`, `/app/projects/:projectId/create`, `/app/projects/:projectId/generations/:generationId`, `/app/projects/:projectId/designs/:designId`, plus `/spec`, `/technical-sheet`, `/svg`, `/cad`, and `/app/gallery`.

2. **Non-canonical routes removed.** The old `/app/preview/:id`, `/app/copilot`, and `/app/export` routes are gone. Navigation was correctly simplified to Projects / Gallery.

3. **Component extraction completed.** The create-flow monolith (`DesignGenerator.tsx`) was properly decomposed into `JewelryTypePicker`, `MetalPicker`, `GemstonePicker`, `StylePicker`, and `ComplexityControl` as reusable components.

4. **Pair-first result model implemented.** `PairCardV1` correctly models the sketch/render pairing with `pending`, `partial`, `ready`, `failed` states, skeleton placeholders, and selection gating per the Phase 1A contract.

5. **Status/state components extracted.** `FlowStepRail`, `GenerationStatusBanner`, `StageStatusPill`, `PromptPreviewStatusCard`, `SelectionSummaryPanel` all exist as reusable building blocks.

6. **Refine is contextual.** `RefineDrawer` lives on the selected design workspace, not a standalone chat route. This matches the locked product flow.

7. **Typed contract stubs and API adapters.** All frontend data shapes are typed against the Phase 1A contract, with async adapter functions ready for real backend wiring.

8. **`packages/ui` package created.** Shared primitives (`badge`, `button`, `card`, `input`, `progress`, `select`, `separator`, `sheet`, `skeleton`, `tabs`, `textarea`) and `ImageWithFallback` correctly extracted into a reusable package.

9. **Downstream stage shells structurally correct.** Spec, Technical Sheet, SVG, and CAD screens have the right data models, gating logic, and route boundaries even though they are shells.

10. **Prompt preview state model implemented.** `useCreateDraftState` hook handles `synced`/`override` prompt modes, debounced preview, reset-to-preview, and generation gating per the Phase 1A state machine.

### What these wins mean

The *information architecture* and *component structure* of the Phase 2A frontend are solid. Future work should refine the visual layer and interaction quality on top of this structure, not rework the structure itself.

---

## 3. Current Frontend Quality Assessment

### What is genuinely premium today

| Asset | Quality | Notes |
|---|---|---|
| **Original `theme.css` (this worktree)** | Excellent | Dark luxury palette (#0A0A0A, gold #D4AF37), comprehensive CSS variable system, proper spacing/radius/motion tokens, shadcn mapping |
| **Original `fonts.css`** | Excellent | Playfair Display (display) + Inter (body) loaded correctly |
| **Original `LandingPage.tsx`** | Excellent | Premium SaaS energy: glassmorphism nav, hero with gold accent typography, feature cards with hover effects, decorative gold glows, stats section, CTA with proper hierarchy |
| **Original `RootLayout.tsx`** | Very good | Collapsible sidebar, gold-accent active states, proper dark theme application |
| **Phase 2A `PairCardV1.tsx`** | Good structure | Correct pair model, sketch/render layout, status-aware states, skeleton fallbacks. Structurally right, visually needs elevation |
| **Phase 2A `FlowStepRail.tsx`** | Good structure | Correct step-by-step progression with numbered indicators and status pills. Functional, needs visual warmth |
| **Phase 2A create-flow components** | Good structure | Clean extraction, gold-accent selection states, icon-driven type pickers |

### What is structurally correct but visually placeholder

| Asset | Issue |
|---|---|
| Phase 2A `CreateScreen` | Left panel is clean but right panel is text-heavy with explanatory developer copy. CTA uses `purple-600 to blue-600` gradient instead of gold. No image/visual preview area |
| Phase 2A `GenerationScreen` | Correct polling shell and pair grid, but heading displays raw `generation.id` instead of contextual label. Empty state is a text card |
| Phase 2A `SelectedDesignScreen` | Correct action rail and lineage panel, but no hero pair viewer. Descriptive text reads like documentation |
| Phase 2A `SpecScreen` | Correct section structure with risk flags and missing-info display, but no visual richness — flat cards, no depth or motion |
| Phase 2A downstream screens (TechnicalSheet, SVG, CAD) | Structural shells with correct data models but minimal visual treatment |
| Phase 2A `GalleryScreen` | Correct grid + detail panel + project-context reopen, but gallery cards lack hover effects, image drama, or animation |

### Critical visual identity drift

**The Phase 2A migration changed the design direction from dark-luxury-gold to light-mode-purple.**

Evidence from the Phase 2A `packages/ui/src/styles/theme.css`:
- Default mode is now **light** (white backgrounds: `--bg-primary: #ffffff`)
- `--accent-gold` is mapped to **`#7c3aed`** (purple), not gold
- `--accent-gold-glow` is `rgba(124, 58, 237, 0.08)` (purple glow)
- Brand gradient uses `--sg-gradient: linear-gradient(135deg, #7c3aed, #3b82f6)` (purple-to-blue)
- The `CreateScreen` CTA button uses `bg-gradient-to-r from-purple-600 to-blue-600`
- Dark mode exists as a `.dark` class variant but is not the default

The original `theme.css` (this worktree) uses:
- Dark-first: `--bg-primary: #0A0A0A`, `--accent-gold: #D4AF37`
- True gold accents, gold glows, dark luxury palette
- No purple anywhere in the color system

**This is the single largest quality gap.** The SkyGems visual identity is dark luxury with gold. The Phase 2A migration preserved the token *names* but replaced the *values*. All future visual work must restore the original dark-luxury-gold direction.

---

## 4. Elite UI Gap Analysis

### Gap 1: Visual identity restoration (Critical)

| What exists | What's needed |
|---|---|
| Light-mode default with purple accents | Dark-mode default with gold (#D4AF37) accents |
| Purple CTA gradients | Gold-toned CTAs: solid gold, or subtle warm gradient |
| Generic SaaS feel | Premium jewelry studio energy |
| Light background cards | Dark elevated surfaces with subtle gold borders on focus/active |

**awesome-design-md guidance:** BMW's dark premium surfaces and Apple's cinematic restraint are the closest analogues. The 9-section standard requires explicit color-role definitions — SkyGems should define gold as the accent role, not purple.

### Gap 2: Hero and image-first surfaces (Critical)

| What exists | What's needed |
|---|---|
| No hero pair viewer on SelectedDesignScreen | Large, dramatic sketch/render pair display as the dominant surface element |
| Gallery cards without image drama | Image-first cards with hover overlays, aspect-ratio-controlled media, subtle zoom on hover |
| Text-heavy screens | Visual balance: images and data side by side, not text walls |

**OpenArt-style reference:** Premium creative tools lead with the generated content. The pair_v1 result should be the visual centerpiece, not a data table.

### Gap 3: Loading/skeleton/empty states (High)

| What exists | What's needed |
|---|---|
| `PairCardV1` has skeleton for missing media | Full skeleton loading sets for every screen: project list, create panel, generation grid, gallery grid, spec sections |
| `GenerationScreen` returns `null` while loading | Skeleton shell that preserves layout, shows step labels and card outlines |
| Empty states are minimal text | Premium empty states: centered icon, headline, descriptive text, primary CTA. Polished per the Phase 1A state matrix |
| No error boundaries | Error boundaries at route level with recovery CTAs |
| Sonner (toast) installed but unused | Toast notifications for generation submitted, selection confirmed, stage triggered, error recovery |

**awesome-design-md guidance:** Every component should define hover, active, disabled, focus, and loading states explicitly. Premium brands (Stripe, Superhuman) define state coverage per component.

### Gap 4: Typography and spacing discipline (High)

| What exists | What's needed |
|---|---|
| `.eyebrow` class used consistently | Good — preserve this pattern |
| Ad-hoc font sizes and weights across screens | Strict 6-level type scale (h1-h6, body, caption, overline) from the theme tokens, applied consistently |
| Playfair Display loaded but rarely used in Phase 2A screens | Playfair Display for display-level headings, Inter for body. The contrast creates luxury |
| Inconsistent padding/margins | Use the spacing token system (`--space-*`) consistently. Premium brands use notably generous whitespace as a luxury signal |

### Gap 5: Motion and micro-interactions (Medium)

| What exists | What's needed |
|---|---|
| Motion tokens defined in theme (`--ease-*`, `--duration-*`) | These tokens actually used in component transitions |
| Original LandingPage has entrance animations | Extend entrance animations to dashboard-level screens |
| Page transitions are instant | Subtle cross-fade or slide transitions between route changes |
| Card hovers are basic | Controlled hover elevation: border brightens, subtle shadow, slight scale (1.005-1.01), using motion tokens |
| No generation progress animation | Skeleton pulse + progress bar + status text animation during polling |

**OpenArt-style reference:** Motion used for confidence and clarity, not decoration. Generate-pair submission should feel like launching something valuable. Pair card arrival should feel like an unveiling.

### Gap 6: Developer copy in UI surfaces (Medium)

| What exists | What's needed |
|---|---|
| "This shell aligns to the locked Phase 1A rule..." | Real product copy: "Structured design specification" → "Your design blueprint" or similar |
| "Retry when backend is wired" | "Generation failed — Retry" |
| "Polling is represented by placeholder generation payloads" | Clean status messaging: "Generating your designs..." |
| "Canonical supported types only" | Simply "Jewelry Type" |
| Raw generation IDs as headings | "Generation #1" or contextual label |

### Gap 7: Premium component depth (Medium)

| Component | Current | Elite target |
|---|---|---|
| `PairCardV1` | Flat card with border | Elevated card with subtle shadow, hover lift, gold selection ring, image zoom on hover |
| `FlowStepRail` | Numbered list with pills | Connected step indicator (vertical line between steps), completed step checkmarks, pulse on active |
| Create-flow pickers | Grid buttons with color change | Pickers with subtle shine/gradient on selected state, icon animation on selection |
| `StageStatusPill` | Colored badge | Pill with dot indicator and contextual animation (pulse for processing, check for ready) |
| Gallery cards | Basic image + text | Image-first with gradient overlay on hover, quick-action buttons (open, like), metadata as pills |

### Gap 8: Responsive behavior (Low priority but tracked)

| What exists | What's needed |
|---|---|
| Desktop-first layouts | Responsive breakpoints for tablet and mobile defined |
| FlowStepRail is 290px fixed sidebar | Collapsible on smaller viewports |
| Pair cards use `md:grid-cols-2` | Verified mobile stacking with maintained pair grouping per Phase 1A rule |

---

## 5. Protected Reusable Assets

These assets are strong and must not be discarded or degraded during refinement:

### Must protect as-is

| Asset | Location | Why |
|---|---|---|
| Original `theme.css` dark luxury tokens | This worktree: `src/styles/theme.css` | The gold-on-dark token system is production-quality and correctly maps to shadcn. The Phase 2A purple replacement must be reverted to this |
| Original `fonts.css` | This worktree: `src/styles/fonts.css` | Playfair Display + Inter is the correct premium pairing |
| `ImageWithFallback` | Both worktrees | Small, correct, SVG-fallback media utility |
| `variationEngine.ts` domain axes | Both worktrees | Structured randomness for jewelry variations — domain vocabulary, not UI logic |
| `promptGenerator.ts` composition-first structure | Both worktrees | Reference logic and local fallback for design vocabulary |

### Must protect structure, refine visuals

| Asset | Location | Why |
|---|---|---|
| Phase 2A canonical route tree | Phase 2A frontend worktree: `routes.tsx` | Matches the locked Phase 1A contract exactly |
| Phase 2A `PairCardV1` | Phase 2A frontend worktree | Correct pair model, state handling, footer actions. Needs visual elevation |
| Phase 2A `FlowStepRail` | Phase 2A frontend worktree | Correct step model, active highlighting, status pills. Needs visual richness |
| Phase 2A `PromptPreviewStatusCard` | Phase 2A frontend worktree | Correct synced/override state model. Needs gold-accent styling |
| Phase 2A `GenerationStatusBanner` | Phase 2A frontend worktree | Correct status mapping. Needs animation and premium treatment |
| Phase 2A `StageStatusPill` | Phase 2A frontend worktree | Correct status-to-color mapping. Needs dot indicator and motion |
| Phase 2A `useCreateDraftState` hook | Phase 2A frontend worktree | Correct state machine for create flow |
| Phase 2A typed contracts and API adapters | Phase 2A frontend worktree | Correct shapes aligned to Phase 1A contract |
| Phase 2A `AppShell` sidebar structure | Phase 2A frontend worktree | Correct simplified nav (Projects, Gallery). Needs gold accent restoration |
| Phase 2A `ProjectLayout` with `FlowStepRail` | Phase 2A frontend worktree | Correct nested layout with contextual step sidebar |
| Phase 2A `RefineDrawer` contextual placement | Phase 2A frontend worktree | Correct: refine on design workspace, not standalone route |

### May discard from original frontend

| Asset | Reason |
|---|---|
| `AICoPilot.tsx` | Non-canonical standalone route. Refine is now contextual |
| `DesignPreview.tsx` | Replaced by selected design workspace |
| `storageService.ts` | localStorage persistence replaced by API-backed state |
| Old `routes.tsx` nav model | Dashboard/Create/Gallery/Copilot/Export replaced by Projects/Gallery |
| Unused shadcn components (14 identified in Phase 1A) | Dead weight; listed in Phase 1A Appendix C |

---

## 6. WIP Refinement Backlog (Priority Order)

Each item is scoped to be completable in a single Claude task without merge chaos. Items are ordered by impact on perceived quality and risk of drift.

### Priority 1: Visual identity restoration

**Task:** Restore the dark-luxury-gold theme as default in the Phase 2A `packages/ui/src/styles/theme.css`

**Scope:**
- Replace the light-mode-first tokens with the original dark-first token set from this worktree's `theme.css`
- Restore `--accent-gold: #D4AF37` and all gold variants
- Remove purple brand gradient (`--sg-gradient`, `--sg-purple`, `--sg-blue`)
- If light/dark toggle is desired later, make dark the default and light the opt-in variant
- Verify all Phase 2A components that use `var(--accent-gold)` now render gold, not purple
- Replace `from-purple-600 to-blue-600` CTA gradients with gold-toned buttons
- Restore Playfair Display usage for display-level headings

**Why first:** Everything else looks wrong until the color identity is right. Every subsequent visual task compounds on top of this.

**Contract alignment:** Design reference mandates "dark luxury foundation, gold accent system."

### Priority 2: Hero pair viewer on SelectedDesignScreen

**Task:** Add a large, dramatic sketch/render pair display as the dominant visual element on the selected design workspace.

**Scope:**
- Add a hero section above the action rail showing the sketch (left) and render (right) at generous size
- Use `ImageWithFallback` with aspect-ratio-controlled containers
- Add subtle gold border on the hero container
- Keep the existing action rail, refine drawer, and lineage panel below
- Replace developer copy with product copy

**Why second:** The selected design workspace is the emotional center of the product. Without a hero pair viewer, it feels like a data dashboard instead of a creative control room.

**Contract alignment:** Phase 1A Section 6 requires "Hero pair viewer showing the selected sketch/render pair" as the first surface area.

### Priority 3: Premium loading/skeleton states

**Task:** Implement skeleton loading sets for the five most-visited screens: ProjectsIndex, CreateScreen, GenerationScreen, SelectedDesignScreen, GalleryScreen.

**Scope:**
- Replace `return null` loading returns with skeleton shells that preserve layout structure
- Add skeleton pair cards in GenerationScreen (fixed two-up layout visible during loading)
- Add skeleton project cards in ProjectsIndex
- Add skeleton gallery cards in GalleryScreen
- Add skeleton prompt panel in CreateScreen
- Wire sonner `<Toaster />` to the AppShell for toast notifications
- Add error boundary at the route level with a recovery CTA

**Why third:** Loading states are the first thing users see on every interaction. Generic blank screens during loading destroy premium perception instantly.

**Contract alignment:** Phase 1A Section 9 specifies skeleton-first loading for every screen with a detailed state matrix.

### Priority 4: PairCardV1 visual elevation

**Task:** Upgrade `PairCardV1` from structurally correct to visually premium.

**Scope:**
- Add subtle shadow depth (use gold-tinted shadow for selected state)
- Add hover elevation: border brightens to `rgba(255,255,255,0.12)`, slight scale (1.005)
- Add gold selection ring: `box-shadow: 0 0 0 2px rgba(212,175,55,0.5)` on selected
- Add image zoom on hover (scale 1.02 with overflow hidden)
- Add pulse animation on `pending` status skeleton
- Replace "Retry when backend is wired" with "Generation failed — Retry"
- Add entrance animation (fade-in with slight upward translate) when card appears during polling

**Why fourth:** Pair cards are the signature visual element. Every generation result, every selection interaction, every gallery browse runs through this component.

**Contract alignment:** Phase 1A Section 6 defines `pair_v1` as the canonical result object. OpenArt brief demands "pair-first result cards with dramatic but controlled presentation."

### Priority 5: Developer copy cleanup

**Task:** Replace all developer/documentation copy in Phase 2A screens with product copy.

**Scope:**
- `CreateScreen`: "Configure parameters on the left..." → "Design your next piece" / contextual heading
- `GenerationScreen`: Raw generation ID heading → "Generation #N" or "Your designs are generating..."
- `GenerationScreen`: "Polling is represented by placeholder..." → clean status messaging
- `SelectedDesignScreen`: "Refine is now contextual to the design workspace..." → product-level description
- `SpecScreen`: "This shell aligns to the locked Phase 1A rule..." → "Your design blueprint"
- `GalleryScreen`: "Secondary browse and reopen surface" → "Design Gallery" / "Browse your collection"
- `JewelryTypePicker`: "Canonical supported types only" → "Choose your piece"
- `PairCardV1`: "Retry when backend is wired" → "Retry"
- All similar patterns across TechnicalSheet, SVG, CAD screens

**Why fifth:** Developer copy signals "prototype." Product copy signals "real product." This is a fast, high-impact cleanup.

### Priority 6: FlowStepRail visual enrichment

**Task:** Upgrade the flow step rail from numbered list to a premium progression indicator.

**Scope:**
- Add a vertical connecting line between steps (thin, gold-tinted when completed)
- Replace numbered circles with checkmarks for completed steps
- Add subtle pulse animation on the current active step
- Add disabled visual treatment for steps that are gated (prerequisites not met)
- Increase spacing for breathing room
- Consider gold gradient fill on the active step number circle

**Contract alignment:** Premium creative tools show clear progression. The rail is visible on every project-scoped route.

### Priority 7: Gallery visual upgrade

**Task:** Upgrade gallery cards and the detail panel to image-first premium quality.

**Scope:**
- Add gradient overlay on gallery card hover (dark gradient from bottom, revealing design name and quick actions)
- Add hover image zoom (scale 1.03)
- Add like/open quick-action buttons visible on hover
- Add entrance animation for gallery grid items (staggered fade-in)
- Improve detail panel with larger image, better typography hierarchy
- Add metadata as styled pills instead of plain text

**Why here:** Gallery is secondary but still a product surface. Premium gallery UX reinforces brand quality.

### Priority 8: Downstream stage screen polish (Spec, TechnicalSheet, SVG, CAD)

**Task:** Apply visual richness to downstream stage shells while preserving their correct data models.

**Scope:**
- Add card depth (subtle shadows, border refinements)
- Add section headers with gold accent indicators
- Add status indicators with dot + color + animation for processing states
- Add proper stale-state banners (gold-warning tone)
- Replace flat data rows with slightly elevated rows on hover
- `SpecScreen`: Add severity-colored risk flag indicators (blocking=red, warning=amber, info=blue)
- `TechnicalSheetScreen`: Add section collapse/expand with smooth animation
- `SvgScreen`: Add view tab switcher with gold active indicator
- `CadScreen`: Add per-format progress indicators and download buttons with states

### Priority 9: Create-flow picker polish

**Task:** Upgrade picker components from functional to delightful.

**Scope:**
- Add subtle shine/gradient on selected state (gold-tinted top highlight)
- Add icon animation on selection (brief scale bounce using `--ease-spring`)
- Add keyboard navigation support
- Improve metal picker to show actual metal color swatches (gold circle, silver circle, etc.)
- Add complexity slider with gold-filled track
- Add gemstone picker with gem-colored indicators

### Priority 10: Motion and transition layer

**Task:** Add a consistent motion layer using the existing motion tokens.

**Scope:**
- Add page transition animations (subtle fade or slide using `motion/react`)
- Add card entrance animations (staggered appear) for list/grid screens
- Add button press feedback (`whileTap: { scale: 0.98 }`)
- Add generation submission celebration micro-interaction
- Add pair card arrival animation during polling (fade-in + slight upward translate)
- Keep all motion restrained — confidence and clarity, not decoration

---

## 7. Recommended Next Claude Task

**Task: Dark-luxury-gold theme restoration + hero pair viewer**

Combines Priority 1 and Priority 2 into a single focused task because they are the two highest-impact changes and are independent of backend wiring.

### Task brief

**Goal:** Restore SkyGems to its dark-luxury-gold visual identity in the Phase 2A frontend branch, and add the hero pair viewer to the selected design workspace.

**Files to modify:**
- `packages/ui/src/styles/theme.css` — restore original gold tokens
- `apps/web/src/app/screens/SelectedDesignScreen.tsx` — add hero pair viewer
- `apps/web/src/app/screens/CreateScreen.tsx` — replace purple CTA with gold
- Any component referencing purple gradient classes

**Reference:**
- Original `theme.css` from this worktree as the gold-standard token set
- Phase 1A Section 6 for hero pair viewer requirements
- OpenArt brief for visual quality bar
- awesome-design-md BMW/Apple entries for dark premium surface treatment

**Constraint:**
- Preserve all Phase 2A structural wins (routes, components, state models, contract alignment)
- Only modify visual layer — do not change component boundaries or data models
- Keep all existing functionality working

**Definition of done:**
- Theme defaults to dark mode with gold (#D4AF37) accents
- No purple gradients remain in component code
- Selected design screen shows a dramatic sketch/render hero above the action rail
- Vite build passes

---

## 8. Risks / Drift Watchouts

### Risk 1: Theme restoration breaks component styling

**What could go wrong:** Replacing the purple-based token values with gold-based values may break components that were styled specifically for the purple color system (e.g., purple-on-white hover states that don't work as gold-on-dark).

**Mitigation:** The Phase 2A components primarily use `var(--accent-gold)` and `var(--text-*)` references, which are token-name stable. The token values change but the consumption pattern doesn't. Verify with a build + visual review after restoration.

### Risk 2: Visual refinement creeps into structural changes

**What could go wrong:** While improving PairCardV1 visually, a developer might also restructure the pair data model or change the selection flow.

**Mitigation:** Each backlog item explicitly states "preserve structural wins" and scopes changes to the visual layer only. The Phase 1A contract is the guard rail — if a change would alter route behavior, state transitions, or data shapes, it's out of scope.

### Risk 3: Backend wiring lands before visual identity is restored

**What could go wrong:** If the next task wires real API data against the purple-themed frontend, it becomes harder to justify a visual overhaul because "it works."

**Mitigation:** Visual identity restoration is Priority 1. Do it before any backend wiring integration. The purple theme was an implementation drift, not a design decision.

### Risk 4: Developer copy hardens into product copy

**What could go wrong:** Explanatory text like "This shell aligns to the locked Phase 1A rule" gets deployed as the actual user-facing text because no one cleans it up.

**Mitigation:** Priority 5 (developer copy cleanup) is explicitly tracked and scoped. It's a fast, low-risk task that should be done early.

### Risk 5: Downstream stage screens stay as empty shells permanently

**What could go wrong:** Spec, TechnicalSheet, SVG, and CAD screens have correct structure but minimal visual quality. If visual polish only targets the create-to-select flow, the downstream experience degrades.

**Mitigation:** Priority 8 explicitly targets downstream stages. These can be done incrementally but must happen before any public demo or user testing.

### Risk 6: Monorepo reconciliation

**What could go wrong:** The Phase 2A backend worktree also created `apps/web` (by moving the original frontend). The Phase 2A frontend worktree created a NEW `apps/web`. These two `apps/web` directories may conflict on merge.

**Mitigation:** Before merging, reconcile the two `apps/web` implementations. The Phase 2A frontend's `apps/web` should be the canonical frontend; the backend worktree's `apps/web` was a structural move of the old code.

### Risk 7: awesome-design-md DESIGN.md pattern not yet adopted

**What could go wrong:** The awesome-design-md repo documents a 9-section DESIGN.md standard (Visual Theme, Color Palette, Typography, Component Stylings, Layout, Depth, Do's/Don'ts, Responsive, Agent Prompt Guide). SkyGems doesn't have one yet.

**Mitigation:** Creating a `DESIGN.md` for SkyGems is a future task, not a blocker. The existing `theme.css` + design reference doc + this backlog serve the same purpose in the short term. When the visual identity is stable, codify it as a formal DESIGN.md.

### Risk 8: Playfair Display underuse

**What could go wrong:** The font is loaded but Phase 2A screens use Inter for everything. The luxury typographic contrast (serif display + sans body) that makes the original LandingPage feel premium is missing from the app shell.

**Mitigation:** Tracked in Priority 1 (theme restoration). Display-level headings (h1, h2 on screens) should use Playfair Display. Body text, labels, and controls stay Inter.

---

## Summary

Phase 2A built the right structure. The routes, components, state models, and contract alignment are solid. The gap is entirely in the **visual and interaction layer**: the theme drifted to purple-on-light, screens have developer copy instead of product copy, loading states are minimal, and the premium image-first / dark-luxury / gold-accent identity was lost.

The backlog is ordered to restore identity first (theme + hero viewer), then build quality from the most-visited surfaces outward (loading states → pair cards → gallery → downstream stages → motion). Every item preserves the Phase 2A structural wins and stays aligned to the locked Phase 1A product flow.

No merges were made. No broad code was rewritten. This report is a map for the next 8-10 focused frontend refinement tasks.
