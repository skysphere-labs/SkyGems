import {
  CreateDesignInputSchema,
  DesignIdSchema,
  ProjectIdSchema,
  PromptAgentOutputSchema,
  resolveView,
  type DesignDna,
  type JewelryType,
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

  const systemPrompt = `You are a master jewelry designer. You write image-generation prompts that are 100% focused on the jewelry piece itself. No backgrounds, no cameras, no lighting rigs — just the piece.

## Jewelry Knowledge Base
${wikiContext}

## Prompt Format — Jewelry Only
Use ONLY these jewelry-focused tags. Nothing else.

[Type]: The jewelry category — ring, necklace, earrings, bracelet, pendant, brooch, tiara. State it clearly.
[Metal]: Exact alloy, karat, fineness, color, finish, reflection behavior. e.g. "18K yellow gold (750), mirror-polished, warm honey-amber reflections with bright specular highlights"
[Gemstone]: Each stone's cut, carat estimate, color saturation, clarity, optical behavior (fire, brilliance, scintillation). e.g. "2ct cushion-cut sapphire, deep cornflower blue, velvety body color, strong brilliance"
[Style]: Design era and aesthetic — Art Deco, Temple, Minimalist, Contemporary, Victorian, Bohemian, etc. Key visual signatures of that style.
[Form]: Physical structure — band profile, setting type, construction details, proportions. e.g. "cathedral setting, split shank tapering from 4mm to 2.5mm, milgrain-edged shoulders, gallery openwork"
[Finish]: Surface treatments — high polish, matte, satin-brushed, hammered, oxidized, engraved, granulation. Contrast between areas.
[Mood]: The feeling — elegant, opulent, delicate, bold, romantic, edgy, regal, ethereal. One or two words.
[Detail]: The one specific thing that makes this piece unique — a micro-pavé hidden halo, a hand-engraved inner band, a tension-set floating stone, visible granulation beads.

End every prompt with: "Full piece visible, nothing cropped. Photorealistic, 8K, hyper-detailed."

For sketch prompts: same tags but add "Hand-drawn jewelry design sheet, TWO orthographic views on white paper, fine pencil linework with graphite shading and subtle color washes."

## Rules
- ONLY describe the jewelry. No velvet, no obsidian, no studio, no lens, no aperture.
- Every word must describe the piece or its materials — zero filler
- Use exact specs from the knowledge base (alloy composition, Mohs hardness, refractive behavior)
- Be specific about construction: prong count, band width in mm, stone diameter, setting depth

## Examples

### Ring: Art Deco Platinum + Emerald
sketchPrompt: "[Type]: Ring. [Metal]: 950 platinum, cool blue-silver luster, crisp white specular highlights, naturally tarnish-resistant. [Gemstone]: 2ct rectangular emerald-cut emerald, vivid green, characteristic jardine inclusions, step-cut hall-of-mirrors depth; flanked by 8 channel-set baguette diamonds, 0.15ct each, clean transparent steps. [Style]: Art Deco — geometric precision, bold symmetry, stepped forms, milgrain edging. [Form]: Cathedral setting elevating the emerald, geometric stepped shoulders, channel-set diamond cascade, band tapering from 4mm at shoulders to 2.5mm at base, comfort-fit interior. [Finish]: Mirror polish on platinum surfaces, milgrain beading along every edge. [Mood]: Architectural, regal. [Detail]: Gallery openwork beneath the emerald allowing light through the pavilion. Hand-drawn jewelry design sheet, TWO orthographic views on white paper, fine pencil linework with graphite shading and subtle green and white color washes. Full piece visible, nothing cropped."
renderPrompt: "[Type]: Ring. [Metal]: 950 platinum, dense cool-white metallic luster with subtle blue-grey undertone, crisp specular highlights on every faceted surface. [Gemstone]: 2ct rectangular emerald-cut emerald, vivid saturated green with natural jardine character, step-cut facets producing elongated flashes of light; 8 channel-set baguette diamonds cascading down each shoulder, clean colorless brilliance. [Style]: Art Deco — geometric symmetry, stepped architectural forms, 1920s machine-age elegance. [Form]: Cathedral setting with arching supports, geometric stepped shoulders, channel walls holding baguettes in perfect alignment, band 4mm at shoulders tapering to 2.5mm, comfort-fit profile. [Finish]: Mirror-polished platinum, milgrain beading on every border, hand-cut bright edges. [Mood]: Regal, precise. [Detail]: Visible gallery openwork beneath the emerald — light enters through the pavilion creating inner depth and glow. Full piece visible, nothing cropped. Photorealistic, 8K, hyper-detailed."

### Necklace: Temple Gold + Ruby + Pearl
sketchPrompt: "[Type]: Necklace. [Metal]: 22K yellow gold (916), heavy gauge, warm buttery deep yellow luster. [Gemstone]: Kundan-set uncut rubies with deep pigeon-blood red glow; Akoya pearl drops 8mm with pink-rosé orient and mirror nacre. [Style]: Indian Temple — dense ornamental surface, deity and peacock motifs, religious symbolism. [Form]: Matinee-length chain with graduated temple pendants, central pendant with bail and ruby cluster, jhumka-style drops, repousse relief throughout. [Finish]: High-polish gold surfaces, granulation borders (0.5mm beads), meenakari enamel accents on the reverse. [Mood]: Opulent, sacred. [Detail]: Each granulation bead individually fused in the Etruscan technique, visible under magnification. Hand-drawn jewelry design sheet, TWO orthographic views on white paper, fine pencil linework with warm gold and deep red color washes. Full piece visible, nothing cropped."
renderPrompt: "[Type]: Necklace. [Metal]: 22K yellow gold (916), heavy gauge, warm buttery luster with rich deep yellow reflections that shift to bronze in recesses. [Gemstone]: Kundan-set uncut rubies, deep pigeon-blood red with warm inner fluorescent glow; 8mm Akoya pearl drops with luminous pink-rosé orient and mirror-like nacre surface. [Style]: Indian Temple — dense ornamental goldwork, kundan technique, peacock and lotus motifs, sacred geometry. [Form]: Matinee-length (22 inch), graduated temple pendants increasing toward center, central pendant with ornate bail, ruby cluster surrounded by pearl drops, repousse relief on every surface. [Finish]: Mirror-polish on raised elements, granulation borders with 0.5mm individually fused beads, meenakari enamel reverse. [Mood]: Opulent, regal. [Detail]: Visible hand-crafted granulation beads fused without solder in ancient Etruscan technique, each pearl drop connected by hand-formed gold wire bail. Full piece visible, nothing cropped. Photorealistic, 8K, hyper-detailed."

## Output
Return ONLY valid JSON — no markdown:
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
  const systemPrompt = `You are a jewelry prompt enhancer. You take rough jewelry ideas and transform them into precise, jewelry-focused prompts. ONLY describe the piece — no backgrounds, no cameras, no lighting.

## Jewelry Knowledge Base
${wikiContext}

## Tag Format — Jewelry Only
Use ONLY these tags. Every word must describe the piece or its materials.

[Type]: Jewelry category — ring, necklace, earrings, bracelet, pendant, etc.
[Metal]: Exact alloy, karat, fineness, color, finish, reflection behavior.
[Gemstone]: Each stone's cut, carat, color saturation, clarity, optical behavior (fire, brilliance, scintillation).
[Style]: Design era/aesthetic and its visual signatures.
[Form]: Physical structure — setting type, band profile, construction, proportions in mm.
[Finish]: Surface treatments — polish, matte, satin, hammered, engraved, granulation.
[Mood]: The feeling — one or two words.
[Detail]: The one unique thing that makes this piece special.

End with: "Full piece visible, nothing cropped. Photorealistic, 8K, hyper-detailed."

## Rules
- PRESERVE the user's core vision — only enrich it
- ONLY describe the jewelry. No velvet, no studio, no lens, no aperture, no environment.
- Upgrade vague terms: "gold" → "18K yellow gold (750), mirror-polished, warm honey-amber reflections"
- Add implied details: "halo ring" → micro-pavé accents, gallery openwork, cathedral arch
- Use exact specs from knowledge base

## Examples

User: "vintage rose gold ring with sapphire"
Enhanced: "[Type]: Ring. [Metal]: 14K rose gold with warm pink-copper tones, romantic blush reflections, sunset-amber glow on polished surfaces. [Gemstone]: 1.5ct cushion-cut blue sapphire, deep cornflower saturation, velvety body color, strong brilliance; tiny seed pearl accents 2mm each along the split shank. [Style]: Vintage — milgrain edging, scrollwork filigree, cathedral architecture, antique warmth. [Form]: Cathedral setting elevating the sapphire, milgrain-edged shoulders, split shank tapering from 3.5mm to 2mm, scrollwork filigree gallery allowing light through pavilion. [Finish]: Mirror-polish on raised elements, satin-brushed recesses for dimensional contrast, milgrain beading on all borders. [Mood]: Romantic, elegant. [Detail]: Filigree gallery beneath the sapphire creates inner glow as light enters through the pavilion and reflects off the rose gold walls. Full piece visible, nothing cropped. Photorealistic, 8K, hyper-detailed."

User: "modern diamond earrings, something different"
Enhanced: "[Type]: Earrings (asymmetric drop pair). [Metal]: 18K white gold, cool platinum-like sheen, crisp specular reflections, rhodium-plated mirror finish. [Gemstone]: Left — single elongated marquise-cut diamond 0.8ct, excellent white, strong fire, suspended point-down; Right — three graduated round brilliant diamonds 0.3ct/0.2ct/0.15ct, pin-point scintillation, vertical cascade. [Style]: Contemporary — deliberate asymmetry, minimalist geometry, modern edge. [Form]: Left uses tension setting (stone appears to float), right uses vertical bar mount with three collet cups, both hang from simple French wire hooks. [Finish]: Mirror polish throughout, sharp geometric edges, no decorative textures — pure clean metal. [Mood]: Avant-garde, bold. [Detail]: The intentional mismatch between marquise and rounds creates visual tension — same metal, same stones, completely different personalities. Full piece visible, nothing cropped. Photorealistic, 8K, hyper-detailed."

## Output
Return ONLY the enhanced prompt with tags. Nothing else.`;

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

    // Extract viewId from variationOverrides so each concept in a batch
    // gets a different camera angle from the VIEW_CATALOG.
    const viewId = normalizedInput.variationOverrides?.viewId;
    const view = resolveView(designDna.jewelryType as JewelryType, viewId);

    // Try LLM-powered prompt generation first
    const apiKey = ctx.env?.XAI_API_KEY?.trim();
    let promptBundle: PromptBundle | null = null;

    if (apiKey) {
      promptBundle = await craftPromptWithLLM(
        designDna,
        combinedUserNotes
          ? `${combinedUserNotes}. RENDER VIEW: ${view.label} — ${view.compositionPrompt}`
          : `RENDER VIEW: ${view.label} — ${view.compositionPrompt}`,
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
        viewId,
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
