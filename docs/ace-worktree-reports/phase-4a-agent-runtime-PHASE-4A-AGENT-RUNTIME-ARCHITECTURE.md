# Phase 4A: SkyGems Shared Backend Agent Runtime Architecture

Date: 2026-04-06
Branch: `emdash/phase-4a-skygems-shared-backend-agent-runtime-and-prompt-pack-architecture-5uc`
Status: Architecture document. No implementation changes. No merge.

---

## 1. What I inspected

### Direction documents

| Source | What it informed |
| --- | --- |
| `skygems-agent-system-direction.md` | Top-level requirements: no hardcoded prompts, shared runtime, skill packs, versioned packs, output schemas, evals |
| `skygems-agent-runtime-direction.md` | No OpenClaw; shared multi-tenant backend runtime; agents are capabilities not bots; queue/workflow-backed concurrency |
| `2026-04-05_184500-skygems-next-phase-plan.md` | Phase sequencing, architecture decision against OpenClaw, remaining gaps |

### Prior phase artifacts

| Source | What it informed |
| --- | --- |
| `PHASE-1A-BACKEND-CONTRACT-PACK.md` | Canonical entity model, D1 schema (15 tables), all API contracts (10 endpoints), three agent output schemas, queue payloads, workflow state machine, idempotency model, selection model, artifact naming |
| `PHASE-3C-BACKEND-REAL-GENERATE-REPORT.md` | Current generate path implementation, execution dispatch, placeholder artifacts, how the future runtime should plug in |

### Current codebase (Phase 3C worktree)

| File | What I found |
| --- | --- |
| `packages/shared/src/domain/design-dna.ts` (~450 lines) | `buildDesignDna()` with deterministic SHA256-based variation selection, `buildPromptBundle()` with hardcoded vocabulary interpolation, `buildPromptSummary()`, `buildDisplayName()`, `buildSearchText()` |
| `packages/shared/src/domain/vocab.ts` (~90 lines) | 5 `typeCompositionPrompts`, 4 `metalDescriptions`, 5 `gemstoneDescriptions`, 6 `styleDescriptions`, 1 `defaultNegativePrompt`, 2 provider directive sets (xAI + Google, sketch + render each) |
| `packages/shared/src/contracts/agents.ts` (~130 lines) | `PromptAgentOutputSchema`, `SpecAgentOutputSchema`, `CadPrepAgentOutputSchema` -- schemas exist but no agent runtime executes them |
| `packages/shared/src/contracts/api.ts` (~320 lines) | All request/response schemas including `promptTextOverride` on generate |
| `packages/shared/src/contracts/queues.ts` | `GenerateQueuePayloadSchema`, `RefineQueuePayloadSchema`, `SpecQueuePayloadSchema` |
| `apps/api/src/index.ts` (~940 lines) | All route handlers; `handleGenerateDesign()` builds prompt bundle inline (~150 lines of orchestration) |
| `apps/api/src/lib/generation.ts` (~440 lines) | `runGenerateExecution()`, `persistSuccessfulGeneration()`, placeholder SVG artifact insertion, auto-selection logic |
| `apps/api/src/lib/runtime.ts` (~150 lines) | `resolveGenerateExecutionMode()`, `resolvePromptProviderSelection()` reading env vars |
| `apps/api/src/lib/auth.ts` (~460 lines) | Auth0 JWT + dev bootstrap, tenant/user upsert |

### Direct inspection conclusions

1. **Prompt construction is synchronous domain logic, not a pluggable agent call.** `buildPromptBundle()` in `design-dna.ts` interpolates hardcoded strings from `vocab.ts`. This works for the current slice but cannot scale to refined prompts, style evolution, eval-driven improvement, or multi-provider optimization.

2. **Agent output schemas exist but agents do not.** `PromptAgentOutputSchema`, `SpecAgentOutputSchema`, and `CadPrepAgentOutputSchema` are Zod schemas in `contracts/agents.ts`. There is no agent runtime, registry, or execution framework. The "Prompt Agent" is just `buildDesignDna()` + `buildPromptBundle()` called inline in the route handler.

3. **Provider selection is config-based but not invoked.** `resolvePromptProviderSelection()` reads `SKYGEMS_PROVIDER_PRIMARY` / `SKYGEMS_PROVIDER_SECONDARY` and checks API key availability. No actual provider calls exist. The execution path produces placeholder SVG data URLs.

4. **The current architecture is explicitly designed for this transition.** Phase 3C's report says: "replace the placeholder execution internals behind `dispatchGenerateExecution()` / `runGenerateExecution()`" and "have the shared runtime own agent registry, skill packs, provider/model selection, structured output validation, prompt/style pack versioning."

---

## 2. Problem statement

### What we have now

A working generate path that:
- Takes create input (jewelry type, metal, gemstones, style, complexity)
- Deterministically builds design DNA with SHA256-based variation selection
- Constructs sketch/render prompt strings from hardcoded vocabulary in `vocab.ts`
- Persists designs, generations, and placeholder pair artifacts to D1
- Dispatches execution via queue or local fallback

Every prompt string is a hardcoded constant in `vocab.ts`:
- 5 type composition prompts (~100 words each)
- 4 metal descriptions
- 5 gemstone descriptions
- 6 style descriptions
- 2 provider-specific directive sets (xAI + Google)
- 1 default negative prompt
- Template interpolation logic in `buildPromptBundle()` (~80 lines)

### What breaks as the product grows

1. **No prompt evolution path.** Improving prompt quality requires editing `vocab.ts` directly. No A/B testing, no rollback, no concurrent versions.

2. **No style consistency enforcement.** The "luxury jewelry design sheet" aesthetic is baked into prompt text, not enforced by a style system. Refine, spec, technical-sheet, SVG, and CAD stages will each need prompt templates that maintain visual and structural consistency with the generate stage.

3. **No agent abstraction.** When we wire real provider calls (xAI image gen, Claude spec extraction), each stage will need: input validation, provider routing, retry/fallback, output schema enforcement, cost tracking, and timeout handling. Without an agent abstraction, each stage will reinvent this.

4. **No multi-model orchestration.** Generate needs image generation (xAI/Google). Spec needs structured text extraction (Claude). Technical-sheet needs document rendering. CAD needs container-based geometry. Each needs different providers, cost profiles, and timeout strategies.

5. **No eval or feedback loop.** No way to measure which prompt versions produce better results or feed user selection/rejection signals back.

