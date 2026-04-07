# SkyGems Phase 1A UX/State Contract Pack

**Date:** 2026-04-05  
**Author:** Claude (Phase 1A Contract Lock)  
**Branch:** `emdash/phase-1a-skygems-ux-state-contract-and-flow-lock-3cf`  
**Status:** Source of truth for frontend implementation  
**Scope:** Frontend information architecture, route map, UX/state contracts, and reuse decisions  
**Rule of precedence:** Official SkyGems flow and API/state concepts override current screen shapes when they conflict

## 1. What I inspected

Required artifacts:
- `PHASE-0-FRONTEND-AUDIT.md`
- `PHASE-0-BACKEND-PLATFORM-AUDIT.md`
- `2026-04-05_022900-skygems-master-execution-plan.md`

Current frontend files inspected directly:
- `src/app/routes.tsx`
- `src/app/layouts/RootLayout.tsx`
- `src/app/screens/Dashboard.tsx`
- `src/app/screens/DesignGenerator.tsx`
- `src/app/screens/DesignGallery.tsx`
- `src/app/screens/DesignPreview.tsx`
- `src/app/screens/AICoPilot.tsx`
- `src/app/screens/CADExport.tsx`
- `src/app/services/storageService.ts`
- `src/app/services/variationEngine.ts`
- `src/app/utils/promptGenerator.ts`
- `src/styles/theme.css`
- `package.json`
- `README.md`

Key facts confirmed from inspection:
- The current app is a Vite/React UI shell with no backend, no auth, and localStorage-only persistence.
- 67 source files total: 63 TypeScript/TSX + 4 CSS. Single Vite app, no monorepo, no workspaces, no wrangler.toml.
- Stack: React 18 + TypeScript (strict) + Vite 6 + Tailwind CSS v4 + React Router v7 + Motion + Radix/shadcn + Lucide.
- The current route tree is centered on `dashboard / create / gallery / preview / copilot / export`, which drifts from the official product flow.
- The existing `DesignGenerator` already contains the two strongest reusable UX ideas for Phase 1A:
  - structured design inputs (type, metal, gemstones, style, complexity selectors)
  - an editable prompt-preview area
