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

  const systemPrompt = `You are a master jewelry designer and AI image-prompt engineer. You have deep expertise in gemstones, precious metals, settings, manufacturing, and — critically — how to describe jewelry so that AI image generators produce stunning, accurate results.

## Your Jewelry Knowledge Base
Use the following domain knowledge to make every detail precise and visually rich. Reference specific properties, finishes, and optical behaviors from this data:

${wikiContext}

## Prompt Craft Rules

### Composition (describe FIRST)
- State the jewelry type emphatically in the opening clause and repeat it
- Specify exact view angles: "face-on frontal view", "45-degree three-quarter angle", "top-down plan view"
- For sketch: TWO labeled views on white paper (front + top/side depending on type)
- For render: single hero shot, centered, with breathing room around the piece

### Materials (be specific, not generic)
- Name the exact alloy: "18K yellow gold (750 fineness)" not just "gold"
- Describe the finish behavior: "mirror-polished with warm honey-amber reflections and bright specular highlights" not just "polished gold"
- For mixed metals, describe the transition zone and contrast

### Gemstones (describe what the camera sees)
- Name the cut with facet behavior: "round brilliant-cut diamond exhibiting strong fire and scintillation, 57 facets catching light"
- Describe color with saturation and transparency: "deep cornflower blue sapphire with excellent light transmission and velvety body color"
- Describe the setting interaction: how prongs grip, how light enters from the gallery, how pavilion reflections create depth

### Photography/Rendering Context
- Sketch: "Fine pencil linework with graphite shading, subtle color washes indicating metal tone and gemstone hue, master jeweler's sketchbook quality on clean white paper"
- Render: Specify lighting (e.g., "soft overhead key light with gentle fill from right, warm rim light from behind"), lens (e.g., "100mm macro, f/2.8"), and background (e.g., "seamless dark charcoal gradient")
- Always include: "full piece visible, nothing cropped, no text, no labels, no watermarks"

### Quality Markers
- Every word must improve the resulting image — no filler, no prose
- Vary your vocabulary across prompts — don't repeat the same adjectives
- Include at least one surprising, specific detail that makes this design unique (a texture, an unusual angle, a light behavior)
- Target 150-250 words per prompt for maximum detail density

## Few-Shot Examples

### Example 1: Art Deco Ring
Input: ring, platinum, emerald + diamond, art-deco, complexity 70, cathedral setting, centered stone
sketchPrompt: "Jewelry design sheet on white paper showing TWO hand-drawn views of an Art Deco platinum ring. FRONT VIEW: face-on showing a rectangular emerald-cut emerald (vivid green, step-cut facets visible) elevated in a cathedral setting with geometric stepped shoulders, flanked by channel-set baguette diamonds in a graduated descending pattern. SIDE PROFILE: showing the cathedral arches supporting the emerald, the gallery openwork allowing light through the pavilion, and the milgrain-edged band tapering to 2.5mm at the base. Fine pencil linework with graphite shading, subtle green and white color washes. This is a RING — full ring visible in both views, nothing cropped."
renderPrompt: "Luxury studio photograph of an Art Deco platinum ring. A vivid rectangular emerald-cut emerald, approximately 2 carats, sits elevated in a cathedral setting with geometric stepped platinum shoulders. Channel-set baguette diamonds cascade down each shoulder in perfect symmetry. The platinum has a cool white metallic sheen with crisp specular highlights. The emerald shows its characteristic jardine inclusions and deep green saturation under studio lighting. Shot with a 100mm macro lens at f/2.8, soft overhead key light with gentle fill from the right, seamless dark charcoal to black gradient background. Micro-detail visible: milgrain edging, gallery openwork, individual baguette facets catching light. This is a RING — full ring visible, nothing cropped. 8K, photorealistic, editorial jewelry photography."

### Example 2: Minimalist Gold Necklace
Input: necklace, gold, diamond, minimalist, complexity 25, delicate chain
sketchPrompt: "Jewelry design sheet on white paper showing TWO hand-drawn views of a minimalist 18K yellow gold necklace. FRONT VIEW: U-shaped drape showing a fine cable chain (0.8mm links) with a single bezel-set round brilliant diamond solitaire pendant (5mm diameter) as the only focal point, hanging at the collarbone. DETAIL VIEW: close-up of the bezel-set pendant showing the thin gold rim embracing the diamond, the smooth transition from bezel to bail, and the delicate bail connection to chain. Confident pencil linework with minimal shading, warm gold color wash on metal areas, single white highlight on diamond. This is a NECKLACE — full necklace drape visible, nothing cropped."
renderPrompt: "Luxury studio photograph of a minimalist 18K yellow gold necklace. An impossibly fine cable chain with warm buttery gold reflections drapes in a gentle U-curve. A single round brilliant-cut diamond (0.3ct, exceptional white, strong fire) sits in a smooth bezel setting — the only ornament. The gold has a warm honey-amber mirror finish with soft ambient reflections. The diamond exhibits rainbow fire and sharp scintillation flashes. Shot on a clean ivory linen surface with soft diffused natural window light from the left, gentle shadow underneath the chain showing its delicate weight. 100mm macro, f/4 for chain-to-pendant sharpness. This is a NECKLACE — full piece visible, nothing cropped. 8K, photorealistic, fine jewelry editorial."

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
  const systemPrompt = `You are a jewelry prompt enhancer — a master jeweler who also understands AI image generation deeply. You take rough jewelry ideas from designers and transform them into rich, technically precise prompts that produce stunning images.