6. **No jewelry-domain knowledge management.** Jewelry vocabulary (prong settings, bezel vs channel, milgrain, filigree), proportion rules, and manufacturing constraints are scattered across hardcoded strings.

### What we need

A shared backend agent runtime that:
- Provides a registry of versioned agent definitions
- Separates prompt content (packs) from prompt compilation logic (agents)
- Routes to the right provider/model per task
- Enforces output schemas before persisting results
- Supports concurrent multi-tenant execution
- Plugs into the existing API/queue/workflow/D1/R2 architecture without replacing it
- Enables prompt quality improvement through versioning, evaluation, and promotion

---

## 3. Proposed shared backend agent runtime architecture

### 3.1 Layered architecture

```
                    PUBLIC API LAYER (existing, unchanged)
                    ------------------------------------
                    auth / tenant / idempotency
                    route handlers (orchestration)
                    queue dispatch / workflow start
                    D1 truth / R2 artifacts
                              |
                              v
                    AGENT RUNTIME LAYER (new)
                    -------------------------
                    agent registry
                    agent executor
                    pack resolver
                    prompt compiler
                    output validator
                              |
                              v
                    PROVIDER LAYER (new)
                    --------------------
                    provider router
                    xAI adapter (image generation)
                    Google adapter (image generation)
                    Claude adapter (structured text)
                    container adapter (SVG/CAD)
```

### 3.2 Core principle: agents are stateless functions, not persistent bots

An agent is a **versioned, deterministic function** that:
- Takes a typed input (design DNA, refine instruction, spec request, etc.)
- Resolves prompt packs and compiles prompts
- Calls one or more providers through the provider router
- Validates the output against a Zod schema
- Returns a typed result or a structured failure

Agents do not:
- Maintain conversation history or session state
- Store data directly (the caller persists results)
- Choose their own retry strategy (the executor handles this)
- Access resources outside their declared inputs

This matches the stated direction: "Agents are shared backend capabilities, not per-project persistent bots."

### 3.3 Where the runtime lives in the codebase

```
packages/
  shared/
    src/
      contracts/       # existing: schemas, enums, IDs (unchanged)
      domain/          # existing: design-dna, vocab, artifacts (unchanged initially)
  agent-runtime/       # NEW package
    src/
      index.ts         # public API exports
      types.ts         # AgentDefinition, SkillDefinition, PackDefinition, etc.
      registry.ts      # AgentRegistry class
      executor.ts      # AgentExecutor class
      validation.ts    # output schema enforcement

      packs/
        types.ts       # PromptPackContent, StylePackContent, ViewPackContent
        resolver.ts    # PackResolver class
        prompt-pack-v1.ts    # extracted from vocab.ts
        style-pack-v1.ts     # extracted from prompt text
        view-pack-v1.ts      # extracted from composition rules

      skills/
        dna-resolve.ts       # extracted from design-dna.ts
        prompt-compile.ts    # extracted from buildPromptBundle()
        prompt-summarize.ts  # extracted from buildPromptSummary()

      providers/
        types.ts       # ProviderKind, ImageGenerationResult
        router.ts      # ProviderRouter class
        xai.ts         # xAI image generation adapter
        google.ts      # Google image generation adapter
        claude.ts      # Claude structured text adapter

      agents/
        prompt-agent.ts      # prompt-agent definition
        refine-agent.ts      # (future)
        spec-agent.ts        # (future)
        cad-prep-agent.ts    # (future)

apps/
  api/
    src/
      lib/
        generation.ts  # existing: calls into agent-runtime
```

The `@skygems/agent-runtime` package is a pure library consumed by the API worker. It has no Worker binding, HTTP surface, or persistent state. It receives execution context (provider API keys, abort signal) from the caller.

### 3.4 Runtime flow

```
HTTP route or queue consumer
  -> resolve tenant/project/run context (existing platform layer)
  -> agentExecutor.run(agentId, input)
    -> validate input against agent's inputSchema
    -> resolve packs via PackResolver
    -> execute agent function with AgentContext
      -> call skills (dna-resolve, prompt-compile, etc.)
      -> call providers via ProviderRouter (when needed)
    -> validate output against agent's outputSchema
    -> return AgentRunResult (output + metadata)
  -> persist results to D1/R2 (existing platform layer)
  -> emit run metadata
```

---

## 4. Agent registry and skill-pack model

### 4.1 Agent definition

```ts
interface AgentDefinition<TInput, TOutput> {
  // Identity
  agentId: string;                    // e.g. "prompt-agent", "spec-agent"
  version: string;                    // semver, e.g. "1.0.0"
  description: string;

  // Capabilities
  requiredPacks: string[];            // pack IDs, e.g. ["prompt-pack", "style-pack"]
  requiredProviders: ProviderKind[];  // e.g. ["image-gen"] or []
  skills: string[];                   // skill IDs, e.g. ["dna-resolve", "prompt-compile"]

  // Contracts
  inputSchema: ZodSchema<TInput>;
  outputSchema: ZodSchema<TOutput>;

  // Execution
  execute: (input: TInput, ctx: AgentContext) => Promise<TOutput>;

  // Limits
  timeoutMs: number;
  retryable: boolean;
  executionKind: 'deterministic' | 'llm_structured' | 'image_generation' | 'hybrid';
}
```

### 4.2 Agent registry

The registry is a typed map, not a database table. Agent definitions are code, not configuration. This keeps them type-safe, testable, and deployable as part of the Worker bundle.

```ts
class AgentRegistry {
  private agents = new Map<string, AgentDefinition<unknown, unknown>>();

  register<TInput, TOutput>(def: AgentDefinition<TInput, TOutput>): void;
  resolve(agentId: string): AgentDefinition | undefined;
  list(): AgentDefinition[];
}
```

Why a code registry instead of a D1 table:
- Agent definitions include executable logic (`execute` function). This cannot be stored in D1.
- Versioning is handled by deployment (each Worker deploy bundles specific agent versions).
- No requirement for runtime agent creation or hot-swapping.
- D1 is for product truth (designs, generations, artifacts). Agent definitions are platform infrastructure.

### 4.3 Registered agents (v1)

