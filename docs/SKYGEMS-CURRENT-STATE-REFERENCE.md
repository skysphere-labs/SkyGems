# SkyGems Current State Reference

Date: 2026-04-07
Scope: Working-tree reference for the current SkyGems codebase, backend, agents, Cloudflare resources, UI wiring, and remaining gaps.
Audience: Product, engineering, future agents, and anyone taking over the next implementation slice.

## 1. Purpose

This document is the current implementation reference for SkyGems.

It answers:
- what SkyGems is trying to achieve
- which frontend is the intended UI
- what backend routes are real
- what the current agent runtime actually does
- what D1, R2, queues, and Cloudflare resources exist
- what is fully wired, partially wired, or still stubbed
- what has already been tested
- what must be built next

This document reflects the current working tree, not just the last clean commit.

## 2. Product Goal

SkyGems is an AI-powered jewelry design studio.

The product goal is not just "generate an image." The goal is:
- premium jewelry design generation
- strong prompting tuned for jewelry design quality
- multi-tenant project/design truth in the backend
- agent-driven prompt construction and downstream production intelligence
- persistent artifact storage in Cloudflare
- a future path toward multi-view final-image generation and downstream spec / technical / CAD flows

Short version:
- frontend should feel like a premium jewelry design studio
- backend should own truth
- agent runtime should own prompt and downstream intelligence
- Cloudflare should host the persistent platform layer

## 3. Repo Shape

Current important top-level areas:

- `apps/api`
  Cloudflare Worker backend. Owns routes, D1, R2, queues, workflow binding, auth enforcement, generation/refine/spec orchestration.

- `apps/web`
  Route-based monorepo frontend. This is the more backend-complete frontend surface.

- `packages/shared`
  Shared contracts, IDs, schemas, prompt/domain helpers, artifact naming rules.

- `packages/ui`
  Shared UI primitives and styles used by the monorepo frontend.

- `packages/agent-runtime`
  New backend runtime boundary for agents, skills, prompt packs, view packs, and provider routing.

- `src`
  Newer UI surface that the user wants to preserve and build on. This is now the intended UI direction, but it is not yet fully backend-driven.

- `docs/ace-worktree-reports`
  Historical phase docs, audits, architecture docs, and reference packs.

## 4. Current Git State

Current branch:
- `main`

Important committed history:
- `2835a39`
  old shell/base
- `56f1bac`
  recovered monorepo/backend/frontend land
- `2b6d39a`
  merge landing of recovered mainline state
- `69f1236`
  prune of dead monorepo workspace-tab lane plus initial prompt-runtime wiring

Current working-tree reality after that:
- backend and runtime work continued after `69f1236`
- new runtime files exist but some are still uncommitted
- `src/` is present again as the new UI surface

## 5. Frontend Surfaces

There are two frontend surfaces in the repo today.

### 5.1 `src/` New UI

This is the intended UI to preserve.

Route map in `src/app/routes.tsx`:
- `/`
- `/app`
- `/app/create`
- `/app/gallery`
- `/app/preview/:id`
- `/app/copilot`
- `/app/export`
- `/app/variations`

High-level status:
- visually richer and closer to the desired premium "new UI"
- now partially wired to the real backend
- still contains local/prototype logic in several screens and services

Current backend-driven pieces inside `src/`:
- `src/app/services/skygemsApi.ts`
  root UI backend service layer
- `src/app/components/pipeline/PipelineView.tsx`
  no longer purely fake; now calls backend generate/poll flow
- `src/app/screens/DesignPreview.tsx`
  fetches backend design/spec detail for backend-backed design IDs
- `src/app/screens/Dashboard.tsx`
  now loads backend-created designs first
- `src/app/screens/DesignGallery.tsx`
  now loads backend-created designs first

Still local/prototype in `src/`:
- `src/app/orchestrator/PipelineOrchestrator.ts`
- `src/app/agents/*`
- `src/app/services/modelRouting/*`
- `src/lib/jewelryAnalysis.ts`
- `src/lib/xaiImageGeneration.ts`
- `src/app/services/xaiImageService.ts`
- `src/app/services/storageService.ts`

