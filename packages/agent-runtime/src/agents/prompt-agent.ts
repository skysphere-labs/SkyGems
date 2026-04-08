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
import { getWikiContextForDesign } from "../wiki/reader.ts";
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
 * Injects real wiki knowledge so the LLM has domain-specific vocabulary,
 * material behavior data, and proven prompt patterns to work from.
 */
async function craftPromptWithLLM(
  designDna: DesignDna,
  userNotes: string | undefined,
  refinementInstruction: string | undefined,
  apiKey: string,
): Promise<PromptBundle | null> {
  // Load wiki context specific to this design's attributes
  const wikiContext = getWikiContextForDesign(designDna);

  const systemPrompt = `You are a master jewelry designer and AI image-prompt engineer. You craft prompts using structured tags that image generation models parse most effectively.

## Your Jewelry Knowledge Base
${wikiContext}

## Structured Tag Format (MANDATORY)
Every render prompt MUST use these exact tags in this order. Each tag is a self-contained directive:

[Subject]: Describe the jewelry piece — type, metal alloy with fineness, gemstones with cut/color/optical properties, setting type, design features. Be hyper-specific.
[Action]: How the piece is positioned — resting, displayed, worn, angled. Describe what's being showcased (symmetry, fire, craftsmanship).
[Environment]: The surface and background — dark velvet, obsidian, marble, gradient. Include subtle contextual elements if the style demands it.
[Cinematography]: Camera specifics — lens (100mm macro), aperture (f/2.8-f/8), perspective (top-down, 3/4 angle, eye-level), framing (hero shot, flat lay).
[Lighting/Style]: Lighting setup — softbox, rim light, fill light, chiaroscuro. Aesthetic direction — elegant, opulent, minimalist, editorial.
[Technical]: Resolution (8K), realism level (photorealistic/hyper-detailed), specific render qualities (caustic patterns, refraction, specular highlights).

For sketch prompts, use the same tags but adapted for illustration:
[Subject]: Same jewelry description but as a technical drawing
[Action]: "Displayed as TWO hand-drawn views side by side on white paper: FRONT VIEW and TOP/SIDE VIEW"
[Environment]: "Clean white drafting paper with subtle shadow"
[Cinematography]: "Flat scan of jeweler's design sheet, orthographic projection"
[Lighting/Style]: "Fine pencil linework, graphite shading, subtle color washes for metal tone and gemstone hue"
[Technical]: "Master jeweler's sketchbook quality, labeled views, precise proportions, nothing cropped"

## Rules
- Use exact alloy specs from the knowledge base (18K = 750 fineness, etc.)
- Describe gemstone optical properties: fire, brilliance, scintillation, refractive behavior
- Every word must improve the image — no filler
- Always state "full piece visible, nothing cropped" in the subject or technical tag
- Vary vocabulary across prompts

## Few-Shot Examples

### Example 1: Art Deco Platinum Ring
Input: ring, platinum, emerald + diamond, art-deco, complexity 70, cathedral setting
sketchPrompt: "[Subject]: A technical jewelry design sheet of an Art Deco platinum ring featuring a rectangular emerald-cut emerald in a cathedral setting with geometric stepped shoulders and channel-set baguette diamonds. Full ring visible. [Action]: Displayed as TWO hand-drawn views side by side: FRONT VIEW showing the setting face-on with emerald and diamond cascade, and SIDE PROFILE showing cathedral arches, gallery openwork, and milgrain-edged band tapering to 2.5mm. [Environment]: Clean white drafting paper. [Cinematography]: Flat orthographic projection, jeweler's design sheet format. [Lighting/Style]: Fine pencil linework with graphite shading, subtle green and white color washes indicating emerald and diamond. [Technical]: Master jeweler's sketchbook quality, precise proportions, labeled views, nothing cropped."
renderPrompt: "[Subject]: A luxurious Art Deco platinum ring featuring a 2-carat rectangular emerald-cut emerald with vivid green saturation and characteristic jardine inclusions, elevated in a cathedral setting with geometric stepped platinum shoulders, flanked by channel-set baguette diamonds in graduated descending symmetry. Full ring visible, nothing cropped. [Action]: Resting on a reflective surface, showcasing the geometric precision and the emerald's step-cut hall-of-mirrors depth effect from a slight elevated angle. [Environment]: A polished dark obsidian surface with subtle reflections, seamless charcoal-to-black gradient background isolating the ring. [Cinematography]: Macro photography, 100mm lens, f/2.8 aperture for shallow depth of field with tack-sharp focus on the emerald's table facet. [Lighting/Style]: Professional studio jewelry lighting, soft overhead key light with gentle fill from right, warm rim light accentuating the platinum's cool blue-silver sheen, crisp specular highlights on milgrain edging. [Technical]: 8K resolution, photorealistic, hyper-detailed gallery openwork, individual baguette facets catching light, commercial jewelry editorial standard."

### Example 2: Temple Gold Necklace
Input: necklace, gold, ruby + pearl, temple, complexity 80
sketchPrompt: "[Subject]: A technical design sheet of a traditional Indian temple necklace in heavy 22K yellow gold with kundan-set rubies, pearl drops, and ornate repousse peacock motifs. Full necklace visible. [Action]: Displayed as TWO views: FRONT VIEW showing complete U-shaped drape with graduated temple pendants, and DETAIL VIEW of the central pendant with bail and ruby cluster. [Environment]: Clean white drafting paper. [Cinematography]: Flat orthographic jeweler's sheet. [Lighting/Style]: Fine pencil linework with warm gold and deep red color washes, detailed granulation textures. [Technical]: Master jeweler's sketchbook, precise proportions, nothing cropped."
renderPrompt: "[Subject]: A magnificent heavy 22-karat yellow gold Indian temple necklace with warm buttery luster, intricate kundan-set deep pigeon-blood rubies with warm inner fluorescent glow, luminous white Akoya pearl drops with pink-rosé orient, dense repousse peacock and lotus motifs with granulation borders. Full necklace visible, nothing cropped. [Action]: Resting elegantly on a dark velvet display form, showcasing the heavy drape, intricate goldwork, and the interplay between ruby fire and pearl luster. [Environment]: Rich dark maroon velvet surface, warm ambient glow suggesting palace interior, subtle gold-leaf reflections in the background. [Cinematography]: Macro close-up, 100mm lens, f/4 for depth across the full piece, slight elevated three-quarter angle. [Lighting/Style]: Chiaroscuro lighting, warm directional spotlight accentuating ruby fire and gold reflections, soft rim light separating the necklace from velvet, opulent and majestic aesthetic. [Technical]: 8K resolution, ultra-photorealistic, hyper-detailed granulation textures, accurate gemstone refraction, commercial jewelry photography standard."

## Output Format
Return ONLY valid JSON — no markdown, no explanation:
{"sketchPrompt": "...", "renderPrompt": "...", "negativePrompt": "..."}`;

  const briefParts = [
    `Jewelry type: ${designDna.jewelryType}`,
    `Metal: ${designDna.metal}`,
    `Gemstones: ${designDna.gemstones.length > 0 ? designDna.gemstones.join(", ") : "none — pure metalwork"}`,
    `Style: ${designDna.style}`,
    `Complexity: ${designDna.complexity}/100 (${designDna.complexity <= 25 ? "minimal, clean, essential forms only" : designDna.complexity <= 50 ? "moderate detail, balanced elegance" : designDna.complexity <= 75 ? "rich detail, layered elements, intricate work" : "maximum complexity, dense ornamentation, master-level craft"})`,
    `Band/form style: ${designDna.bandStyle}`,
    `Setting type: ${designDna.settingType}`,
    `Stone position: ${designDna.stonePosition}`,
    `Profile: ${designDna.profile}`,
    `Motif: ${designDna.motif}`,
  ];

  if (userNotes) briefParts.push(`Designer notes: ${userNotes}`);
  if (refinementInstruction) briefParts.push(`Refinement: ${refinementInstruction}`);

  const userMessage = `Create expert image-generation prompts for this jewelry design. Use the knowledge base above for precise material descriptions, gemstone optical properties, and setting mechanics. Make each prompt vivid, specific, and unique:\n\n${briefParts.join("\n")}`;

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
        temperature: 0.75,
        max_tokens: 2500,
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
      negativePrompt: parsed.negativePrompt ?? "Blurry, low quality, distorted, text, watermark, extra fingers, deformed, incomplete jewelry, cropped edges, floating elements, disconnected parts, unrealistic proportions",
    };
  } catch {
    return null;
  }
}