| Agent ID | Purpose | Execution kind | Required packs | Required providers | Output schema |
| --- | --- | --- | --- | --- | --- |
| `prompt-agent` | Compile design DNA + prompts for generate | `deterministic` | `prompt-pack`, `style-pack`, `view-pack` | none (deterministic now; `image-gen` later) | `PromptAgentOutputSchema` |
| `refine-agent` | Compile refined prompts from base + instruction | `deterministic` | `prompt-pack`, `style-pack`, `view-pack`, `refine-pack` | none (deterministic now) | `PromptAgentOutputSchema` |
| `spec-agent` | Extract structured spec from pair artifacts | `llm_structured` | `spec-pack` | `structured-text` | `SpecAgentOutputSchema` |
| `cad-prep-agent` | Plan CAD modeling from spec + SVG | `llm_structured` | `cad-pack` | `structured-text` | `CadPrepAgentOutputSchema` |

Not every downstream step needs to be an LLM agent:
- Technical-sheet rendering is a deterministic renderer (no agent needed)
- SVG generation is a workflow/container step (no agent needed)
- CAD export is a container/tool step (no agent needed)

### 4.4 Skill model

Skills are reusable functions that agents compose. They are building blocks, not agents.

```ts
interface SkillDefinition {
  skillId: string;
  description: string;
  execute: (...args: unknown[]) => unknown;
}
```

Registered skills (v1):

| Skill ID | Purpose | Currently lives in |
| --- | --- | --- |
| `dna-resolve` | Normalize input, select variations, build design DNA, compute fingerprint | `design-dna.ts: buildDesignDna()` |
| `prompt-compile` | Compile prompt text from DNA + pack vocabulary + provider directives | `design-dna.ts: buildPromptBundle()` |
| `prompt-summarize` | Build prompt summary (240 chars) and display name | `design-dna.ts: buildPromptSummary(), buildDisplayName()` |
| `search-index` | Build full-text search string for a design | `design-dna.ts: buildSearchText()` |
| `r2-key-build` | Build deterministic R2 artifact keys | `artifacts.ts: buildArtifactR2Key()` |

### 4.5 How agents use skills

```ts
// Inside prompt-agent execute function
async execute(input: PromptAgentInput, ctx: AgentContext): Promise<PromptAgentOutput> {
  const dnaResolve = ctx.skill('dna-resolve');
  const promptCompile = ctx.skill('prompt-compile');
  const promptSummarize = ctx.skill('prompt-summarize');

  const designDna = dnaResolve(input);
  const promptPack = ctx.resolvePack('prompt-pack');
  const stylePack = ctx.resolvePack('style-pack');
  const viewPack = ctx.resolvePack('view-pack');
  const bundle = promptCompile(designDna, promptPack, stylePack, viewPack, ctx.providerKind);
  const summary = promptSummarize(input);

  return {
    schemaVersion: 'prompt_agent.v1',
    mode: 'generate',
    projectId: input.projectId,
    designId: input.designId,
    pairStandardVersion: 'pair_v1',
    normalizedInput: /* ... */,
    designDna,
    promptBundle: bundle,
    blocked: false,
    blockReasons: [],
  };
}
```

### 4.6 Agent context

```ts
interface AgentContext {
  tenantId: string;
  userId: string;
  projectId: string;
  requestId: string;     // for correlation logging

  // Pack resolution (read-only)
  resolvePack(packId: string): PackDefinition;

  // Skill access (stateless functions)
  skill(skillId: string): SkillFunction;

  // Provider access
  providerKind: ProviderKind;         // resolved by caller
  provider: ProviderRouter;           // for agents that call providers

  // Abort signal for timeout enforcement
  signal: AbortSignal;
}
```

### 4.7 Agent executor

```ts
class AgentExecutor {
  constructor(
    private registry: AgentRegistry,
    private packResolver: PackResolver,
    private providerRouter: ProviderRouter,
    private skills: Map<string, SkillDefinition>,
  ) {}

  async run<TInput, TOutput>(
    agentId: string,
    input: TInput,
    context: {
      tenantId: string;
      userId: string;
      projectId: string;
      requestId: string;
      providerKind: ProviderKind;
    },
  ): Promise<AgentRunResult<TOutput>> {
    const agent = this.registry.resolve(agentId);
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);

    // 1. Validate input
    const parsed = agent.inputSchema.parse(input);

    // 2. Build context
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), agent.timeoutMs);
    const ctx: AgentContext = {
      ...context,
      resolvePack: (id) => this.packResolver.resolve(id),
      skill: (id) => this.skills.get(id)?.execute ?? (() => { throw new Error(`Unknown skill: ${id}`); }),
      provider: this.providerRouter,
      signal: abortController.signal,
    };

    try {
      // 3. Execute
      const output = await agent.execute(parsed, ctx);

      // 4. Validate output
      const validated = agent.outputSchema.parse(output);

      return {
        status: 'succeeded',
        agentId: agent.agentId,
        agentVersion: agent.version,
        output: validated,
        packRefs: agent.requiredPacks.map(id => this.packResolver.resolveRef(id)),
      };
    } catch (err) {
      return {
        status: 'failed',
        agentId: agent.agentId,
        agentVersion: agent.version,
        output: null,
        error: { code: 'agent_execution_failed', message: String(err) },
        packRefs: agent.requiredPacks.map(id => this.packResolver.resolveRef(id)),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

interface AgentRunResult<T> {
  status: 'succeeded' | 'failed' | 'blocked';
  agentId: string;
  agentVersion: string;
  output: T | null;
  error?: { code: string; message: string };
  packRefs: PackRef[];
}

type PackRef = {
  packId: string;
  version: string;
  checksum: string;
};
```

---

## 5. Prompt/style/view pack system

### 5.1 What packs replace

Every hardcoded constant currently in `vocab.ts` and prompt interpolation logic in `design-dna.ts`:

| Current location | Current form | Target pack |
| --- | --- | --- |
| `vocab.ts: typeCompositionPrompts` | 5 hardcoded strings (~100 words each) | `PromptPackContent.typeCompositionPrompts` |
| `vocab.ts: metalDescriptions` | 4 hardcoded strings | `PromptPackContent.metalDescriptions` |
| `vocab.ts: gemstoneDescriptions` | 5 hardcoded strings | `PromptPackContent.gemstoneDescriptions` |
| `vocab.ts: styleDescriptions` | 6 hardcoded strings | `PromptPackContent.styleDescriptions` |
| `vocab.ts: defaultNegativePrompt` | 1 hardcoded string | `PromptPackContent.defaultNegativePrompt` |
| `vocab.ts: providerDirectives` (Google/xAI sketch + render) | 4 hardcoded strings | `PromptPackContent.providerDirectives` |
| `design-dna.ts: TYPE_SPECIFIC_VARIATION_CONFIGS` | 5 x 8 variation lists per axis | `PromptPackContent.variationConfigs` |
| `design-dna.ts: buildPromptBundle()` rendering style text | inline string literals | `StylePackContent.sketchRenderingStyle`, `StylePackContent.renderRenderingStyle` |
| `design-dna.ts: buildPromptBundle()` complexity mapping | inline if/else chain | `PromptPackContent.complexityDescriptions` |
| `design-dna.ts: buildPromptBundle()` type-specific view framing | embedded in typeCompositionPrompts | `ViewPackContent.viewDefinitions` |