- The existing screens are mostly mockups with hardcoded data and should not be treated as behavioral truth.
- The copied shadcn/ui library exists (46 component files), but the actual screens barely use it; most current screens are hand-built markup and inline styles.
- No state management beyond `useState`. No API client. No React Query/SWR. No error boundaries.
- Design system is production-quality: dark luxury palette (#0A0A0A→#2A2A2A backgrounds, #D4AF37 gold accent), Playfair Display + Inter typography, well-structured CSS custom properties in `theme.css`.
- 4 dead MUI/Emotion dependencies installed but never imported. Multiple unused shadcn components shipped.
- Backend audit confirms 100% greenfield: no D1, no R2, no Queues, no auth, no Workers, no deployment config. But proposes D1 schema (8 tables), API contracts, queue payloads, and workflow boundaries that inform this UX contract.
- Master execution plan defines 10 official API endpoints that differ from the backend audit's proposed surface in several places (see Section 2).

## 2. Reconciliation decisions made

### API surface alignment

The backend audit proposed API endpoints that drift from the master plan's official public API target. This contract aligns to the master plan in all cases.

| Official API (master plan) | Backend audit proposed | Decision |
|---|---|---|
| `POST /v1/prompt-preview` | Not included | **Add.** Prompt preview is a first-class step. Frontend must call this before generate. |
| `POST /v1/generate-design` | `POST /v1/generate` | **Use official name.** `generate-design` is the canonical endpoint. |
| `GET /v1/generations/:generationId` | `GET /v1/jobs/:id` | **Use official name.** Generations are a domain concept, not generic jobs. The frontend polls `generations/:generationId`. |
| `POST /v1/designs/:designId/spec` | Bundled into workflow | **Keep as separate endpoint.** Spec is a distinct user-triggered action. |
| `POST /v1/designs/:designId/technical-sheet` | Bundled into workflow | **Keep as separate endpoint.** UI triggers and polls independently. |
| `POST /v1/designs/:designId/svg` | Bundled into workflow | **Keep as separate endpoint.** Same reasoning. |
| `POST /v1/designs/:designId/cad` | `POST /v1/designs/:id/export` | **Use official name.** `/cad` not `/export`. |
| `POST /v1/gallery/search` | Not included | **Add.** Gallery search is a distinct API call. |
| `GET /v1/projects/:projectId` | Not included | **Add.** Projects are workspaces. UI needs to load project context. |

### Product flow and model decisions

1. The canonical product flow is locked as:
   `Create -> Generate Pair -> Select -> Spec -> Technical Sheet -> SVG -> CAD`

2. The frontend must be project-scoped.
   A project is the saved workspace container for one exploration thread. It is not an agent instance, chat session, or long-lived AI runtime.

3. The canonical route model is project-first.
   Core flow routes include `projectId` in the URL. This keeps workspace state stable across refresh, sharing, polling, and downstream artifact review.

4. Prompt preview is mandatory before generation.
   The create screen must model `prompt-preview` as a first-class state before `generate-design`. The current local prompt builder is reference logic only, not the canonical source of truth once the endpoint exists.

5. `generate-design` is fast enqueue, not synchronous generation.
   Clicking Generate Pair immediately creates or resumes a generation session and routes to a generation polling screen keyed by `generationId`.

6. Generation results are always standardized pair candidates.
   The unit of presentation is not a single image. It is one sketch/render pair tied to a shared `design_dna`. Selection happens at pair level.

7. Refine is contextual, not a standalone AI chat product surface.
   The current `AICoPilot` route is non-canonical. Refine belongs on the selected design workspace and sends the user back through generation polling with a new generation session.

8. Selection is singular at project level.
   A project may contain many generated designs, but only one design is the active selected design for the downstream production lane at a time.

9. Downstream stages are gated and versioned.
   `Spec`, `Technical Sheet`, `SVG`, and `CAD` are separate stages with explicit prerequisites. Changing the selected design or approving a new spec marks downstream outputs stale until regenerated.

10. The current `preview`, `copilot`, and standalone `export` screen shapes are replaced in the canonical IA.
    Their route positions and behaviors do not survive Phase 1A, though some layout ideas and selector patterns do.

11. `pair_v1` and `tech_v1` are locked in UX terms here.
    Frontend implementation should treat these standards as source of truth even if the visual styling is refined later.

12. Gallery remains secondary.
    It is not part of the primary create-to-cad path. It stays as a browse/search utility, not the main work surface.

## 3. Canonical route map

### Primary routes

| Route | Screen | Role in product |
|---|---|---|
| `/` | Marketing / landing | Public shell only. Not authoritative for app flow. |
| `/app` | Workspace resolver | Resolve last active project or show projects index. |
| `/app/projects` | Projects index | List, create, and open saved workspaces. |
| `/app/projects/:projectId` | Project workspace home | Resume project, inspect current selection, jump into flow. |
| `/app/projects/:projectId/create` | Create | Structured inputs + prompt preview + prompt override + Generate Pair. |
| `/app/projects/:projectId/generations/:generationId` | Generate Pair / Select | Poll generation, render pair cards, select a candidate. |
| `/app/projects/:projectId/designs/:designId` | Selected design workspace | Inspect active pair, refine, and launch downstream stages. |
| `/app/projects/:projectId/designs/:designId/spec` | Spec | Generate/review/approve structured spec data. |
| `/app/projects/:projectId/designs/:designId/technical-sheet` | Technical Sheet | Manufacturing-facing technical packet review. |
| `/app/projects/:projectId/designs/:designId/svg` | SVG | Review generated vector views and annotations. |
| `/app/projects/:projectId/designs/:designId/cad` | CAD | Select formats, track jobs, download CAD outputs. |
| `/app/gallery` | Gallery | Secondary tenant-wide search and browse surface. |

### Redirects and non-canonical routes

- `/app/create` may exist only as a helper that creates or resumes a draft project and redirects to `/app/projects/:projectId/create`.
- `/app/preview/:id` is removed from the canonical map and replaced by `/app/projects/:projectId/designs/:designId`.
- `/app/copilot` is removed from the canonical map. Refine lives inside the selected design workspace.
- `/app/export` is removed from the canonical map. CAD export is contextual to the selected design and lives at `/cad`.

### Navigation contract

Primary navigation:
- Projects
- Create
- Gallery

Contextual progression inside a project:
- Create
- Generate Pair
- Select
- Spec
- Technical Sheet
- SVG
- CAD

Non-canonical as top-level nav items:
- AI Assistant
- CAD Exports
- Preview

## 4. Screen inventory and responsibilities

| Screen | Objective | Primary user actions | Entry condition | Exit condition |
|---|---|---|---|---|
| Workspace resolver | Put the user into a valid project context fast | Open last project, create project, recover from missing project | User enters `/app` | Redirect to projects index or project home |
| Projects index | Manage saved workspaces | Create project, rename, open, archive later | Authenticated user with tenant context | Project opened |
| Project workspace home | Resume the active project lane | Rename project, open current selected design, resume latest generation, start new create flow | Valid `projectId` | User enters a specific flow step |
| Create | Collect structured jewelry inputs and show prompt preview before enqueue | Change type/metal/gems/style/complexity, refresh preview, edit prompt, reset prompt, generate pair | Valid project | `generate-design` enqueued and `generationId` returned |
| Generate Pair / Select | Show generation progress and pair candidates | Poll, inspect pair cards, retry failed generation, select pair, return to create | Valid `projectId` and `generationId` | One pair selected or user returns |
| Selected design workspace | Hold the active project selection and all contextual next actions | Inspect sketch/render pair, open refine panel, launch spec, swap selection from lineage/history | Valid selected `designId` | User refines or proceeds to spec |
| Spec | Produce and approve structured design spec data | Start spec, fill missing inputs, accept spec version, retry, go back to selected design | Selected design exists | Approved spec version exists |
| Technical Sheet | Present manufacturing-readable technical output | Review sections, inspect flags, regenerate from approved spec, continue to SVG | Approved spec exists | Technical sheet ready and accepted |
| SVG | Review vector views from technical data | Switch views, zoom, review annotations, download SVG, regenerate, continue to CAD | Technical sheet ready | SVG ready and accepted |
| CAD | Manage asynchronous export jobs and downloads | Select formats, enqueue CAD, inspect per-format status, download ready artifacts, retry failed formats | SVG ready | Desired CAD outputs complete |
| Gallery | Secondary search and reopen utility | Search, filter, open a design inside project context | Authenticated user | Design opened in workspace |

### Screen boundary rules

Create:
- Owns structured input editing and prompt preview only.
- Does not show generated results inline once `generate-design` is called.

Generate Pair / Select:
- Owns generation polling and pair selection only.
- Does not own spec editing or CAD export.

Selected design workspace:
- Owns selection state, lineage, and refine entry.
- Does not own full spec/technical-sheet editing.

Spec:
- Owns structured design intent and missing-info completion.
- Is editable.

Technical Sheet:
- Owns manufacturing-facing display from approved spec.
- Is review-first, not freeform editing.

SVG:
- Owns vector review, views, and annotation inspection.
- Is not a geometry editor.

CAD:
- Owns format selection, job tracking, QA/download state.
- Is not a 3D preview theater or generic export center.

## 5. UX/state machine for each phase of the flow

### Canonical UI entities

```ts
type PromptMode = 'synced' | 'override'
type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed'
type PairStatus = 'pending' | 'partial' | 'ready' | 'failed'
type StageStatus = 'absent' | 'queued' | 'processing' | 'ready' | 'failed' | 'stale'

interface ProjectWorkspace {
  projectId: string
  name: string
  currentGenerationId?: string
  selectedDesignId?: string
}

interface CreateDraftState {
  projectId: string
  inputRevision: number
  promptMode: PromptMode
  promptValue: string
  previewStatus: 'idle' | 'loading' | 'ready' | 'error'
  previewRevision?: number
}

interface PairCandidate {
  designId: string
  designDna: string
  status: PairStatus
  sketchArtifactUrl?: string
  renderArtifactUrl?: string
  sourceGenerationId: string
}
```

### Project / workspace model in the UI

Locked model:
- A tenant may have many projects.
- The UI has one active project context at a time.
- A project owns:
  - the current create draft
  - generation history
  - saved pair candidates
  - one active selected design
  - downstream stage statuses and artifacts for that selected design

Behavior rules:
- Starting a new flow always creates a project first or resumes a draft project.
- The selected design is a project property, not a global user property.
- Opening a design from Gallery should restore the design inside its project context whenever possible.
- The UI should never describe a project as an agent, assistant, or autonomous run.

### Phase A: workspace entry

States:
- `workspace_resolving`
- `workspace_empty`
- `workspace_ready`
- `workspace_error`

Rules:
- `/app` never strands the user on a blank shell.
- If a last active project exists, redirect into it.
- If no project exists, show a first-run projects empty state with one primary CTA: `Create Project`.
- Project creation should be lightweight. Auto-name is acceptable; renaming can happen inline after entry.

### Phase B: create + prompt preview

States:
- `draft_pristine`
- `draft_dirty`
- `preview_loading`
- `preview_ready`
- `preview_error`
- `prompt_override`
- `generate_submitting`

Transitions:
- Any structured input change increments `inputRevision`.
- Input change triggers a debounced `prompt-preview` request.
- Successful preview sets:
  - `previewStatus = ready`
  - prompt text is replaced only when `promptMode = synced`
- Manual prompt edit flips `promptMode` to `override`.
- `Reset to Preview` returns the prompt to the latest server preview and restores `promptMode = synced`.

Locked UX rules:
- Generate Pair is disabled until one of these is true:
  - latest prompt preview is ready for the current input revision
  - prompt override is active and the user acknowledges that generation will use the edited prompt
- When prompt preview fails, the create form remains editable and the prompt panel shows a retry state without discarding user text.
- The right-hand create surface is prompt-centric, not results-centric.

### Phase C: generate pair + polling

States:
- `enqueueing`
- `queued`
- `processing`
- `partial_results`
- `completed`
- `failed`

Polling rules:
- `POST /v1/generate-design` should return quickly with `generationId`.
- Frontend routes immediately to `/generations/:generationId`.
- Poll by `generationId`.
- Poll every 2 seconds while there is no ready pair, then every 3 to 5 seconds once partial results exist.
- Stop polling only when generation is terminal: `completed` or `failed`.
- On transient poll failure, keep last good payload on screen and show a reconnect banner; do not blank the results grid.

Result rules:
- A generation result set is a list of pair candidates, never a flat image grid.
- Pair cards may enter progressively.
- Selection is allowed only when pair status is `ready`.
- If the generation finishes with zero ready pairs, treat it as a failed generation state.

### Phase D: select + refine

States:
- `no_selection`
- `selection_ready`
- `selection_swap_confirm`
- `refine_drafting`
- `refine_submitting`
- `refine_redirecting`

Rules:
- One project may hold many generated designs, but only one `selectedDesignId`.
- Selecting a pair stores it as the project selection and routes to the selected design workspace.
- Refinement starts from the selected design, not from a freeform chat route.
- Refine UI consists of:
  - preset refinement chips
  - optional freeform instruction
  - optional prompt text edit
- Submitting refine should create a new generation session and send the user back to the generation route in refine mode.

Invalidation rule:
- If the user replaces the selected design after downstream stages exist, the UI must mark downstream outputs `stale` and require confirmation before the swap completes.

### Phase E: spec

States:
- `spec_absent`
- `spec_generating`
- `spec_review`
- `spec_needs_input`
- `spec_approved`
- `spec_failed`

Rules:
- Spec is the first structured production surface after selection.
- If the generated spec has missing fields or risk flags, the screen enters `spec_needs_input`.
- The user may correct missing fields here.
- Technical Sheet is locked until there is an approved spec version.

### Phase F: technical sheet

States:
- `tech_absent`
- `tech_generating`
- `tech_ready`
- `tech_failed`
- `tech_stale`

Rules:
- Technical Sheet is derived from the approved spec and is not the primary editing surface.
- If severe issues are found, the fix path goes back to Spec, not ad hoc edits on the Technical Sheet screen.
- SVG is locked until Technical Sheet is ready.

### Phase G: SVG

States:
- `svg_absent`
- `svg_generating`
- `svg_ready`
- `svg_failed`
- `svg_stale`

Rules:
- SVG screen must support multiple named views at minimum:
  - front
  - side
  - top
- The surface is for review and annotation inspection, not geometry editing.
- CAD is locked until SVG is ready.

### Phase H: CAD

States:
- `cad_idle`
- `cad_formats_selected`
- `cad_queued`
- `cad_processing`
- `cad_partial_ready`
- `cad_ready`
- `cad_failed`
- `cad_stale`

Rules:
- CAD is asynchronous and per-format aware.
- A single CAD screen may show mixed status by format:
  - ready for SVG
  - processing for STEP
  - failed for STL
- Retrying failed formats should not force redownloading formats that already succeeded.

### Cross-stage gating

The UI must enforce this progression:
- `Create` requires a valid project.
- `Generate Pair` requires an enqueued generation.
- `Select` requires at least one ready pair.
- `Spec` requires a selected design.
- `Technical Sheet` requires an approved spec.
- `SVG` requires a ready technical sheet.
- `CAD` requires a ready SVG.

## 6. Pair card and selected design interaction model

### `pair_v1` UX standard

The standard pair card is the canonical result object for generation and refine output.

Required card structure:
- Header:
  - Pair index, for example `Pair 01`
  - short `design_dna` chip
  - status badge
- Body:
  - fixed two-up media layout
  - left slot is always `Sketch`
  - right slot is always `Render`
  - both slots keep the same aspect ratio
- Footer:
  - jewelry type / metal / style summary chips
  - primary action: `Select Pair`
  - secondary action: `Open`
  - error state action when relevant: `Retry`

Card states:

| State | Display rule | Select allowed |
|---|---|---|
| `pending` | Both panes are skeletons with labels visible | No |
| `partial` | Ready asset shown, missing asset pane remains skeleton/error placeholder | No |
| `ready` | Sketch + render both shown | Yes |
| `selected` | Uses selected border/tone and project-selected badge | Already selected |
| `failed` | Full-card failed state with reason and retry CTA | No |

Locked interaction rules:
- Never collapse a pair card to a single-image card in the canonical flow.
- Never allow selection of a half-ready pair.
- Pair ordering is stable during polling; cards should not reshuffle between poll ticks.
- On mobile, sketch and render may stack vertically, but labels and pair grouping remain intact.

### Selected design interaction model

The selected design workspace is the control surface after choice has been made.

Required surface areas:
- Hero pair viewer showing the selected sketch/render pair
- Design lineage summary:
  - project
  - generation source
  - `design_dna`
  - selected timestamp
- Action rail:
  - `Refine`
  - `Go to Spec`
  - `Open Generation History`
- Downstream stage summary:
  - Spec status
  - Technical Sheet status
  - SVG status
  - CAD status

Selection rules:
- Exactly one active selected design per project.
- Re-selecting another pair requires confirmation if downstream artifacts already exist.
- Confirmed replacement marks downstream stages stale.
- Selection persists at project level and survives refresh.

Refine rules:
- Refine is scoped to the selected design.
- Refine uses focused controls, not an open-ended chat route.
- The refine result path is the same as fresh generation:
  - submit refine
  - receive new `generationId`
  - route back to generation results
  - select a new pair or keep existing selection

### `tech_v1` UX and display expectations

`tech_v1` is the canonical technical sheet presentation standard for SkyGems.

Required sections:
- Header summary:
  - project name
  - design name or pair label
  - `design_dna`
  - technical sheet version
  - generated timestamp
- Geometry and dimensions
- Materials and metal details
- Gemstone schedule
- Construction and assembly notes
- Tolerances and manufacturing constraints
- Risk flags and missing information
- Source lineage:
  - selected design
  - approved spec version
  - upstream generation reference

Display rules:
- `tech_v1` is manufacturing-facing, not marketing-facing.
- Every numeric field must show either:
  - a value with unit
  - or an explicit `TBD`
- Risk flags must use clear status treatment:
  - blocking
  - warning
  - informational
- Missing information must be surfaced as missing information, not hidden or implied as certainty.
- The primary next action from a ready `tech_v1` sheet is `Generate SVG`.
- If `tech_v1` is stale because selection or spec changed, the stale state must be obvious at the top of the screen and downloads should be suppressed until regeneration completes.

## 7. Component extraction/new build plan

### Extract and refactor from current frontend

| Component boundary | Source | Decision |
|---|---|---|
| Workspace shell | `RootLayout.tsx` | Keep the shell concept, replace the implementation with route-aware project navigation and step context. |
| Jewelry type picker | `DesignGenerator.tsx` | Extract as reusable create-flow component. |
| Metal picker | `DesignGenerator.tsx` | Extract as reusable create-flow component. |
| Gemstone picker | `DesignGenerator.tsx` | Extract as reusable create-flow component. |
| Style picker | `DesignGenerator.tsx` | Extract as reusable create-flow component. |
| Complexity control | `DesignGenerator.tsx` | Extract as reusable create-flow component. |
| Prompt editor panel | `DesignGenerator.tsx` | Refactor into prompt-preview panel with `synced` and `override` modes. |
| Grid card framing | `Dashboard.tsx` and `DesignGallery.tsx` | Reuse spacing/image-card lessons, but standardize under new pair and gallery card components. |
| Detail side panel pattern | `DesignGallery.tsx`, `DesignPreview.tsx`, `CADExport.tsx` | Reuse the split-view idea only. Rebuild the content/state behavior. |
| Format selector tiles | `CADExport.tsx` | Reuse as the basis for CAD format selection. |

### New components to build

| Component | Why it must be new |
|---|---|
| `ProjectSwitcher` | No current project model exists in the UI. |
| `WorkspaceResolver` | Needed for `/app` entry and last-project logic. |
| `FlowStepRail` | Needed to expose the canonical stage progression cleanly. |
| `PromptPreviewStatusCard` | The current prompt textarea has no endpoint-aware loading/error model. |
| `PairCardV1` | The current design cards do not model sketch/render pairing or `design_dna`. |
| `GenerationStatusBanner` | Needed for queue/polling/reconnect/failed states. |
| `RefineDrawer` | Replaces the standalone AI Assistant screen with focused contextual refine UX. |
| `SelectionSummaryPanel` | Needed for selected-design lineage and stage status. |
| `SpecSectionCard` | Needed for structured spec review and missing-info completion. |
| `TechnicalSheetV1` | Needed for manufacturing-facing technical output display. |
| `SvgViewSwitcher` | Needed for multi-view SVG review. |
| `CadJobList` | Needed for per-format async CAD tracking. |
| `StageStatusPill` | Needed for consistent `absent / queued / processing / ready / failed / stale` display across downstream stages. |

### Primitive usage contract

Use the existing shadcn/ui primitives as the implementation base for new screen components:
- `button`
- `card`
- `select`
- `sheet`
- `tabs`
- `alert-dialog`
- `dialog`
- `scroll-area`
- `badge`
- `skeleton`
- `progress`
- `tooltip`

Do not continue the current pattern of large route components made from bespoke inline-styled buttons and divs when an existing primitive already fits the need.

## 8. Existing frontend reuse decisions

### Keep

| Asset | Decision |
|---|---|
| `src/styles/theme.css` | Keep as the visual token foundation. |
| `src/styles/fonts.css` | Keep. |
| `src/app/components/figma/ImageWithFallback.tsx` | Keep as a small media utility. |
| `src/app/services/variationEngine.ts` | Keep the domain vocabulary and variation categories, but move out of UI-only assumptions. |
| `src/app/utils/promptGenerator.ts` | Keep as reference logic and local fallback for design vocabulary only. The endpoint becomes canonical for prompt text. |

### Refactor

| Asset | Decision |
|---|---|
| `src/app/layouts/RootLayout.tsx` | Refactor into a project-aware workspace shell with clean nav config and contextual stage rail. |
| `src/app/screens/DesignGenerator.tsx` | Refactor heavily; keep the input/prompt concepts, replace the route behavior and state model. |
| `src/app/screens/Dashboard.tsx` | Refactor into project entry and resume surfaces; remove unsupported category drift and localStorage assumptions. |
| `src/app/screens/DesignGallery.tsx` | Refactor into secondary gallery search; remove destructive localStorage CRUD assumptions from the primary flow. |
| `src/app/screens/CADExport.tsx` | Refactor only the format selection idea. Replace everything else. |

### Replace

| Asset | Decision |
|---|---|
| `src/app/routes.tsx` | Replace with the canonical project-scoped route tree. |
| `src/app/services/storageService.ts` | Replace localStorage persistence with API-backed project/design/generation state. |
| `src/app/screens/DesignPreview.tsx` | Replace with selected design workspace and downstream stage navigation. |
| `src/app/screens/AICoPilot.tsx` | Replace with contextual refine UX. |
| Current standalone export route shape | Replace with design-scoped CAD route. |

### Remove from canonical IA

| Current item | Decision |
|---|---|
| `/app/preview/:id` | Remove from canonical route map. |
| `/app/copilot` | Remove from canonical route map. |
| `/app/export` | Remove from canonical route map. |
| Top-level nav items `AI Assistant` and `CAD Exports` | Remove from primary nav. |
| LocalStorage-based save/like/delete as source-of-truth product behavior | Remove from flow logic. |

### Delete or cleanup during implementation

| Item | Decision |
|---|---|
| Unused MUI/Emotion dependency set | Delete in the implementation wave. |
| Unused top-level shadcn copies with no near-term use | Trim selectively after new screen composition is in place. |
| README route inventory that still reflects preview/copilot/export | Update after route rewrite lands. |

## 9. Empty/error/loading/retry states

### State matrix

| Surface | Empty state | Loading state | Error state | Retry behavior |
|---|---|---|---|---|
| Projects index | No projects yet; primary CTA `Create Project` | Skeleton project cards | Full-surface load error | Retry fetch, keep create CTA visible |
| Project workspace home | No selected design or generation yet; CTA `Start Creating` | Skeleton summary blocks | Inline project load error | Retry project fetch |
| Create prompt preview | Initial helper text before first preview | Prompt skeleton lines and status pill | Inline alert in prompt panel | `Retry preview` without clearing user inputs |
| Generation results | No pairs yet because still queued | Skeleton pair cards with fixed labels | Reconnect banner on transient poll issue | Retry polling automatically and via manual refresh |
| Generation terminal failure | No ready pairs after terminal state | Not applicable | Full failed-job panel with reason | `Retry generation` using same draft |
| Selected design workspace | No selected design in project | Skeleton hero + side panel | Missing-design message if route stale | Return to generation or project home |
| Spec | No spec generated yet | Section skeletons | Blocking spec failure panel | `Generate spec again` |
| Technical Sheet | No technical sheet yet | Sheet skeleton sections | Blocking failure panel | `Generate technical sheet again` |
| SVG | No SVG yet | Viewer skeleton with view tabs visible | Blocking failure panel | `Generate SVG again` |
| CAD | No formats selected / no CAD jobs yet | Per-format progress rows | Per-format failure rows | Retry failed formats only or retry all |

### Failed-job UX rules

- Failed jobs do not wipe the parent context.
  The user should still see:
  - project name
  - selected design summary
  - last successful upstream artifact
- Job failure copy should be stage-specific:
  - generation failed
  - spec failed
  - technical sheet failed
  - svg failed
  - cad failed
- Every failed-job view must expose the next valid action:
  - retry
  - go back one stage
  - edit inputs

### Loading rules

- Use skeletons for stable layouts, not spinners as the whole page.
- Keep stage labels visible during loading so users know which artifact is being produced.
- Polling screens should prefer status banners plus skeleton cards over full-screen loading blockers.

### Retry rules

- Retry should preserve the last valid user draft when possible.
- Retry should preserve the current route context.
- Retry should not duplicate already-ready downstream artifacts.

## 10. Remaining blockers or open questions

These items do not block the route and state model above, but they must be aligned with the backend contract pack before network wiring starts:

1. `prompt-preview` response shape still needs final lock.
   Frontend requires at minimum:
   - preview prompt text
   - stable request correlation or revision echo
   - optional normalized input summary

2. `GET /v1/generations/:generationId` needs pair-level payload details.
   Frontend requires at minimum:
   - overall generation status
   - list of pair candidates
   - `designId`
   - `design_dna`
   - sketch/render artifact status and URLs
   - failure reason when applicable

3. Downstream stage endpoints need final polling/read semantics.
   Frontend needs to know whether `spec / technical-sheet / svg / cad` return:
   - immediate entity payloads
   - job IDs
   - stage versions
   - or both

4. Auth and tenant resolution are still missing in the current repo.
   The workspace resolver and project routes assume authenticated tenant context exists.

5. Gallery scope needs one final product call.
   Preferred default:
   - tenant-wide gallery route
   - project context preserved when opening a design from gallery

## 11. Recommended implementation task wave after this contract pack

This next wave should target the Phase 2 frontend gate: a user can enter inputs, see prompt preview, enqueue a generation job, and observe generation status without guessing.

1. Rewrite routing and workspace shell.
   Done when the app uses the canonical project-scoped route tree, `/app` resolves correctly, and the old preview/copilot/export routes are removed from primary IA.

2. Implement project entry surfaces.
   Done when `/app/projects` and `/app/projects/:projectId` exist with create/open/resume behavior and a lightweight project switcher.

3. Extract create-flow input components from the current `DesignGenerator`.
   Done when jewelry type, metal, gem, style, and complexity controls are reusable components instead of one monolith.

4. Implement the create screen state model.
   Done when create supports debounced `prompt-preview`, prompt `synced` vs `override` modes, reset-to-preview behavior, validation, and Generate Pair submit gating.

5. Implement the generation results screen with polling.
   Done when `/generations/:generationId` polls by `generationId`, renders `pair_v1` cards, supports queued/processing/partial/completed/failed states, and preserves last-good payload on transient poll failure.

6. Implement pair selection and the selected design workspace.
   Done when choosing a ready pair marks it as the project selection, routes into `/designs/:designId`, shows lineage and downstream stage status, and supports refine entry.

7. Replace the standalone AI Assistant with a refine drawer or panel.
   Done when refine can be initiated from the selected design workspace and returns the user to a new generation polling route instead of a chat page.

8. Add downstream route shells and gating now, even if later stages remain stubbed.
   Done when `spec`, `technical-sheet`, `svg`, and `cad` routes exist with the locked empty/loading/error/stale patterns and enforce prerequisites.

9. Build shared state/status components before stage-specific detail work.
   Done when `FlowStepRail`, `GenerationStatusBanner`, `StageStatusPill`, `PromptPreviewStatusCard`, and `PairCardV1` exist as reusable building blocks.

10. Clean up legacy assumptions in parallel with the route rewrite.
   Done when localStorage-specific screen behavior is removed from the main flow, dead top-level nav items are gone, and the repo is no longer modeling preview/copilot/export as source-of-truth product surfaces.

### Shared infrastructure required before screen work

These must be set up in the first implementation tasks, before any screen can be wired to real data:

| Item | Purpose | Details |
|---|---|---|
| **API client module** | Typed fetch wrapper for all `/v1/*` endpoints | Single `apiClient.ts` with typed functions: `promptPreview()`, `generateDesign()`, `getGeneration()`, `getDesign()`, `triggerSpec()`, etc. Handles auth headers, error parsing, idempotency key generation. |
| **TanStack Query (React Query) provider** | Server state management | `QueryClientProvider` in app tree. Default retry: 3 attempts, exponential backoff. `staleTime: 30s` for design data, `0` for generation polling. |
| **Polling hook** | Reusable for generation + pipeline steps | `usePolling(fetcher, { interval, stopWhen, onError })`. Interval: 2s during active generation, 3-5s after partial results. Stops on terminal status. |
| **Zustand store** | Global UI + workspace state | `uiStore`: sidebar collapsed, toast queue. `workspaceStore`: current projectId, current generationId, navigation stack. |
| **Error boundary** | Catch-all at RootLayout level | React Error Boundary wrapping `<Outlet>`. Shows ErrorState component with "Return to Dashboard" action. Per-route boundaries for pipeline screens. |
| **Toast system** | Wire existing sonner | Add `<Toaster />` to RootLayout. Remove `next-themes` dependency from `sonner.tsx`, use static dark theme. |

### Polling and retry specifications

| Operation | Interval | Max attempts | Backoff | Stop condition |
|---|---|---|---|---|
| Generation polling | 2s (queued/processing), 3-5s (partial results) | Unlimited while tab is visible | None (fixed interval) | Status is `completed` or `failed` |
| Pipeline step polling (spec/tech/svg/cad) | 3s | Unlimited while tab is visible | None | Status is `ready` or `failed` |
| Transient poll failure | Same interval | 5 consecutive failures | None | Show reconnect banner after 5 failures, stop polling |
| GET request retry (React Query) | N/A | 3 | Exponential: 1s, 2s, 4s | Success or max attempts |
| POST request retry | Manual only | 1 (user-triggered) | N/A | User clicks "Retry" |

### Explicitly not in the immediate next wave

- Rebuilding the marketing landing page
- Expanding gallery into the primary work surface
- Reintroducing open-ended chat as a top-level route
- Treating CAD export as a global standalone screen

---

## Appendix A: API Request/Response Shapes (Frontend Contracts)

These are the shapes the frontend will code against. Backend must match or this contract needs updating.

```typescript
// ─── Common types ───

interface ArtifactRef {
  url: string;          // Signed R2 URL
  width: number;
  height: number;
  contentType: string;  // e.g. "image/png", "image/webp"
}

type PipelineStepStatus = 'not_started' | 'processing' | 'completed' | 'failed';

interface ApiResponse<T> {
  data: T;
  meta?: { page?: number; perPage?: number; total?: number };
}

interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

// ─── POST /v1/prompt-preview ───

interface PromptPreviewRequest {
  jewelryType: string;
  metal: string;
  gemstones: string[];
  style: string;
  complexity: number;
}

interface PromptPreviewResponse {
  prompt: string;             // The AI-composed prompt text
  inputRevision?: number;     // Echo back for correlation
}

// ─── POST /v1/generate-design ───

interface GenerateDesignRequest {
  prompt: string;             // The (possibly user-edited) prompt
  jewelryType: string;
  metal: string;
  gemstones: string[];
  style: string;
  complexity: number;
  pairCount: number;          // How many pairs to generate (1-6, default 3)
  projectId: string;          // Required — project-scoped
  idempotencyKey: string;     // Client-generated ULID
}

interface GenerateDesignResponse {
  generationId: string;
  status: 'queued';
}

// ─── GET /v1/generations/:generationId ───

interface GenerationResponse {
  generationId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number | null;    // 0-100, null if not available
  pairs: DesignPair[];        // Empty until partial or completed
  error: string | null;       // Populated on failed
  createdAt: string;          // ISO 8601
}

interface DesignPair {
  pairId: string;
  designDna: string;
  status: 'pending' | 'partial' | 'ready' | 'failed';
  sketch: ArtifactRef | null;
  render: ArtifactRef | null;
  metadata: {
    jewelryType: string;
    metal: string;
    gemstones: string[];
    style: string;
  };
}

// ─── Design selection (promote pair to design) ───
// POST /v1/generations/:generationId/select
interface SelectPairRequest {
  pairId: string;
}

interface SelectPairResponse {
  designId: string;           // The newly created design
}

// ─── GET /v1/designs/:designId ───

interface DesignResponse {
  designId: string;
  designDna: string;
  prompt: string;
  jewelryType: string;
  metal: string;
  gemstones: string[];
  style: string;
  complexity: number;
  sketch: ArtifactRef;
  render: ArtifactRef;
  projectId: string;
  pipeline: {
    spec: PipelineStepStatus;
    technicalSheet: PipelineStepStatus;
    svg: PipelineStepStatus;
    cad: PipelineStepStatus;
  };
  liked: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── POST /v1/designs/:designId/refine ───

interface RefineDesignRequest {
  instruction: string;        // Freeform refinement text
  promptOverride?: string;    // Optional edited prompt
  presets?: string[];         // Refinement preset chips selected
  idempotencyKey: string;
}

interface RefineDesignResponse {
  generationId: string;       // New generation to poll
  status: 'queued';
}

// ─── Pipeline triggers ───
// POST /v1/designs/:designId/spec
// POST /v1/designs/:designId/technical-sheet
// POST /v1/designs/:designId/svg
// POST /v1/designs/:designId/cad

interface PipelineTriggerRequest {
  idempotencyKey: string;
  formats?: string[];         // Only for /cad: ["stl", "step", "dxf", "3dm", "obj"]
}

interface PipelineTriggerResponse {
  jobId: string;
  status: 'queued';
}

// ─── POST /v1/gallery/search ───

interface GallerySearchRequest {
  query?: string;
  filters?: {
    jewelryType?: string;
    metal?: string;
    style?: string;
    liked?: boolean;
    projectId?: string;
  };
  page: number;
  perPage: number;
  sort: 'created_at' | 'updated_at';
  order: 'asc' | 'desc';
}

interface GallerySearchResponse {
  designs: DesignResponse[];
  meta: { page: number; perPage: number; total: number };
}

// ─── GET /v1/projects/:projectId ───

interface ProjectResponse {
  projectId: string;
  name: string;
  description: string | null;
  currentGenerationId: string | null;
  selectedDesignId: string | null;
  designCount: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Appendix B: Jewelry Domain Constants (canonical source)

These constants are currently duplicated across `Dashboard.tsx` (8 categories), `DesignGenerator.tsx` (5 types), `variationEngine.ts`, and `promptGenerator.ts`. They must be centralized into a single shared constants module.

**Supported jewelry types (canonical list):**
```typescript
const JEWELRY_TYPES = ['ring', 'necklace', 'earrings', 'bracelet', 'pendant'] as const;
```

> Dashboard currently shows `brooch`, `anklet`, `tiara` as additional categories. These are **not supported** by the generation config (DesignGenerator, VariationEngine, PromptGenerator). Decision: remove unsupported types from Dashboard until the generation system supports them. Do not show categories that lead to dead ends.

**Metals:**
```typescript
const METALS = ['gold', 'silver', 'platinum', 'rose-gold', 'white-gold'] as const;
```

**Styles:**
```typescript
const STYLES = ['classic', 'modern', 'vintage', 'art-deco', 'minimalist', 'bohemian'] as const;
```

**Complexity range:** 1–10 integer

**Gemstones:** (extracted from DesignGenerator)
```typescript
const GEMSTONES = ['diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz', 'opal', 'pearl'] as const;
```

---

## Appendix C: Dependency Cleanup Checklist

Execute during Wave 1 task 1 of the implementation wave.

**Delete from package.json:**
- `@mui/material`
- `@mui/icons-material`
- `@emotion/react`
- `@emotion/styled`
- `react-responsive-masonry`
- `@popperjs/core`
- `react-popper`

**Delete unused shadcn components:**
- `src/app/components/ui/menubar.tsx`
- `src/app/components/ui/context-menu.tsx`
- `src/app/components/ui/navigation-menu.tsx`
- `src/app/components/ui/hover-card.tsx`
- `src/app/components/ui/input-otp.tsx`
- `src/app/components/ui/calendar.tsx`
- `src/app/components/ui/chart.tsx`
- `src/app/components/ui/carousel.tsx`
- `src/app/components/ui/resizable.tsx`
- `src/app/components/ui/pagination.tsx`

**Delete unused deps tied to deleted components:**
- `input-otp` (dep of input-otp.tsx)
- `react-day-picker` (dep of calendar.tsx)
- `recharts` (dep of chart.tsx)
- `embla-carousel-react` (dep of carousel.tsx)

**Fix in sonner.tsx:**
- Remove `next-themes` import, use static `theme="dark"` prop instead. Then delete `next-themes` from package.json.

**Fix layout violations:**
- `DesignPreview.tsx`: `h-screen` → `h-full`
- `DesignGallery.tsx`: `h-screen` → `h-full`
- `AICoPilot.tsx`: `h-screen` → `h-full`

---

*This document is the source of truth for SkyGems frontend implementation. Implementation tasks in the recommended wave (Section 11) can be created directly from the screen definitions, state machines, component specifications, and API contracts above without further discovery.*