/**
 * Enhances a user's free-text jewelry description into an expert-quality
 * image generation prompt using the jewelry wiki as domain knowledge.
 * Standalone function — not part of the agent pipeline.
 */
export async function enhanceFreeTextPrompt(
  freeText: string,
  wikiContext: string,
  apiKey: string,
): Promise<{ enhancedText: string } | null> {
  const systemPrompt = `You are a jewelry prompt enhancer. You take rough jewelry ideas and transform them into structured, tag-formatted prompts that image generation models parse most effectively.

## Your Jewelry Knowledge Base
${wikiContext}

## Structured Tag Format (MANDATORY)
Your output MUST use these exact tags in this order:

[Subject]: The jewelry piece — type, metal with alloy/fineness, gemstones with cut/color/optical properties, setting, design features. Be hyper-specific. Upgrade vague terms ("gold" → "18K yellow gold (750 fineness) with warm honey-amber mirror polish"). State "full piece visible, nothing cropped."
[Action]: How the piece is positioned and what's being showcased — resting flat, displayed on a form, angled to catch light. What the viewer should notice first.
[Environment]: Surface and background — dark velvet, obsidian, marble, gradient, contextual setting. Match the style (temple → palace interior, minimalist → clean white).
[Cinematography]: Camera — lens (100mm macro), aperture (f/2.8-f/8), perspective (top-down, 3/4, eye-level), framing.
[Lighting/Style]: Lighting setup and aesthetic — softbox, rim light, chiaroscuro, warm/cool tone. Style keywords (elegant, opulent, editorial, avant-garde).
[Technical]: 8K resolution, photorealistic, specific render qualities (caustic patterns, refraction, specular highlights, commercial standard).

## Rules
- PRESERVE the user's core vision — their idea is sacred, only enrich it
- Use the knowledge base for exact alloy specs, gemstone optical properties, setting mechanics
- Every word must improve the image — no filler, no prose
- Add details the user implied but didn't state (halo ring → micro-pavé accents, gallery view)

## Few-Shot Examples

User input: "vintage rose gold ring with sapphire"
Enhanced: "[Subject]: A vintage-inspired 14K rose gold ring with warm pink-copper tones and romantic blush reflections, featuring a cushion-cut blue sapphire with deep cornflower saturation and velvety body color, elevated in an ornate cathedral setting with delicate milgrain-edged shoulders, scrollwork filigree gallery allowing light through the pavilion, tiny seed pearl accents on the split shank. Full ring visible, nothing cropped. [Action]: Resting at a slight angle on a reflective surface, showcasing the sapphire's inner glow and the dimensional contrast between mirror-polish raised elements and satin-brushed recesses. [Environment]: Seamless dark burgundy velvet gradient complementing the rose gold warmth, subtle warm ambient reflections. [Cinematography]: Macro photography, 100mm lens, f/2.8, slight elevated three-quarter angle. [Lighting/Style]: Soft overhead key light with warm-toned fill from left, gentle rim light catching the milgrain edges, romantic and elegant aesthetic. [Technical]: 8K resolution, photorealistic, hyper-detailed filigree textures, accurate sapphire refraction, high-end jewelry editorial standard."

User input: "modern diamond earrings, something different"
Enhanced: "[Subject]: Contemporary asymmetric drop earrings in 18K white gold with cool platinum-like sheen and crisp specular reflections — left earring features a single elongated marquise-cut diamond (excellent white, strong fire) in a minimalist tension setting, right earring holds three graduated round brilliant diamonds in a vertical bar mount, intentionally mismatched for modern edge. Full pair visible, nothing cropped. [Action]: Displayed as a matching pair, angled to catch maximum diamond fire and scintillation, showcasing the deliberate asymmetry. [Environment]: Polished obsidian surface with subtle mirror reflections, clean dark gradient background. [Cinematography]: Macro, 100mm lens, f/3.5 for paired focus, eye-level perspective. [Lighting/Style]: Soft overhead diffused light with blue-toned rim light from behind catching diamond fire, pin-point specular highlights, avant-garde jewelry campaign aesthetic. [Technical]: 8K resolution, photorealistic, hyper-detailed diamond facet refraction, vivid rainbow fire dispersion, commercial editorial standard."

## Output
Return ONLY the enhanced prompt with tags. No JSON wrapper, no markdown, no explanation.`;

  const userMessage = `Enhance this jewelry description into an expert image-generation prompt. Use the knowledge base above for precise details:\n\n${freeText}`;

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
        temperature: 0.6,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    return { enhancedText: text };
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