### 5.2 Pack types

| Pack type | Content type | Purpose |
| --- | --- | --- |
| **Prompt pack** | `PromptPackContent` | Prompt templates and jewelry vocabulary for a specific stage |
| **Style pack** | `StylePackContent` | Visual/aesthetic constraints and rendering directives |
| **View pack** | `ViewPackContent` | Per-jewelry-type view definitions and composition rules |
| **Refine pack** | `RefinePackContent` | Refinement preset definitions and instruction templates |
| **Spec pack** | `SpecPackContent` | Structured extraction rules for spec agent |
| **CAD pack** | `CadPackContent` | CAD preparation rules and QA check definitions |

### 5.3 Prompt pack content (detailed)

```ts
interface PromptPackContent {
  // Template strings with {{variable}} interpolation
  sketchTemplate: string;
  renderTemplate: string;

  // Vocabulary maps (extracted from vocab.ts)
  typeCompositionPrompts: Record<JewelryType, string>;
  metalDescriptions: Record<Metal, string>;
  gemstoneDescriptions: Record<Gemstone, string>;
  styleDescriptions: Record<Style, string>;
  complexityDescriptions: Array<{
    range: [number, number];
    description: string;
  }>;

  // Negative prompts
  defaultNegativePrompt: string;
  typeSpecificNegativePrompts?: Record<JewelryType, string>;

  // Provider directives
  providerDirectives: Record<ProviderKind, {
    sketchDirective: string;
    renderDirective: string;
  }>;

  // Variation vocabulary (extracted from TYPE_SPECIFIC_VARIATION_CONFIGS)
  variationConfigs: Record<JewelryType, {
    bandStyle: string[];
    settingType: string[];
    stonePosition: string[];
    profile: string[];
    motif: string[];
  }>;
}
```

### 5.4 Style pack content

```ts
interface StylePackContent {
  // Quality level
  qualityLevel: 'concept' | 'production' | 'editorial';
  aestheticFamily: string;  // e.g. "luxury-dark"

  // Rendering style rules (currently inline in buildPromptBundle)
  sketchRenderingStyle: string;
  // e.g. "Conceptual jeweler's design sheet with confident pencil linework..."
  renderRenderingStyle: string;
  // e.g. "luxury studio render on clean neutral background..."

  // Background and staging
  backgroundDirective: string;
  lightingDirective: string;
}
```

### 5.5 View pack content

```ts
interface ViewPackContent {
  viewDefinitions: Record<JewelryType, {
    primaryView: ViewDefinition;
    secondaryView: ViewDefinition;
    layout: 'side-by-side' | 'stacked';
    compositionNotes: string;
    // e.g. for ring: "FRONT VIEW and TOP VIEW side by side"
    // e.g. for necklace: "FRONT VIEW U-shape and DETAIL VIEW of pendant"
  }>;
}

interface ViewDefinition {
  viewName: string;       // e.g. "FRONT VIEW", "TOP VIEW"
  description: string;    // e.g. "hand-drawn front-facing view showing complete piece"
  framingRules: string;   // e.g. "centered, complete piece visible, no cropping"
}
```

### 5.6 Pack storage and versioning

**Phase 1 (immediate):** Packs are TypeScript objects in `@skygems/agent-runtime`, exported as constants. They deploy with the Worker bundle. Version changes require code deployment.

```ts
// packages/agent-runtime/src/packs/prompt-pack-v1.ts
export const PROMPT_PACK_V1: PackDefinition = {
  packId: 'prompt-pack',
  packType: 'prompt',
  version: '1.0.0',
  content: {
    sketchTemplate: '{{typeComposition}}\n\nMaterial: {{metalDescription}}...',
    typeCompositionPrompts: {
      ring: 'A jewelry design sheet showing TWO hand-drawn views...',
      // ... verbatim from current vocab.ts
    },
    // ...
  },
};
```

**Phase 2 (later):** Packs stored in D1 `pack_releases` table with JSON content. Versioned rows with `status: 'draft' | 'active' | 'deprecated'`. Active pack resolved at execution time. Draft packs usable in preview/eval mode.

**Phase 3 (much later):** Authoring agent that drafts improved pack versions based on eval signals. Drafted packs go through human review before promotion to active.

### 5.7 Pack resolver

```ts
class PackResolver {
  private bundled: Map<string, PackDefinition>;

  constructor(bundledPacks: PackDefinition[]) {
    this.bundled = new Map(bundledPacks.map(p => [p.packId, p]));
  }

  // Phase 1: resolve from bundled constants
  resolve(packId: string): PackDefinition {
    const pack = this.bundled.get(packId);
    if (!pack) throw new Error(`Unknown pack: ${packId}`);
    return pack;
  }

  resolveRef(packId: string): PackRef {
    const pack = this.resolve(packId);
    return {
      packId: pack.packId,
      version: pack.version,
      checksum: pack.checksum,
    };
  }
}
```

### 5.8 Prompt compilation (replaces buildPromptBundle)

The `prompt-compile` skill takes pack content + DNA + provider and returns a `PromptBundle`. This replaces the current `buildPromptBundle()` function.

