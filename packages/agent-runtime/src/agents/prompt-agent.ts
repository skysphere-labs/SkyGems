import {
  CreateDesignInputSchema,
  DesignIdSchema,
  ProjectIdSchema,
  PromptAgentOutputSchema,
  type DesignDna,
  type PromptAgentOutput,
  type PromptBundle,
} from "@skygems/shared";
import { z } from "zod";

import { resolveDesignDna } from "../skills/dna-resolve.ts";
import { compilePromptBundle } from "../skills/prompt-compile.ts";
import type { AgentContext, AgentDefinition, PromptAgentInput } from "../types.ts";
import type { ViewPlan } from "../packs/types.ts";

export const PromptAgentInputSchema = z.object({
  mode: z.enum(["generate", "refine"]),
  projectId: ProjectIdSchema,
  designId: DesignIdSchema,
  input: CreateDesignInputSchema,
  sourceDesignId: DesignIdSchema.optional(),
  provider: z.enum(["xai", "google"]).optional(),
  refinementInstruction: z.string().trim().max(1200).optional(),
});

/**
 * Calls an LLM to craft an expert jewelry design prompt.
 * This is real AI — not template concatenation.
 */
async function craftPromptWithLLM(
  designDna: DesignDna,
  userNotes: string | undefined,
  refinementInstruction: string | undefined,
  apiKey: string,
): Promise<PromptBundle | null> {
  const systemPrompt = `You are a master jewelry designer and AI prompt engineer with deep expertise in gemstones, precious metals, settings, and manufacturing.

Your job: write TWO image-generation prompts (sketch + render) that produce stunning, accurate jewelry design images.

## Prompt Rules
1. COMPOSITION FIRST: Describe framing, view angle, and layout BEFORE materials.
2. Be precise about metal color, finish, reflections — use the exact visual descriptions from your knowledge base.
3. Describe gemstone cut, clarity, fire, and light interaction with specificity.
4. Include photography context: lighting setup, lens, background.
5. Every word must improve the image. No filler.
6. The sketch prompt → technical design sheet with labeled multi-angle views on white paper.
7. The render prompt → luxury studio photograph with professional jewelry photography lighting.
8. Always state the jewelry type emphatically and repeat it.
9. Always state "full piece visible, nothing cropped."

Return ONLY valid JSON:
{"sketchPrompt": "...", "renderPrompt": "...", "negativePrompt": "..."}`;

  const briefParts = [
    `Jewelry type: ${designDna.jewelryType}`,
    `Metal: ${designDna.metal}`,
    `Gemstones: ${designDna.gemstones.length > 0 ? designDna.gemstones.join(", ") : "none — pure metalwork"}`,
    `Style: ${designDna.style}`,
    `Complexity: ${designDna.complexity}/100`,
    `Band style: ${designDna.bandStyle}`,
    `Setting type: ${designDna.settingType}`,
    `Stone position: ${designDna.stonePosition}`,
    `Profile: ${designDna.profile}`,
    `Motif: ${designDna.motif}`,
  ];

  if (userNotes) briefParts.push(`Designer notes: ${userNotes}`);
  if (refinementInstruction) briefParts.push(`Refinement: ${refinementInstruction}`);

  const userMessage = `Create the best possible image generation prompts for this jewelry design. Use your knowledge base to make every detail accurate and specific:\n\n${briefParts.join("\n")}`;

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
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      sketchPrompt?: string;
      renderPrompt?: string;
      negativePrompt?: string;
    };

    if (!parsed.sketchPrompt || !parsed.renderPrompt) return null;

    return {
      sketchPrompt: parsed.sketchPrompt,
      renderPrompt: parsed.renderPrompt,
      negativePrompt: parsed.negativePrompt ?? "Blurry, low quality, distorted, text, watermark, extra fingers, deformed",
    };
  } catch {
    return null;
  }
}

export const promptAgentDefinition: AgentDefinition<PromptAgentInput, PromptAgentOutput> = {
  agentId: "prompt-agent",
  version: "2.0.0",
  description: "Uses LLM intelligence to craft expert jewelry design prompts from user selections. Falls back to template compilation if LLM unavailable.",
  requiredPacks: ["prompt-pack"],
  requiredProviders: ["prompt_compilation"],
  skills: ["dna-resolve", "view-plan", "jewelry-rules", "prompt-compile"],
  inputSchema: PromptAgentInputSchema,
  outputSchema: PromptAgentOutputSchema,
  timeoutMs: 15_000,
  retryable: true,
  executionKind: "hybrid",
  async execute(input, ctx) {
    const { normalizedInput, designDna } = await resolveDesignDna(input.input);
    const combinedUserNotes = [normalizedInput.userNotes, input.refinementInstruction]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(" ");

    // Try LLM-powered prompt generation first
    const apiKey = ctx.env?.XAI_API_KEY?.trim();
    let promptBundle: PromptBundle | null = null;

    if (apiKey) {
      promptBundle = await craftPromptWithLLM(
        designDna,
        combinedUserNotes || undefined,
        input.refinementInstruction,
        apiKey,
      );
    }

    // Fall back to deterministic template compilation
    if (!promptBundle) {
      const viewPlan = await ctx.skillRegistry.run<ViewPlan>("view-plan", {
        jewelryType: designDna.jewelryType,
        viewPack: ctx.viewPack,
      });
      promptBundle = compilePromptBundle({
        designDna,
        userNotes: combinedUserNotes || undefined,
        provider: input.provider ?? ctx.provider,
        promptPack: ctx.promptPack,
        viewPlan,
      });
    }

    return PromptAgentOutputSchema.parse({
      schemaVersion: "prompt_agent.v1",
      mode: input.mode,
      projectId: input.projectId,
      designId: input.designId,
      sourceDesignId: input.sourceDesignId,
      pairStandardVersion: normalizedInput.pairStandardVersion,
      normalizedInput: {
        jewelryType: normalizedInput.jewelryType,
        metal: normalizedInput.metal,
        gemstones: normalizedInput.gemstones,
        style: normalizedInput.style,
        complexity: normalizedInput.complexity,
        variationOverrides: normalizedInput.variationOverrides,
        userNotes: combinedUserNotes || undefined,
        pairStandardVersion: normalizedInput.pairStandardVersion,
        refinementInstruction: input.refinementInstruction,
      },
      designDna,
      promptBundle,
      blocked: false,
      blockReasons: [],
    });
  },
};
