import { z } from "zod";

import { getFullWikiContext } from "../wiki/reader.ts";
import type { AgentContext, AgentDefinition } from "../types.ts";

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

// ── LLM-powered copilot ──

async function generateCopilotResponseWithLLM(
  message: string,
  designContext: CopilotAgentInput["designContext"],
  apiKey: string,
): Promise<CopilotAgentOutput | null> {
  const wikiContext = getFullWikiContext();

  const systemPrompt = `You are an expert jewelry design assistant helping a designer work on their piece. You have deep knowledge of jewelry manufacturing, gemstones, metals, and design styles.

## Jewelry Knowledge Base (abridged)
${wikiContext.slice(0, 6000)}

## Current Design
- Type: ${designContext.jewelryType}
- Metal: ${designContext.metal}
- Gemstones: ${designContext.gemstones.join(", ") || "none"}
- Style: ${designContext.style}
- Name: ${designContext.displayName}
- Has specification: ${designContext.hasSpec ? "yes" : "no"}
- Has technical sheet: ${designContext.hasTechnicalSheet ? "yes" : "no"}
- Status: ${designContext.selectionState}

## Your Role
- Answer questions about this specific design with domain expertise
- Suggest refinements when asked, being specific about what to change
- Explain design decisions using the knowledge base
- Recommend next steps (generate spec, refine, etc.)

## Output
Return ONLY valid JSON — no markdown:
{
  "intent": "refine|spec|explain|suggest|general",
  "response": "your detailed response to the user",
  "suggestedAction": { "type": "refine|spec|technical-sheet", "instruction": "optional instruction" } or null,
  "designContext": "brief summary of the current design"
}

For the intent field:
- "refine" if the user wants to change the design
- "spec" if the user is asking about specifications or wants to generate one
- "explain" if the user wants to understand something about the design
- "suggest" if the user wants ideas or improvements
- "general" for anything else`;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.6,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return CopilotAgentOutputSchema.parse(parsed);
  } catch {
    return null;
  }
}

// ── Deterministic fallback (keyword-based) ──

const REFINE_KEYWORDS = [
  "change", "modify", "refine", "adjust", "tweak", "simplify",
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
  const scores: Record<CopilotIntent, number> = { refine: 0, spec: 0, explain: 0, suggest: 0, general: 1 };

  for (const keyword of REFINE_KEYWORDS) { if (lower.includes(keyword)) scores.refine += 2; }
  for (const keyword of SPEC_KEYWORDS) { if (lower.includes(keyword)) scores.spec += 2; }
  for (const keyword of EXPLAIN_KEYWORDS) { if (lower.includes(keyword)) scores.explain += 2; }
  for (const keyword of SUGGEST_KEYWORDS) { if (lower.includes(keyword)) scores.suggest += 2; }

  let maxIntent: CopilotIntent = "general";
  let maxScore = 0;
  for (const [intent, score] of Object.entries(scores) as [CopilotIntent, number][]) {
    if (score > maxScore) { maxScore = score; maxIntent = intent; }
  }
  return maxIntent;
}

function buildFallbackResponse(
  message: string,
  ctx: CopilotAgentInput["designContext"],
): Pick<CopilotAgentOutput, "response" | "suggestedAction"> {
  const intent = classifyIntent(message);

  if (intent === "refine") {
    return {
      response: `I understand you'd like to refine the ${ctx.jewelryType} design. The current design uses ${ctx.metal} with ${ctx.gemstones.join(", ")} in a ${ctx.style} style. Click "Apply" to open the Refine panel.`,
      suggestedAction: { type: "refine", instruction: message.trim() },
    };
  }
  if (intent === "spec") {
    if (ctx.hasSpec) {
      return { response: `This ${ctx.jewelryType} already has a specification. You can view it on the Specification screen.`, suggestedAction: undefined };
    }
    return { response: `No specification yet. Generating one will produce dimensions, materials, and construction details.`, suggestedAction: { type: "spec" } };
  }
  if (intent === "explain") {
    return {
      response: `**Type:** ${ctx.jewelryType}\n**Metal:** ${ctx.metal}\n**Gemstones:** ${ctx.gemstones.join(", ")}\n**Style:** ${ctx.style}\n**Status:** ${ctx.selectionState}`,
      suggestedAction: undefined,
    };
  }
  if (intent === "suggest") {
    return {
      response: `Some ideas for your ${ctx.style} ${ctx.jewelryType}:\n1. Experiment with the silhouette\n2. ${!ctx.hasSpec ? "Generate a specification for exact measurements" : "Review the spec for refinement opportunities"}`,
      suggestedAction: { type: "refine", instruction: `Improve the ${ctx.style} aesthetic` },
    };
  }
  return {
    response: `I'm your AI design assistant for this ${ctx.jewelryType}. I can help with refining, explaining, suggesting improvements, or generating specifications.`,
    suggestedAction: undefined,
  };
}

// ── Agent definition ──

export const copilotAgentDefinition: AgentDefinition<CopilotAgentInput, CopilotAgentOutput> = {
  agentId: "copilot-agent",
  version: "2.0.0",
  description: "Uses LLM intelligence to interpret user messages and provide expert jewelry design advice. Falls back to keyword-based responses if LLM unavailable.",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: [],
  inputSchema: CopilotAgentInputSchema,
  outputSchema: CopilotAgentOutputSchema,
  timeoutMs: 15_000,
  retryable: true,
  executionKind: "hybrid",

  async execute(input, ctx) {
    const apiKey = ctx.env?.XAI_API_KEY?.trim();

    // Try LLM-powered response first
    if (apiKey) {
      const llmResult = await generateCopilotResponseWithLLM(
        input.message,
        input.designContext,
        apiKey,
      );
      if (llmResult) return llmResult;
    }

    // Deterministic fallback
    const intent = classifyIntent(input.message);
    const result = buildFallbackResponse(input.message, input.designContext);
    const designSummary = `${input.designContext.style} ${input.designContext.jewelryType} in ${input.designContext.metal} with ${input.designContext.gemstones.join(", ")} (${input.designContext.selectionState})`;

    return CopilotAgentOutputSchema.parse({
      intent,
      response: result.response,
      suggestedAction: result.suggestedAction,
      designContext: designSummary,
    });
  },
};