```ts
function promptCompile(
  designDna: DesignDna,
  promptPack: PromptPackContent,
  stylePack: StylePackContent,
  viewPack: ViewPackContent,
  provider: ProviderKind,
  options?: {
    userNotes?: string;
    promptTextOverride?: string;
  }
): PromptBundle {
  // If promptTextOverride is provided, use it directly (escape hatch)
  if (options?.promptTextOverride) {
    return {
      sketchPrompt: options.promptTextOverride,
      renderPrompt: options.promptTextOverride,
      negativePrompt: promptPack.defaultNegativePrompt,
    };
  }

  // Resolve vocabulary from packs
  const typeComposition = promptPack.typeCompositionPrompts[designDna.jewelryType];
  const metalDesc = promptPack.metalDescriptions[designDna.metal];
  const gemstoneDesc = designDna.gemstones
    .map(g => promptPack.gemstoneDescriptions[g])
    .join(', ');
  const styleDesc = promptPack.styleDescriptions[designDna.style];
  const complexityDesc = resolveComplexity(designDna.complexity, promptPack.complexityDescriptions);
  const providerDirective = promptPack.providerDirectives[provider];
  const sketchStyle = stylePack.sketchRenderingStyle;
  const renderStyle = stylePack.renderRenderingStyle;

  // Interpolate templates
  const sketchPrompt = interpolate(promptPack.sketchTemplate, {
    typeComposition, metalDesc, gemstoneDesc, styleDesc,
    complexityDesc, sketchStyle,
    providerDirective: providerDirective.sketchDirective,
    ...designDna,
    userNotes: options?.userNotes,
  });

  const renderPrompt = interpolate(promptPack.renderTemplate, {
    metalDesc, gemstoneDesc, styleDesc, complexityDesc, renderStyle,
    providerDirective: providerDirective.renderDirective,
    ...designDna,
    userNotes: options?.userNotes,
  });

  return { sketchPrompt, renderPrompt, negativePrompt: promptPack.defaultNegativePrompt };
}
```

### 5.9 Pack promotion strategy

Production packs must be immutable and deliberately promoted.

Promotion flow:
1. Author new pack version in code (phase 1) or authoring lane (later)
2. Run comparison test against current pack output
3. Run eval dataset against candidate (when eval system exists)
4. Human review for regressions
5. Promote via code deploy (phase 1) or D1 status update (later)

Rules:
- No self-mutating production prompts
- No runtime writes to active pack content
- `promptTextOverride` is a debug/migration escape hatch, not the architecture

---

## 6. Jewelry-data/training/eval strategy

### 6.1 Jewelry-specific domain knowledge inventory

| Knowledge type | Current location | Target location |
| --- | --- | --- |
| Jewelry types and visual forms | `JewelryTypeEnum` + `typeCompositionPrompts` | `ViewPack.viewDefinitions` |
| Metal appearance descriptions | `metalDescriptions` in `vocab.ts` | `PromptPack.metalDescriptions` |
| Gemstone visual descriptions | `gemstoneDescriptions` in `vocab.ts` | `PromptPack.gemstoneDescriptions` |
| Style aesthetic definitions | `styleDescriptions` in `vocab.ts` | `StylePack` + `PromptPack.styleDescriptions` |
| Variation axes per type | `TYPE_SPECIFIC_VARIATION_CONFIGS` in `design-dna.ts` | `PromptPack.variationConfigs` |
| Manufacturing risk flags | `RiskFlagSchema` in `agents.ts` | `SpecPack.riskFlagDefinitions` |
| Measurement units/ranges | `MeasuredValueSchema` in `agents.ts` | `SpecPack.measurementRules` |

### 6.2 Knowledge that will be needed but does not exist yet

| Knowledge type | Why needed | When needed |
| --- | --- | --- |
| Proportion rules per type | Band-to-head ratio affects aesthetics and manufacturability | Spec agent |
| Gemstone setting physics | Prong count, bezel thickness by stone size | Spec agent |
| Metal weight estimation | Weight from dimensions and metal type | Technical sheet |
| Standard sizing tables | Ring US/EU/UK, bracelet lengths, necklace lengths | Spec agent |
| Manufacturing method constraints | Castable vs fabricated by geometry complexity | CAD prep agent |
| Common defect patterns | What prompts produce bad results per provider | Eval system |

### 6.3 Training direction

SkyGems does not train models. It uses external providers (xAI, Google, Claude). "Training" in this context means:

1. **Prompt optimization** -- finding which formulations produce the best results per jewelry type / style / provider
2. **Few-shot examples** -- curating reference descriptions that improve provider output quality
3. **Structured extraction templates** -- optimizing Claude instructions for spec extraction

None of these require model fine-tuning. They all live in packs.

Recommended order:
1. Pack quality, eval quality, curated exemplars, deterministic rules
2. Retrieval or reference loading from curated jewelry corpora
3. Fine-tuning only if evals show base models are the bottleneck (likely never for v1)

### 6.4 Eval strategy

**Eval dimensions:**

| Dimension | What it measures | How | When |
| --- | --- | --- | --- |
| Schema compliance | Does agent output parse against Zod schema? | Automatic, every execution | Now (already exists via `PromptAgentOutputSchema`) |
| Prompt coherence | Does compiled prompt contain all required elements? | Rule-based checks (jewelry type mentioned, metal described, view composition present) | Phase 4A-immediate |
| Provider success rate | Does provider return a usable result? | Track provider response status per pack version | When provider calls are wired |
| Pair completeness | Does pair contain non-blank sketch and render? | Image analysis (size, format) | When real images exist |
| Spec plausibility | Are extracted dimensions within physical ranges? | Range checks per type (ring band: 1.5-6mm, not 50mm) | When spec agent is wired |
| User selection rate | How often are designs from a pack version selected? | Correlate `designs.selection_state` with `prompt_agent_output_json` pack version | Production data required |

**Eval execution:**

- Phase 1: Schema compliance and prompt coherence run automatically in the agent executor. Failures surface as `agent_validation_failed`.
- Phase 2: Provider success rate and pair completeness tracked in `generation_evals` D1 table.
- Phase 3: Selection rate correlation. Requires production data. Analyzed offline.

### 6.5 Feedback loop

```
User creates design
  -> Prompt agent compiles prompt (pack version recorded)
  -> Provider generates pair
  -> User sees result
  -> User selects OR generates another candidate
  -> Selection/rejection signal in D1 (designs.selection_state)
  -> Offline: correlate selection rate with pack version
  -> Human: review low-performing formulations
  -> Human: draft improved pack version
  -> Human: promote to active after review
```

Human-in-the-loop for pack promotion. Self-mutating production prompts are explicitly prohibited.

---

## 7. Concurrency / tenancy / safety model

### 7.1 Concurrency model

**Agent execution is request-scoped.** Each invocation:
- Receives its own input payload (immutable)
- Resolves packs from the resolver (read-only)
- Makes provider calls with its own credentials
- Returns output that the caller persists

No shared mutable state in the agent runtime. Two concurrent generate requests for different tenants execute completely independently.

**Queue-backed execution provides natural concurrency.** The existing queue dispatch (`GENERATE_QUEUE`, `REFINE_QUEUE`, `SPEC_QUEUE`) means:
- Each queue message processed independently
- Cloudflare Workers handles scaling
- Slow generation for tenant A does not block tenant B
- Queue retry handles transient provider failures

### 7.2 Tenant isolation