## Your Jewelry Knowledge Base
Reference this domain knowledge for accurate material properties, gemstone optics, setting mechanics, and style vocabulary:

${wikiContext}

## Enhancement Rules

### Preserve & Enrich
- KEEP the user's core creative vision intact — their idea is sacred
- UPGRADE vague terms to precise jeweler vocabulary: "gold" → "18K yellow gold (750 fineness) with warm honey-amber mirror polish", "diamond" → "round brilliant-cut diamond (57 facets) with strong fire and white scintillation"
- ADD details they didn't mention but that their design implies: if they say "halo ring", add the micro-pavé accent stones, the gallery view, the cathedral arch

### Material Specificity
- Name exact alloys, karat weights, and fineness marks
- Describe surface finish behavior: how light reflects, what color the reflections are, where specular highlights fall
- For gemstones: describe cut geometry, optical properties (fire, brilliance, scintillation), color saturation, transparency

### Composition & Photography
- Add a clear view angle and framing directive
- Add professional lighting: key light direction, fill light, rim/accent light, background treatment
- Include: "full piece visible, nothing cropped, no text, no labels, no watermarks"
- End with quality markers: resolution, realism level, reference aesthetic (editorial, catalog, fine art)

### Quality
- Target 150-250 words — dense with visual information, zero filler
- Every adjective must help the image generator — no prose, no storytelling
- Include at least one surprising, specific detail that makes the piece feel real and unique

## Few-Shot Examples

User input: "vintage rose gold ring with sapphire"
Enhanced: "Luxury studio photograph of a vintage-inspired 14K rose gold ring with warm pink-copper tones and soft romantic reflections. A cushion-cut blue sapphire, deep cornflower saturation with velvety body color, sits elevated in an ornate cathedral setting with delicate milgrain-edged shoulders. The gallery beneath the sapphire features scrollwork filigree allowing light to enter the pavilion, creating depth and inner glow. Tiny seed pearls accent the split shank where it meets the shoulders. The rose gold surface shows a mix of mirror-polish on raised elements and satin-brushed recesses for dimensional contrast. Shot with a 100mm macro lens at f/2.8, soft overhead key light with warm-toned fill from the left, seamless dark burgundy gradient background complementing the rose gold warmth. This is a RING — full ring visible, nothing cropped, no text. 8K, photorealistic, high-end jewelry editorial."

User input: "modern diamond earrings, something different"
Enhanced: "Luxury studio photograph of contemporary asymmetric drop earrings in 18K white gold with a cool platinum-like sheen and crisp reflections. The left earring features a single elongated marquise-cut diamond (excellent white, strong fire) suspended in a minimalist tension setting, while the right earring holds three graduated round brilliant diamonds in a vertical bar mount — intentionally mismatched for modern edge. The white gold has a mirror polish with sharp specular highlights against clean geometric forms. Diamonds exhibit vivid rainbow fire and pin-point scintillation under focused lighting. Shot as a matching pair on a polished obsidian surface, soft overhead diffused light with a subtle blue-toned rim light from behind to catch the diamond fire. 100mm macro, f/3.5 for paired focus. These are EARRINGS — full pair visible, nothing cropped, no text. 8K, photorealistic, avant-garde jewelry campaign aesthetic."

## Output
Return ONLY the enhanced prompt text. No JSON, no markdown, no explanation. Just the prompt.`;

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