Meaning:
- the new UI is no longer disconnected from the backend
- but it is not fully converted yet

### 5.2 `apps/web` Monorepo UI

This is the more backend-complete route-based app.

Route map in `apps/web/src/app/routes.tsx`:
- `/`
- `/app`
- `/app/projects`
- `/app/projects/:projectId`
- `/app/projects/:projectId/create`
- `/app/projects/:projectId/generations/:generationId`
- `/app/projects/:projectId/designs/:designId`
- `/app/projects/:projectId/designs/:designId/spec`
- `/app/projects/:projectId/designs/:designId/technical-sheet`
- `/app/projects/:projectId/designs/:designId/svg`
- `/app/projects/:projectId/designs/:designId/cad`
- `/app/gallery`

Status:
- better aligned to current backend truth
- old workspace-tab lane has been removed
- still not the intended final UI direction

Practical interpretation:
- backend work has mostly been integrated here first
- the new UI now needs to absorb that backend truth

## 6. New UI Breakdown By Screen

### 6.1 Landing Page

File:
- `src/app/screens/LandingPage.tsx`

Status:
- standalone marketing shell
- not a major blocker
- not tightly coupled to backend

### 6.2 Dashboard

File:
- `src/app/screens/Dashboard.tsx`

Current state:
- now tries backend-driven design loading through the root UI service layer
- still renders cards using local metadata shape
- still supports search/filter in frontend memory

What it should become:
- project-aware dashboard backed by project/design summaries from the API

### 6.3 Design Studio / Create

Files:
- `src/app/screens/DesignStudio.tsx`
- `src/app/screens/DesignGenerator.tsx`
- `src/app/components/pipeline/PipelineView.tsx`

Current state:
- this is the most important new UI surface
- prompt editing and rich control surface exist
- backend generation flow is partially integrated via `PipelineView`
- still carries old local "multi-agent" language and local variation assumptions

What works now:
- backend-backed generate requests
- backend polling
- backend design IDs and image URLs feeding back into the new UI

What still needs work:
- remove old fake orchestration semantics
- convert more of the generation details to explicit backend status
- replace sketch/render assumptions with future multi-view final-image contract

### 6.4 Design Preview

File:
- `src/app/screens/DesignPreview.tsx`

Current state:
- now partially backend-driven for backend design IDs
- still mixes in local metadata and local like/favorite behavior
- still has legacy static metrics and preview assumptions

What works now:
- can call backend spec generation for backend-backed designs
- can fetch real backend detail/spec summary

What still needs work:
- convert more fields to backend truth
- remove old placeholder/static metrics

### 6.5 Design Gallery

File:
- `src/app/screens/DesignGallery.tsx`

Current state:
- now uses backend design list first, then overlays local likes/tags state
- image URLs come from backend artifact path for backend-created designs
- tags/likes remain local overlay behavior

What works now:
- created designs can appear from backend metadata
- image URLs are real backend artifact URLs

What still needs work:
- true backend gallery/search as primary data source everywhere
- decide whether likes/tags become backend-owned or remain local-only

### 6.6 AI Copilot

File:
- `src/app/screens/AICoPilot.tsx`

Current state:
- still a prototype/local surface
- not yet converted into a real backend refine or agent conversation surface

### 6.7 CAD Export

File:
- `src/app/screens/CADExport.tsx`

Current state:
- still not backend-driven
- should eventually be driven by real backend CAD jobs

### 6.8 Jewelry Variations Page

File:
- `src/pages/JewelryVariationsPage.tsx`

Current state:
- separate experimental tool
- still uses direct provider and analysis flows
- not yet integrated into the canonical backend agent pipeline

## 7. Backend/API State

Main backend entry:
- `apps/api/src/index.ts`

### 7.1 Real Routes