| Layer | Isolation mechanism | Already implemented? |
| --- | --- | --- |
| Auth | JWT tenant claim validated on every request | Yes |
| D1 | Every query includes `tenant_id` in WHERE | Yes |
| R2 | Keys prefixed with `tenants/{tenantId}/` | Yes |
| Agent execution | Input payload carries `tenantId`; output validated before D1 write | Partially |
| Provider calls | API keys are global (not per-tenant) | N/A for v1 |
| Rate limiting | Queue concurrency limits provide basic protection | Queue-level only |

### 7.3 Safety rules

1. **No cross-tenant data access.** Agents receive input scoped to one tenant. They cannot query D1 directly. If an agent needs additional data (e.g., spec agent needs pair artifacts), the caller fetches it and passes it in the input.

2. **No self-modification.** Agents cannot modify their own pack content, registry entry, or skill implementations.

3. **Output schema enforcement is mandatory.** Every agent output is validated against its Zod schema before return. Schema mismatch is a hard failure (`agent_validation_failed`). The caller never receives unvalidated output.

4. **Timeout enforcement.** Each agent has `timeoutMs`. The executor enforces via `AbortController`. Provider adapters respect the abort signal.

5. **No ambient authority.** Agents receive a constrained `AgentContext`, not raw `Env` bindings.

### 7.4 Agent run tracking

Recommended `agent_runs` D1 table:

```sql
CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY,                -- arn_ prefix
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL,
  design_id TEXT,
  generation_id TEXT,
  workflow_run_id TEXT,
  agent_id TEXT NOT NULL,
  agent_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('running','succeeded','failed','blocked')),
  input_hash TEXT NOT NULL,
  pack_refs_json TEXT NOT NULL,
  provider_route_json TEXT,
  output_json TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);
```

Indexes:
- `(tenant_id, generation_id, created_at DESC)`
- `(tenant_id, workflow_run_id, created_at DESC)`
- `(tenant_id, design_id, agent_id, created_at DESC)`

This gives the runtime an execution ledger without changing product truth tables (`designs`, `generations`, `design_workflow_runs`).

---

## 8. Integration with current SkyGems backend

### 8.1 What stays exactly where it is

| Component | Status | Role |
| --- | --- | --- |
| Route handlers in `index.ts` | **Keep** | Orchestration: auth, idempotency, D1 writes, queue dispatch |
| D1 schema (15 tables) | **Keep** | Product truth |
| R2 artifact keys | **Keep** | Binary artifact storage |
| Queue payloads (`queues.ts`) | **Keep** | Async dispatch |
| Workflow binding (`DesignPipelineWorkflow`) | **Keep** | Multi-stage orchestration |
| Auth/tenant enforcement | **Keep** | Request-level access control |
| Idempotency system | **Keep** | Duplicate prevention |
| Agent output schemas (`agents.ts`) | **Keep** | Output validation contracts |

### 8.2 What changes

| Component | Current | After agent runtime |
| --- | --- | --- |
| Prompt construction in `handleGenerateDesign()` | Inline: `buildDesignDna()` + `buildPromptBundle()` | `agentExecutor.run('prompt-agent', input)` |
| `buildPromptBundle()` in `design-dna.ts` | Hardcoded vocabulary from `vocab.ts` | `prompt-compile` skill using resolved packs |
| `runGenerateExecution()` in `generation.ts` | Placeholder SVG artifacts | Provider call via `ProviderRouter`, then R2 upload |
| Provider selection in `runtime.ts` | `resolvePromptProviderSelection()` reads env vars | `ProviderRouter` with richer selection logic |
| Agent output recording | `prompt_agent_output_json` built inline | From validated `AgentRunResult.output` |

### 8.3 Current generate-design flow (Phase 3C)

```
handleGenerateDesign()                         // apps/api/src/index.ts
  -> buildDesignDna(input)                     // inline, ~30 lines
  -> buildPromptBundle(dna, notes, provider)   // inline, ~80 lines
  -> buildPromptSummary(input)                 // inline, ~10 lines
  -> INSERT designs, generations               // D1
  -> dispatchGenerateExecution()               // queue or local
    -> runGenerateExecution()                   // generation.ts
      -> insertPairArtifacts()                 // placeholder SVG data URLs
      -> persistSuccessfulGeneration()         // D1 updates
```

### 8.4 Future generate-design flow with agent runtime

```
handleGenerateDesign()                         // apps/api/src/index.ts (orchestration unchanged)
  -> agentExecutor.run('prompt-agent', input)   // NEW: agent runtime call
    -> skill('dna-resolve')(input)              // deterministic DNA (same logic)
    -> resolvePack('prompt-pack')              // pack resolution (new)
    -> resolvePack('style-pack')
    -> resolvePack('view-pack')
    -> skill('prompt-compile')(dna, packs)      // template interpolation (new)
    -> return validated PromptAgentOutput       // same schema as today
  -> INSERT designs, generations               // D1 (unchanged)
  -> dispatchGenerateExecution()               // queue or local (unchanged)
    -> runGenerateExecution()                   // generation.ts
      -> providerRouter.generateImage(bundle)  // NEW: real provider call
      -> upload to R2                          // NEW: real artifacts
      -> persistSuccessfulGeneration()         // D1 updates (unchanged)
```

### 8.5 Future spec flow

```
handleSpecRequest()
  -> validate design is selected               // existing platform check
  -> INSERT design_workflow_runs, design_specs // D1
  -> dispatch to SPEC_QUEUE
    -> fetch pair artifacts from R2            // existing R2 read
    -> agentExecutor.run('spec-agent', {       // NEW: agent runtime
         pairArtifacts, designDna, manufacturingIntent
       })
      -> resolvePack('spec-pack')
      -> providerRouter.structuredExtract()    // Claude for structured extraction
      -> return validated SpecAgentOutput
    -> UPDATE design_specs with output         // D1
```

### 8.6 What the agent runtime does NOT replace

- **Route handlers** -- they remain the orchestration layer
- **D1 writes** -- the caller persists results, not the agent
- **Queue dispatch** -- the caller decides queue vs local
- **Idempotency enforcement** -- stays in route handler
- **Auth/tenant enforcement** -- stays in route handler
- **Workflow state machine** -- stays in workflow binding

The agent runtime is a pure computation layer. It transforms inputs into validated outputs. All side effects (persistence, queue publish, R2 upload) remain in the caller.

### 8.7 Provider/model policy and routing

