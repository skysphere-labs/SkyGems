# SkyGems Mainline Status and One-Shot Next Steps

Date: 2026-04-07
Owner: vector
Status: mainline reconciliation and one-shot completion brief

## What was inspected

ACE task worktrees and report artifacts inspected as source-of-truth inputs:
- phase-0-skygems-backend-platform-reuse-audit-contract-foundation-plan-5gh
- phase-0-skygems-frontend-ux-reuse-audit-and-flow-map-2cg
- phase-1a-skygems-backend-contract-reconciliation-pack-677
- phase-1a-skygems-ux-state-contract-and-flow-lock-3cf
- phase-2a-skygems-monorepo-backend-foundation-and-contract-implementation-6oa
- phase-2a-skygems-frontend-app-shell-migration-and-reusable-ui-port-3qp
- phase-2b-skygems-foundation-reconciliation-and-no-merge-integration-plan-87c
- phase-2b-skygems-frontend-wip-continuity-and-elite-ui-backlog-6z7
- phase-3a-skygems-unified-integration-foundation-cloudflare-resource-adoption-5pu
- phase-3b-skygems-cloudflare-bring-up-auth-tenant-bootstrap-and-real-prompt-preview-slice-5sp
- phase-3b-skygems-frontend-real-prompt-preview-generation-wiring-dark-luxury-restoration-60v
- phase-3c-skygems-real-generate-path-queue-workflow-bring-up-and-stable-bootstrap-10f
- phase-3c-skygems-frontend-live-generation-truth-selected-design-persistence-and-fallback-reduction-v3t
- phase-3d-skygems-remote-async-bring-up-explicit-design-selection-and-design-detail-truth-21t
- phase-4a-skygems-shared-backend-agent-runtime-and-prompt-pack-architecture-5uc
- phase-4a-skygems-figma-first-ux-overhaul-architecture-and-design-system-brief-y0b

Hermes HQ source inputs inspected:
- README.md
- projects.json
- skygems current-status/drift log
- skygems reconciliation log
- skygems status summary log
- skygems runtime-direction context
- skygems UI-overhaul direction context
- skygems frontend design reference context

## What should be considered landed into main now

Mainline should carry forward the strongest currently recoverable state, not the weakest historical branch boundary.

### Product shell and frontend direction
Land the route-based premium frontend from the strongest frontend worktree:
- project-scoped app shell
- route-based create / generation / selected design / downstream screens
- dark luxury / gold visual system
- prompt-preview / generate / poll-first frontend behavior with guarded fallback
- packages/ui shared design system and primitives

### Backend and platform direction
Land the strongest backend truth from the latest backend worktree:
- monorepo structure
- apps/api Worker foundation
- packages/shared contracts/domain model
- D1 migrations
- real prompt-preview path
- dev bootstrap path
- real generate path foundation
- generation polling truth
- explicit design selection endpoint
- design list/detail truth endpoints
- execution mode / execution source persistence

### Documentation and architectural truth
Land all current ACE-generated contract/report artifacts into repo docs for traceability.
This includes the audit, contract packs, reconciliation docs, backend/frontend reports, and the agent/runtime + UI-overhaul briefs.

## What should not be treated as product truth
- old single-app root SPA structure
- localStorage-only design truth as the main data model
- mock-only backend flows
- OpenClaw runtime assumptions for SkyGems
- phase labels as the future execution model

## Current source-of-truth state after reconciliation

### Runtime and agent direction
- SkyGems should use a shared backend agent runtime with skills.
- Do not move SkyGems toward OpenClaw.
- Prompt logic should move out of scattered route handlers into versioned prompt packs, skill packs, agent registry, and typed output contracts.

### Frontend truth
- Preferred frontend shape is the route-based app shell, not the older WorkspaceScreen-only model.
- UX target remains premium dark jewelry tooling with OpenArt-like simplicity.
- Selected design should be the central workspace truth after generation.
- Downstream screens for spec / technical sheet / svg / cad should remain present as route destinations, even if some are still shell-level.