Currently real:
- `POST /v1/dev/bootstrap`
- `POST /v1/prompt-preview`
- `POST /v1/generate-design`
- `GET /v1/generations/:generationId`
- `GET /v1/projects/:projectId`
- `GET /v1/projects/:projectId/designs`
- `POST /v1/gallery/search`
- `GET /v1/designs/:designId`
- `POST /v1/designs/:designId/select`
- `POST /v1/designs/:designId/refine`
- `POST /v1/designs/:designId/spec`

### 7.2 Still Stubbed

Still stubbed:
- `POST /v1/designs/:designId/technical-sheet`
- `POST /v1/designs/:designId/svg`
- `POST /v1/designs/:designId/cad`

### 7.3 Generation Lane

Generation is real.

Files:
- `apps/api/src/lib/generation.ts`
- `apps/api/src/index.ts`

What it does:
- writes design rows
- writes generation rows
- persists generation pairs
- persists artifact rows
- tries real xAI image generation
- falls back to placeholders if needed
- serves artifacts back through backend URLs

### 7.4 Refine Lane

Refine is now real.

What it does:
- creates a child design
- creates a generation row
- runs through prompt-agent
- reuses generation execution path

### 7.5 Spec Lane

Spec is now real.

What it does:
- creates `design_workflow_runs`
- creates `design_specs`
- runs `spec-agent`
- updates `designs.latest_spec_id`
- exposes `latestSpec` through design detail

Meaning:
- first downstream stage now persists real data to D1

## 8. Agent Runtime State

Runtime package:
- `packages/agent-runtime`

### 8.1 What Exists

Agents:
- `prompt-agent`
- `spec-agent` (scaffold but also now used by `/spec`)

Packs:
- prompt pack
- view pack

Skills:
- `dna-resolve`
- `view-plan`
- `jewelry-rules`
- `prompt-compile`

Providers:
- xAI adapter
- Google adapter
- provider router

Executor:
- pack resolution
- skill registry
- provider router injection
- schema validation

### 8.2 What Is Live

Live backend agent usage:
- `prompt-preview` uses `prompt-agent`
- `generate-design` uses `prompt-agent`
- `refine` uses `prompt-agent`
- `spec` uses `spec-agent`

### 8.3 What Is Still Missing

Still missing:
- `technical-sheet` agent
- `svg` agent
- `cad-prep` agent wired into a real route
- eval system
- skill-pack authoring/release workflow
- provider invocation policy beyond basic routing scaffolding
- multi-view final-image contract

## 9. Prompt Behavior

### 9.1 Is It Randomizing?

Current answer:
- not for the backend runtime
- yes in parts of the new UI’s older local variation helper

Backend runtime:
- deterministic for same input
- stable view plan by jewelry type
- stable prompt bundle by design DNA and provider

Reason:
- design DNA is deterministic
- prompt-agent now uses explicit view planning skill
- prompt compilation is pack-driven and stable

### 9.2 Are Views Stable?

Current answer:
- yes

The runtime enforces stable per-type view composition through `view-pack-v1`.

Current system still assumes `pair_v1`:
- sketch prompt
- render prompt

This is not yet the final desired state if the product should become:
- no sketch
- multi-angle final JPEG outputs

## 10. Database State

### 10.1 Local D1

Local database currently contains real product data in the generation lane.

Observed local counts:
- tenants: 1
- users: 1
- projects: 1
- project_memberships: 1
- designs: 5+
- generations: 5+
- generation_pairs: 5+
- artifacts: 10+
- design_workflow_runs: 1+
- design_specs: 1+

Still empty or mostly empty locally:
- technical_sheets
- svg_assets
- cad_jobs

### 10.2 Remote D1

Remote `skygems` database:
- schema exists
- migrated through Phase 3D
- product rows are still mostly or fully empty

Meaning:
- remote platform is provisioned
- local usage is ahead of remote usage

## 11. R2 State

Bucket:
- `skygems-artifacts`

What works:
- local artifact writes
- backend-served artifact URLs
- frontend-visible image URLs through backend artifact endpoints