```ts
class ProviderRouter {
  constructor(private config: {
    primaryProvider: ProviderKind;
    secondaryProvider: ProviderKind;
    xaiApiKey?: string;
    googleApiKey?: string;
    anthropicApiKey?: string;
  }) {}

  async generateImage(bundle: PromptBundle, options: {
    provider?: ProviderKind;
    timeout: number;
    signal: AbortSignal;
  }): Promise<ImageGenerationResult> {
    const provider = options.provider ?? this.selectProvider('image-gen');
    switch (provider) {
      case 'xai': return this.xaiAdapter.generate(bundle, options);
      case 'google': return this.googleAdapter.generate(bundle, options);
    }
  }

  async structuredExtract(prompt: string, images: Buffer[], options: {
    outputSchema: ZodSchema;
    timeout: number;
    signal: AbortSignal;
  }): Promise<unknown> {
    return this.claudeAdapter.extract(prompt, images, options);
  }

  private selectProvider(capability: 'image-gen' | 'structured-text'): ProviderKind {
    // Same logic as current resolvePromptProviderSelection() but capability-aware:
    // 1. Check primary provider has API key for this capability
    // 2. Fall back to secondary
    // Future: per-tenant preferences, cost-based routing
  }
}
```

The current `xai -> google` provider ordering becomes a policy entry rather than a backend-wide assumption.

---

## 9. Migration plan from current prompt logic

### 9.1 Migration principle

The migration is a refactor, not a rewrite. Current behavior is preserved exactly. The prompt text produced by the new system must be identical to the current system for the same inputs.

### 9.2 Step 1: Extract vocabulary into pack objects

Move all constants from `vocab.ts` into `PROMPT_PACK_V1`:
- `typeCompositionPrompts` -> `PromptPackContent.typeCompositionPrompts`
- `metalDescriptions` -> `PromptPackContent.metalDescriptions`
- `gemstoneDescriptions` -> `PromptPackContent.gemstoneDescriptions`
- `styleDescriptions` -> `PromptPackContent.styleDescriptions`
- `defaultNegativePrompt` -> `PromptPackContent.defaultNegativePrompt`
- Provider directives -> `PromptPackContent.providerDirectives`

Move variation configs from `design-dna.ts`:
- `TYPE_SPECIFIC_VARIATION_CONFIGS` -> `PromptPackContent.variationConfigs`

Move rendering style text into `STYLE_PACK_V1`:
- Sketch rendering style -> `StylePackContent.sketchRenderingStyle`
- Render rendering style -> `StylePackContent.renderRenderingStyle`

Move view composition into `VIEW_PACK_V1`:
- Two-view layout per type -> `ViewPackContent.viewDefinitions`

**Validation:** Compile prompts from packs and compare to current `buildPromptBundle()` output for all 5 jewelry types x 4 metals x 6 styles. Must be character-identical.

### 9.3 Step 2: Create prompt-compile skill

Extract the interpolation logic from `buildPromptBundle()` into a `prompt-compile` skill. Keep `buildPromptBundle()` as a thin wrapper that calls the skill with bundled packs.

**Validation:** All existing tests pass. `buildPromptBundle()` still works.

### 9.4 Step 3: Create agent runtime package

Create `packages/agent-runtime/` with:
- Registry with `prompt-agent` registered
- Executor with input/output validation
- Pack resolver returning bundled constants
- Skills from extracted functions

**Validation:** `agentExecutor.run('prompt-agent', input)` produces the same `PromptAgentOutput` as current inline construction.

### 9.5 Step 4: Wire route handler to agent runtime

Replace inline prompt construction in `handleGenerateDesign()` with `agentExecutor.run('prompt-agent', input)`.

**Validation:** `POST /v1/generate-design` produces identical responses. `prompt_agent_output_json` has the same shape.

### 9.6 Step 5: Wire provider calls through provider router

Replace placeholder artifact generation in `runGenerateExecution()` with real provider calls through `providerRouter.generateImage()`. Independent of pack migration.

**Validation:** Real images from provider. Artifacts in R2. Generation status reflects real success/failure.

### 9.7 Rollback safety

Each step is independently deployable and reversible:
- Step 1: Pack objects are additive. `vocab.ts` unchanged.
- Step 2: `buildPromptBundle()` wrapper remains.
- Step 3: New package is additive. No existing code changes.
- Step 4: Revert = one line change back to inline construction.
- Step 5: Execution mode `local` with placeholder artifacts remains as fallback.

---

## 10. Immediate buildable slice vs later phases

### 10.1 What to build now (Phase 4A-immediate)

**Do not build any of this until the current product slice (Phase 3C/3D) is stable and merged.** This section defines the first implementation task after that.

| Item | Scope | Lines (est.) |
| --- | --- | --- |
| `packages/agent-runtime/` scaffold | `package.json`, `tsconfig.json`, basic exports | ~30 |
| Pack type definitions | `PackDefinition`, `PromptPackContent`, `StylePackContent`, `ViewPackContent` | ~80 |
| `PROMPT_PACK_V1` extraction | All `vocab.ts` constants + variation configs as pack object | ~120 |
| `STYLE_PACK_V1` extraction | Rendering style text as pack object | ~30 |
| `VIEW_PACK_V1` extraction | View composition rules per type as pack object | ~60 |
| `prompt-compile` skill | Interpolation logic from `buildPromptBundle()` using packs | ~80 |
| Comparison test | All 5 types x 4 metals x 6 styles, character-identical output | ~100 |
| **Total** | | **~500** |

This does not change any existing behavior. It creates the foundation that later steps build on. Zero lines of existing code modified.

### 10.2 What to build next (Phase 4B)

| Item | Depends on |
| --- | --- |
| `AgentRegistry`, `AgentExecutor`, `AgentContext` | Pack types from 4A |
| `prompt-agent` full registration | Executor + packs |
| `dna-resolve` skill extraction | Agent context |
| `prompt-summarize` skill extraction | Agent context |
| Route handler wiring (`handleGenerateDesign` -> executor) | Agent registration |
| `agent_runs` D1 migration | D1 schema |

### 10.3 What to build later (Phase 4C+)

| Item | Phase | Depends on |
| --- | --- | --- |
| `ProviderRouter` and adapter interfaces | 4C | Agent executor |
| xAI image generation adapter | 4C | Provider router + API key |
| Google image generation adapter | 4C | Provider router + API key |
| Real R2 artifact upload | 4C | Provider adapter returning real images |
| `refine-agent` + `RefinePackContent` | 4D | Prompt agent + refine flow |
| `spec-agent` + Claude adapter | 5 | Spec pack + Anthropic API key |
| Pack storage in D1 | 6 | Production data justifying complexity |
| Eval tracking tables | 6 | Production data to measure |
| `cad-prep-agent` | 6+ | SVG pipeline working |
| Per-tenant provider preferences | 6+ | Multi-tenant production |
| Authoring agent for pack drafts | 7+ | Eval data + pack versioning in D1 |

