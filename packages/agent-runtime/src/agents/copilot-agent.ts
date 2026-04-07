import { z } from "zod";

import type { AgentDefinition } from "../types.ts";

// ── Input / Output schemas ──

export const CopilotAgentInputSchema = z.object({
  message: z.string().min(1),
  designContext: z.object({
    designId: z.string(),
    displayName: z.string(),
    jewelryType: z.string(),
    metal: z.string(),
    gemstones: z.array(z.string()),
    style: z.string(),
    selectionState: z.string(),
    hasSpec: z.boolean(),
    hasTechnicalSheet: z.boolean(),
  }),
});

export type CopilotAgentInput = z.infer<typeof CopilotAgentInputSchema>;

export const CopilotIntentSchema = z.enum([
  "refine",
  "spec",
  "explain",
  "suggest",
  "general",
]);

export type CopilotIntent = z.infer<typeof CopilotIntentSchema>;

export const CopilotSuggestedActionSchema = z
  .object({
    type: z.enum(["refine", "spec", "technical-sheet"]),
    instruction: z.string().optional(),
  })
  .optional();

export type CopilotSuggestedAction = z.infer<typeof CopilotSuggestedActionSchema>;

export const CopilotAgentOutputSchema = z.object({
  intent: CopilotIntentSchema,
  response: z.string(),
  suggestedAction: CopilotSuggestedActionSchema,
  designContext: z.string(),
});

export type CopilotAgentOutput = z.infer<typeof CopilotAgentOutputSchema>;

// ── Intent classification (keyword-based for Phase B4) ──

const REFINE_KEYWORDS = [
  "change", "modify", "refine", "adjust", "tweak", "simplify", "simplify",
  "make it", "could you", "try", "switch", "replace", "remove", "add",
  "thinner", "thicker", "bigger", "smaller", "different", "more", "less",
  "update", "alter", "redo", "rework",
];

const SPEC_KEYWORDS = [
  "spec", "specification", "specifications", "dimensions", "materials",
  "measurements", "bill of materials", "bom", "generate spec", "create spec",
  "technical", "construction",
];

const EXPLAIN_KEYWORDS = [
  "explain", "describe", "tell me about", "what is", "what are",
  "how does", "why", "walk me through", "break down", "understand",
  "meaning", "details",
];

const SUGGEST_KEYWORDS = [
  "suggest", "improve", "recommendation", "ideas", "better",
  "enhancement", "optimize", "what would you", "how can i",
  "what could", "alternatives", "options",
];

function classifyIntent(message: string): CopilotIntent {
  const lower = message.toLowerCase();

  const scores: Record<CopilotIntent, number> = {
    refine: 0,
    spec: 0,
    explain: 0,
    suggest: 0,
    general: 1,
  };

  for (const keyword of REFINE_KEYWORDS) {
    if (lower.includes(keyword)) scores.refine += 2;
  }
  for (const keyword of SPEC_KEYWORDS) {
    if (lower.includes(keyword)) scores.spec += 2;
  }
  for (const keyword of EXPLAIN_KEYWORDS) {
    if (lower.includes(keyword)) scores.explain += 2;
  }
  for (const keyword of SUGGEST_KEYWORDS) {
    if (lower.includes(keyword)) scores.suggest += 2;
  }

  let maxIntent: CopilotIntent = "general";
  let maxScore = 0;
  for (const [intent, score] of Object.entries(scores) as [CopilotIntent, number][]) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent;
    }
  }

  return maxIntent;
}

// ── Template-based response generation ──

function buildRefineResponse(
  message: string,
  ctx: CopilotAgentInput["designContext"],
): Pick<CopilotAgentOutput, "response" | "suggestedAction"> {
  const instruction = message.trim();
  return {
    response:
      `I understand you'd like to refine the ${ctx.jewelryType} design. ` +
      `The current design uses ${ctx.metal} with ${ctx.gemstones.join(", ")} in a ${ctx.style} style. ` +
      `I've prepared a refinement instruction based on your request. ` +
      `Click "Apply" below to open the Refine panel with this instruction pre-filled.`,
    suggestedAction: {
      type: "refine",
      instruction,
    },
  };
}

function buildSpecResponse(
  ctx: CopilotAgentInput["designContext"],
): Pick<CopilotAgentOutput, "response" | "suggestedAction"> {
  if (ctx.hasSpec) {
    return {
      response:
        `This ${ctx.jewelryType} design already has a specification generated. ` +
        `It covers the ${ctx.metal} construction with ${ctx.gemstones.join(", ")} gemstone details. ` +
        `You can view the full spec on the Specification screen, or regenerate it if the design has changed.`,
      suggestedAction: undefined,
    };
  }

  return {
    response:
      `No specification has been generated yet for this ${ctx.jewelryType} design. ` +
      `Generating a spec will produce structured details about dimensions, materials (${ctx.metal}), ` +
      `gemstone settings (${ctx.gemstones.join(", ")}), and construction notes. ` +
      `Click "Apply" to start the specification generation.`,
    suggestedAction: {
      type: "spec",
    },
  };
}

