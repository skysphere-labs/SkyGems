/**
 * Jewelry Design Prompt Generator
 *
 * Production-oriented prompts for AI image generation.
 * Key principle: COMPOSITION FIRST, details second.
 * AI models prioritize the first ~100 words — framing must come before style.
 *
 * From a jeweler/maker's perspective, every image must show:
 * - The COMPLETE piece end-to-end, nothing cropped
 * - The specific jewelry type (no substitutions)
 * - Construction details (settings, closures, profiles)
 * - Wearable proportions
 */

import { generateVariations, formatVariationsForPrompt, SelectedVariations } from '../services/variationEngine';

export interface JewelryDesignParams {
  type: string;
  metal: string;
  gemstones: string[];
  style: string;
  complexity: number;
  variations?: number;
  customVariation?: Partial<SelectedVariations>;
}

// ── Composition instructions per type (this is what fixes the cropping) ──
// These go FIRST in the prompt so the model frames correctly

const TYPE_COMPOSITION: Record<string, string> = {
  ring: `A jewelry design sheet showing TWO hand-drawn views of the same finger ring on white paper: a FRONT VIEW (showing the ring face-on with the setting visible) and a TOP VIEW from directly above (showing the band as a circle with the head/crown). Both views clearly labeled by position, drawn side by side with space between them. The full ring is visible in each view — nothing cropped.`,

  necklace: `A jewelry design sheet showing TWO hand-drawn views of the same necklace on white paper: a FRONT VIEW (the complete necklace laid in a U-shape, clasp to clasp, pendant centered) and a DETAIL VIEW of the pendant from the front showing the bail and setting. Both views drawn side by side. The entire necklace is visible in the front view — nothing cropped.`,

  earrings: `A jewelry design sheet showing TWO hand-drawn views of the same earring on white paper: a FRONT VIEW (the earring face-on, from ear wire to lowest point) and a SIDE PROFILE VIEW (showing depth and construction). Also show the matching pair. All views clearly drawn with space between them. Nothing cropped.`,

  bracelet: `A jewelry design sheet showing TWO hand-drawn views of the same bracelet on white paper: a TOP VIEW (the complete bracelet as a closed oval from above, clasp visible) and a SIDE PROFILE VIEW (showing the bracelet edge-on to reveal width and thickness). Both views drawn side by side. The full bracelet is visible — nothing cropped.`,

  pendant: `A jewelry design sheet showing TWO hand-drawn views of the same pendant on white paper: a FRONT VIEW (pendant face-on with bail at top) and a SIDE PROFILE VIEW (showing depth and construction). Both views drawn side by side with space between them. Nothing cropped.`,
};

const METAL_SHORT: Record<string, string> = {
  gold: '18K polished yellow gold with warm reflections',
  silver: 'sterling silver with bright cool reflections',
  platinum: 'polished platinum with white metallic sheen',
  'rose-gold': '14K rose gold with warm pink-copper tones',
};

const GEM_SHORT: Record<string, string> = {
  diamond: 'brilliant-cut clear diamond with rainbow fire',
  ruby: 'faceted deep red ruby',
  emerald: 'emerald-cut green emerald',
  sapphire: 'cushion-cut blue sapphire',
  pearl: 'round white Akoya pearl with lustre',
};

const STYLE_SHORT: Record<string, string> = {
  contemporary: 'modern minimalist with clean lines and artistic asymmetry',
  minimalist: 'ultra-minimal, every element essential, no ornament',
  vintage: 'vintage-inspired with milgrain edges and filigree details',
  temple: 'traditional temple jewelry motifs — peacock, lotus, paisley patterns',
  floral: 'organic botanical forms — petals, leaves, flowing vines',
  geometric: 'geometric and architectural — clean angles, structured symmetry',
};

function getComplexityShort(complexity: number): string {
  if (complexity <= 25) return 'simple and clean';
  if (complexity <= 50) return 'moderate detail';
  if (complexity <= 75) return 'intricate with filigree and texture';
  return 'highly elaborate with dense ornamentation';
}

/**
 * Generate a concise, composition-first jewelry prompt.
 * The composition/framing instruction is ALWAYS the first sentence.
 */
export function generateJewelryPrompt(params: JewelryDesignParams): string {
  const { type, metal, gemstones, style, complexity, customVariation } = params;

  // Composition FIRST — this is the most important part
  const composition = TYPE_COMPOSITION[type] || TYPE_COMPOSITION.ring;
  const metalDesc = METAL_SHORT[metal] || metal;
  const styleDesc = STYLE_SHORT[style] || style;
  const complexityDesc = getComplexityShort(complexity);

  // Gemstone description
  let gemDesc: string;
  if (gemstones.length === 0) {
    gemDesc = 'No gemstones — pure metalwork design.';
  } else {
    const gems = gemstones.map((g) => GEM_SHORT[g] || g).join(' and ');
    gemDesc = `Set with ${gems}, stones clearly visible in their settings.`;
  }

  // Variation details
  let selectedVariations = generateVariations(type);
  if (customVariation) {
    selectedVariations = { ...selectedVariations, ...customVariation };
  }
  const variationNotes = formatVariationsForPrompt(selectedVariations);

  // Build prompt — composition first, then material, then style
  const prompt = `${composition}

Material: ${metalDesc}. ${gemDesc}

Design: ${styleDesc}, ${complexityDesc}. Features ${variationNotes[0]}, ${variationNotes[1]}, ${variationNotes[2]}.

Rendering style: Conceptual hand-drawn art. Fine pencil outlines with soft graphite shading. Light color washes to indicate metal tone and gemstone hue. Realistic metal reflections rendered with careful hatching. The look of a master jeweler's sketchbook — elegant, confident line work capturing high-end craftsmanship. White paper background with subtle shadow under the piece.

No text, no labels, no watermarks, no human body parts. Clean design sheet only.

IMPORTANT: This is a ${type.toUpperCase()} — do not generate any other jewelry type. Show the COMPLETE piece in every view with nothing cropped.`;

  return prompt;
}

/**
 * Generate a short prompt summary for display
 */
export function generatePromptSummary(params: JewelryDesignParams): string {
  const metalDesc = METAL_SHORT[params.metal] || params.metal;
  const gemNames = params.gemstones.length > 0
    ? params.gemstones.map((g) => GEM_SHORT[g] || g).join(', ')
    : 'plain metal';
  return `${params.type} in ${metalDesc} with ${gemNames}`;
}

/**
 * Get selected variations from a prompt
 */
export function getVariationsFromPrompt(type: string): SelectedVariations {
  return generateVariations(type);
}