### 10.4 What to never build

| Item | Why not |
| --- | --- |
| Agent chat/conversation runtime | Agents are stateless functions, not chat bots |
| Per-project agent instances | Direction explicitly prohibits |
| Self-mutating production prompts | Direction explicitly prohibits |
| Generic agent framework (LangChain-style) | Over-engineering; agents are domain-specific |
| Agent-to-agent communication | Each agent invoked by caller; no inter-agent calls |
| Agent marketplace / plugin system | We control all agents |

---

## 11. Risks / blockers

### 11.1 Active blockers

| Blocker | Impact | Mitigation |
| --- | --- | --- |
| Phase 3C not merged to main | Cannot start implementation on integrated branch | Build architecture now (this doc); implement after merge |
| Remote Cloudflare resources not provisioned | Cannot test queue-backed execution | Local execution works; agent runtime independent of queue transport |
| No provider API keys | Cannot test real image generation | Pack system and agent runtime testable without provider calls |

### 11.2 Technical risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Pack extraction changes prompt output subtly | Medium | Character-comparison tests for all type/metal/style combos |
| Agent runtime adds latency | Low | Execution is local TypeScript, not remote. Only provider calls add latency (already expected) |
| Pack versioning complexity grows | Low | Start with bundled constants. Add D1 packs only with production evidence |
| Over-engineering before product validation | Medium | Immediate slice (10.1) is intentionally minimal (~500 lines) |
| Provider adapter abstraction doesn't fit real APIs | Medium | Build adapters one at a time. Let first two providers define the interface |

### 11.3 Organizational risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Architecture becomes stale before implementation | Medium | Update when implementation reveals wrong choices |
| Prompt quality needs jewelry domain expertise | High | Pack system makes vocab changes explicit and reviewable. But someone must know whether "prong setting" should be "4-prong basket" or "cathedral prong" |
| Building dynamic pack control plane too early | Medium | Explicitly deferred to Phase 6+ |

---

## 12. Recommended next Codex task

**Do not implement this architecture yet.** Current priority:
1. Stabilize and merge Phase 3C product slice
2. Wire real provider calls (xAI/Google image generation)
3. Deploy to Cloudflare (queues, worker)

**When ready to implement Phase 4A-immediate (section 10.1):**

Task: "Extract prompt vocabulary into versioned pack objects"

Scope:
1. Create `packages/agent-runtime/` with `package.json`, `tsconfig.json`
2. Define pack type interfaces (`PackDefinition`, `PromptPackContent`, `StylePackContent`, `ViewPackContent`)
3. Extract `vocab.ts` constants into `PROMPT_PACK_V1` object
4. Extract rendering style text into `STYLE_PACK_V1` object
5. Extract view composition rules into `VIEW_PACK_V1` object
6. Create `prompt-compile` skill: pack content + DNA + provider -> `PromptBundle`
7. Write comparison test: for all 5 types x 4 metals x 6 styles, pack-based compilation produces character-identical output to current `buildPromptBundle()`
8. Keep `buildPromptBundle()` working as backward-compatible wrapper

Definition of done:
- New package exists with pack types and bundled constants
- `prompt-compile` skill produces identical output to `buildPromptBundle()` for all input combinations
- No existing tests break
- No existing behavior changes
- `vocab.ts` and `design-dna.ts` are not modified (only wrapped)

Estimated scope: ~500 lines of new code, 0 lines of existing code changed.

---

## Appendix A: Glossary

| Term | Definition |
| --- | --- |
| **Agent** | A versioned, stateless function that transforms typed input into validated output using packs and providers |
| **Skill** | A reusable building-block function composed by agents (DNA resolution, prompt compilation, etc.) |
| **Pack** | A versioned bundle of content (vocabulary, templates, rules) consumed by agents at execution time |
| **Prompt pack** | Pack containing prompt templates and jewelry vocabulary for a specific stage |
| **Style pack** | Pack containing visual/aesthetic constraints and rendering style directives |
| **View pack** | Pack containing per-jewelry-type view definitions and composition rules |
| **Provider** | External service called through the runtime (xAI, Google, Claude) |
| **Provider router** | Component that selects and calls the right provider for a given capability |
| **Agent executor** | Component that validates input, runs the agent, validates output, enforces timeouts |
| **Agent registry** | Typed map of agent definitions, resolved by ID |
| **Pack resolver** | Component that finds and returns the active pack for a given pack ID |

## Appendix B: Proposed file map

```
packages/
  agent-runtime/
    package.json
    tsconfig.json
    src/
      index.ts                    # public API exports
      types.ts                    # AgentDefinition, SkillDefinition, PackDefinition, AgentContext, etc.
      registry.ts                 # AgentRegistry class
      executor.ts                 # AgentExecutor class
      validation.ts               # output schema enforcement helpers

      packs/
        types.ts                  # PromptPackContent, StylePackContent, ViewPackContent
        resolver.ts               # PackResolver class
        prompt-pack-v1.ts         # PROMPT_PACK_V1 (extracted from vocab.ts + design-dna.ts)
        style-pack-v1.ts          # STYLE_PACK_V1
        view-pack-v1.ts           # VIEW_PACK_V1

      skills/
        dna-resolve.ts            # extracted from design-dna.ts buildDesignDna()
        prompt-compile.ts         # extracted from design-dna.ts buildPromptBundle()
        prompt-summarize.ts       # extracted from design-dna.ts buildPromptSummary()
        search-index.ts           # extracted from design-dna.ts buildSearchText()

      providers/
        types.ts                  # ProviderKind, ImageGenerationResult
        router.ts                 # ProviderRouter class
        xai.ts                    # xAI image generation adapter
        google.ts                 # Google image generation adapter
        claude.ts                 # Claude structured text adapter

      agents/
        prompt-agent.ts           # prompt-agent AgentDefinition
        refine-agent.ts           # (future)
        spec-agent.ts             # (future)
        cad-prep-agent.ts         # (future)

      __tests__/
        prompt-compile.test.ts    # comparison: pack output vs current buildPromptBundle()
        executor.test.ts          # agent executor tests
        packs.test.ts             # pack resolution tests
```