### Backend truth
- Platform owns project/design/generation truth.
- Real backend endpoints now exist or are materially advanced for:
  - prompt preview
  - generate design
  - generation polling
  - project read
  - gallery search
  - explicit design selection
  - design detail and project design list reads
- Current backend still uses placeholder pair assets for the first real slice.
- Current remote Cloudflare rollout is only partially materialized because authenticated Wrangler operations are still blocked in this environment.

### Cloudflare truth
- D1 database exists: skygems
- R2 bucket exists: skygems-artifacts
- queue and workflow config exists in repo
- remote queue creation and worker/workflow deployment remain unproven from the current environment due auth/API token gaps

### Provider policy truth
- xAI is primary
- Google is secondary
- no secrets should be committed

## What was intentionally not fully landed from the latest work right now
These items may need selective follow-through instead of blind merge if conflicts remain during landing:
- any partial frontend adapters from the latest backend worktree that conflict with the stronger route-shell frontend
- any older workspace-tab-only UX assumptions superseded by the route-based shell
- any stale duplicate report copies where a newer report supersedes an older duplicate copy
- any generated artifacts, dist output, node_modules, local Wrangler state, or local secret files

## One-shot completion tracks

### Track 1 — Full UI completion
Goal:
Finish the premium route-based frontend so the live path is primary and fallback logic is minimized.

Must complete:
- make project bootstrap and active project flow feel native
- make create -> preview -> generate -> select -> design detail path fully coherent
- wire selected design workspace to real backend truth
- wire downstream spec / technical sheet / svg / cad routes to real data or clear pending states
- remove stale tab-workspace fallback surfaces that are no longer canonical
- finish final dark-luxury simplification and clarity pass

### Track 2 — Full backend completion
Goal:
Finish the real product truth layer so UI no longer depends on synthetic assumptions.

Must complete:
- make generate path fully remote-ready
- finish real pair asset persistence to R2 instead of placeholder assets
- complete explicit selection / detail / gallery truth contract end-to-end
- complete refine/spec/technical-sheet/svg/cad pipeline contracts and persistence
- ensure idempotency and membership enforcement remain stable on every route
- finalize migrations and validation coverage

### Track 3 — Shared agent/prompt/spec system completion
Goal:
Finish the shared backend agent runtime that will power prompt creation and downstream design intelligence.

Must complete:
- agent registry
- skill-pack system
- prompt pack / style pack / view pack architecture
- provider routing policy layer
- output schemas and validation
- jewelry-specific evaluation and training inputs
- safe multi-tenant concurrency boundaries
- migration away from hardcoded prompt strings in route handlers

### Track 4 — Deployment and Cloudflare completion
Goal:
Make the shipped backend path actually real in Cloudflare, not just repo-ready.

Must complete:
- authenticated Wrangler / API token path
- queue creation/verification
- worker deployment
- workflow materialization verification
- remote migration application
- remote smoke tests for prompt-preview / generate / poll / select
- environment secret setup for provider keys and auth

## Immediate next implementation order
1. Finish the mainline landing and validation of the recovered repo state.
2. Run one integrated pass that aligns the route-based frontend with the latest backend truth endpoints.
3. Finish real pair asset persistence and remote async deployment bring-up.
4. Finish explicit design truth across gallery, selection, detail, and downstream routes.
5. Build the shared backend agent runtime and move prompt logic into versioned packs/skills.
6. Finish downstream spec / technical sheet / svg / cad product slices.
7. Run a final cleanup pass to remove obsolete fallback-only and superseded structures.

## Risks and blockers
- later worktrees contain valuable uncommitted state that can be lost if not landed carefully
- remote Cloudflare rollout still depends on authenticated Wrangler/API token access
- frontend and backend both contain historical overlap and adapter layers that need cleanup after landing
- latest backend work and latest frontend route-shell work do not map one-to-one automatically and may require deliberate integration
- placeholder pair assets still mask the final provider/R2 path

## Working rule from here
No more planning by historical phase labels.
From here onward, SkyGems should be driven as a one-shot completion program:
- one repo mainline
- one source-of-truth status doc
- one completion backlog broken into direct execution tracks
- no permission prompts for routine agent execution