Meaning:
- gallery metadata and image references can now be driven from backend truth

## 12. Auth State

### 12.1 Local

Local auth path:
- dev bootstrap session
- signed session token
- bearer auth used by frontend/backend requests

This is what makes local end-to-end testing possible.

### 12.2 Remote

Remote auth posture:
- Worker deployed
- Auth0 config present
- remote dev bootstrap intentionally disabled

Meaning:
- remote protected route smoke needs real Auth0-backed auth
- current remote 404 on `/v1/dev/bootstrap` is expected

## 13. Cloudflare State

Working remote resources:
- Worker `skygems-api`
- D1 `skygems`
- R2 `skygems-artifacts`
- queues:
  - `skygems-generate`
  - `skygems-refine`
  - `skygems-spec`
- workflow binding:
  - `skygems-design-pipeline`

Current live Worker URL:
- `https://skygems-api.vashyash67.workers.dev`

## 14. What Has Been Tested

Local API flows verified:
- dev bootstrap
- prompt preview
- generate
- generation polling to `succeeded`
- select
- refine
- spec

Verified local results:
- generation artifacts are written and served
- spec row is persisted
- workflow run row is persisted
- design detail returns latest spec summary

Build/validation:
- root UI build passes
- monorepo `npm run validate` passes

## 15. What Is Fully Wired

Fully wired enough to use locally:
- backend create/generate/poll/select/refine/spec
- prompt-agent runtime
- spec-agent runtime
- local artifact serving
- root UI generation pipeline using backend
- root UI dashboard/gallery using backend-first metadata fetch

## 16. What Is Partially Wired

Partially wired:
- root UI preview page
- root UI gallery local overlay features (likes, tags)
- root UI dashboard filtering
- provider router/adapters
- skill system

These exist and are useful, but are not yet the finished production path.

## 17. What Is Not Wired Yet

Not wired yet:
- technical sheet stage
- svg stage
- cad stage
- full root UI replacement of local storage behavior
- root UI copilot surface to backend refine flow
- root UI export surface to backend CAD flow
- remote authenticated end-to-end smoke
- multi-view final-image generation contract
- jewelry eval/training loop

## 18. The Main Architectural Tension

There are still two truths in tension:

1. The backend and monorepo app are more complete and canonical.
2. The new root UI is the intended visual/product direction.

Current strategy:
- keep building backend truth
- wire the new UI onto that backend truth
- do not reintroduce the old workspace-tab lane

## 19. What We Are Trying To Achieve Next

Short-term:
- make the new UI fully backend-driven
- eliminate direct provider calls from the UI
- eliminate frontend-local orchestration as product truth

Medium-term:
- complete downstream stage execution
- shift prompt intelligence fully into runtime packs/skills/agents
- make the root UI the actual frontend on top of backend truth

Long-term:
- replace `pair_v1` with a real multi-view final-image contract
- train/evaluate jewelry prompting with an offline eval loop
- improve provider-specific output quality for final luxury jewelry renders

## 20. Recommended Immediate Next Steps

1. Convert the remaining new UI surfaces:
- `AICoPilot`
- `CADExport`
- `JewelryVariationsPage`

2. Make `technical-sheet` real.

3. Make `svg` real.

4. Make `cad` real.

5. Replace `pair_v1` with a new final-image contract, likely:
- `views_v1`
- hero / front / side / top / detail final images

6. Add eval datasets for jewelry prompting:
- prompt-to-output faithfulness
- metal/gem correctness
- luxury/commercial quality
- cross-view consistency
- manufacturability plausibility

## 21. Practical Interpretation

If someone asks "where are we?"

The answer is:
- backend is real
- Cloudflare is real
- prompt and spec agents are real
- local end-to-end create/generate/select/refine/spec is real
- new UI is partially connected to the real backend now
- the whole product is not finished yet
- the next bottleneck is no longer infra
- the next bottleneck is finishing the new UI hookup and the downstream stage pipeline