function buildExplainResponse(
  ctx: CopilotAgentInput["designContext"],
): Pick<CopilotAgentOutput, "response" | "suggestedAction"> {
  const gemstoneDescription =
    ctx.gemstones.length === 1
      ? `a ${ctx.gemstones[0]} gemstone`
      : `${ctx.gemstones.slice(0, -1).join(", ")} and ${ctx.gemstones[ctx.gemstones.length - 1]} gemstones`;

  return {
    response:
      `Here's what I see in this design:\n\n` +
      `**Type:** ${ctx.jewelryType}\n` +
      `**Metal:** ${ctx.metal}\n` +
      `**Gemstones:** ${gemstoneDescription}\n` +
      `**Style:** ${ctx.style}\n` +
      `**Status:** ${ctx.selectionState}\n\n` +
      `This is a ${ctx.style}-style ${ctx.jewelryType} crafted in ${ctx.metal}, ` +
      `featuring ${gemstoneDescription}. ` +
      (ctx.hasSpec
        ? "A specification has been generated — check the Spec screen for full construction details."
        : "No specification has been generated yet. Consider generating one to get detailed construction parameters.") +
      (ctx.hasTechnicalSheet
        ? " A technical sheet is also available with manufacturing-ready data."
        : ""),
    suggestedAction: undefined,
  };
}

function buildSuggestResponse(
  ctx: CopilotAgentInput["designContext"],
): Pick<CopilotAgentOutput, "response" | "suggestedAction"> {
  const suggestions: string[] = [];

  if (ctx.gemstones.length === 1) {
    suggestions.push(
      `Consider adding accent stones alongside the ${ctx.gemstones[0]} to create more visual depth.`,
    );
  }

  if (ctx.style === "contemporary") {
    suggestions.push(
      "You could try a minimalist refinement to emphasize clean lines and negative space.",
    );
  } else if (ctx.style === "minimalist") {
    suggestions.push(
      "Adding a subtle texture or engraving detail could enhance the minimalist aesthetic without overwhelming it.",
    );
  }

  if (!ctx.hasSpec) {
    suggestions.push(
      "Generate a specification to get exact dimension and material estimates before further refinement.",
    );
  }

  suggestions.push(
    `Experiment with the silhouette — tightening or loosening the profile can dramatically change the feel of a ${ctx.jewelryType}.`,
  );

  const bestSuggestion = suggestions[0];

  return {
    response:
      `Here are some ideas to improve your ${ctx.style} ${ctx.jewelryType} design:\n\n` +
      suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n") +
      `\n\nWould you like me to apply any of these as a refinement?`,
    suggestedAction: {
      type: "refine",
      instruction: bestSuggestion,
    },
  };
}

function buildGeneralResponse(
  message: string,
  ctx: CopilotAgentInput["designContext"],
): Pick<CopilotAgentOutput, "response" | "suggestedAction"> {
  return {
    response:
      `I'm your AI design assistant for this ${ctx.jewelryType} project. ` +
      `I can help you with:\n\n` +
      `- **Refining** the design (describe what you'd like to change)\n` +
      `- **Explaining** the current design details\n` +
      `- **Suggesting** improvements\n` +
      `- **Generating specifications** for manufacturing\n\n` +
      `Just describe what you need, and I'll assist you.`,
    suggestedAction: undefined,
  };
}

// ── Agent definition ──

export const copilotAgentDefinition: AgentDefinition<CopilotAgentInput, CopilotAgentOutput> = {
  agentId: "copilot-agent",
  version: "0.1.0",
  description:
    "Interprets user messages about a design and classifies intent into actionable responses (refine, spec, explain, suggest, general).",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: [],
  inputSchema: CopilotAgentInputSchema,
  outputSchema: CopilotAgentOutputSchema,
  timeoutMs: 3_000,
  retryable: false,
  executionKind: "deterministic",

  async execute(input) {
    const intent = classifyIntent(input.message);
    const ctx = input.designContext;

    let result: Pick<CopilotAgentOutput, "response" | "suggestedAction">;

    switch (intent) {
      case "refine":
        result = buildRefineResponse(input.message, ctx);
        break;
      case "spec":
        result = buildSpecResponse(ctx);
        break;
      case "explain":
        result = buildExplainResponse(ctx);
        break;
      case "suggest":
        result = buildSuggestResponse(ctx);
        break;
      case "general":
      default:
        result = buildGeneralResponse(input.message, ctx);
        break;
    }

    const designSummary =
      `${ctx.style} ${ctx.jewelryType} in ${ctx.metal} with ${ctx.gemstones.join(", ")} ` +
      `(${ctx.selectionState})`;

    return CopilotAgentOutputSchema.parse({
      intent,
      response: result.response,
      suggestedAction: result.suggestedAction,
      designContext: designSummary,
    });
  },
};
