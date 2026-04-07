/**
 * Local prompt-preview fallback.
 * The backend preview endpoint is canonical, but this keeps create mode usable
 * while networking is still stubbed.
 */

import type { CreateInput } from "../contracts/types";
import {
  buildDesignDna,
  getSelectedVariations,
} from "./variationEngine";

export interface JewelryDesignParams {
  type: string;
  metal: string;
  gemstones: string[];
  style: string;
  complexity: number;
}

const TYPE_COMPOSITION: Record<string, string> = {
  ring: "A jewelry design sheet showing a sketch plate and glam render of the same ring, both fully visible with the head, shank, and proportions intact.",
  necklace:
    "A jewelry design sheet showing the full necklace silhouette and a glam render of the same piece, both end to end with clasp, drop, and centerpiece intact.",
  earrings:
    "A jewelry design sheet showing the matching earring pair as a sketch plate plus a glam render, both fully visible from hook to lowest point.",
  bracelet:
    "A jewelry design sheet showing the full bracelet form as a sketch plate plus a glam render, both with clasp and silhouette fully visible.",
  pendant:
    "A jewelry design sheet showing the pendant front and its glam render, both fully visible with bail, body, and suspension details intact.",
};

const METAL_SHORT: Record<string, string> = {
  gold: "18K polished yellow gold with warm reflections",
  silver: "sterling silver with cool white reflections",
  platinum: "polished platinum with luminous white sheen",
  "rose-gold": "14K rose gold with soft copper warmth",
};

const GEM_SHORT: Record<string, string> = {
  diamond: "brilliant-cut diamond with crisp white fire",
  ruby: "faceted ruby with rich crimson saturation",
  emerald: "emerald-cut emerald with vivid green depth",
  sapphire: "cushion-cut sapphire with deep midnight blue tone",
  pearl: "round pearl with soft iridescent lustre",
};

const STYLE_SHORT: Record<string, string> = {
  contemporary:
    "contemporary luxury with clean silhouettes and purposeful asymmetry",
  minimalist: "minimalist restraint with only essential detail",
  vintage: "vintage-inspired detailing with soft filigree accents",
  temple: "temple jewelry language with lotus, shrine, and ceremonial motifs",
  floral: "organic floral motion with petal and vine rhythms",
  geometric: "architectural geometry with precise linework",
};

function getComplexityLabel(complexity: number) {
  if (complexity <= 20) return "pared back and quiet";
  if (complexity <= 45) return "balanced with selective detailing";
  if (complexity <= 70) return "ornate with layered detail";
  return "highly elaborate with dense ornamental focus";
}

export function generateJewelryPrompt(params: JewelryDesignParams): string {
  const input: CreateInput = {
    jewelryType: params.type as CreateInput["jewelryType"],
    metal: params.metal as CreateInput["metal"],
    gemstones: params.gemstones as CreateInput["gemstones"],
    style: params.style as CreateInput["style"],
    complexity: params.complexity,
  };

  return generatePromptPreview(input).prompt;
}

export function generatePromptPreview(input: CreateInput) {
  const designDna = buildDesignDna(input);
  const variations = getSelectedVariations(input);

  const gemstones =
    input.gemstones.length === 0
      ? "No gemstones, pure metalwork focus."
      : `Gemstones: ${input.gemstones
          .map((gem) => GEM_SHORT[gem] ?? gem)
          .join("; ")}.`;

  const prompt = [
    TYPE_COMPOSITION[input.jewelryType],
    `Material: ${METAL_SHORT[input.metal]}. ${gemstones}`,
    `Style: ${STYLE_SHORT[input.style]}, ${getComplexityLabel(input.complexity)}.`,
    `Construction emphasis: ${variations.bandStyle}, ${variations.settingType}, ${variations.stonePosition}, ${variations.profile}, ${variations.motif}.`,
    "Rendering direction: one refined sketch sheet and one polished render, luxurious studio presentation, no body parts, no labels, and no watermark.",
  ].join("\n\n");

  const summary = `${input.jewelryType} in ${input.metal} with ${
    input.gemstones.length === 0
      ? "plain metal focus"
      : input.gemstones.join(", ")
  }`;

  return {
    prompt,
    summary,
    designDna,
    previewRevisionTag: designDna.fingerprintSha256,
  };
}

export function generatePromptSummary(params: JewelryDesignParams) {
  const input: CreateInput = {
    jewelryType: params.type as CreateInput["jewelryType"],
    metal: params.metal as CreateInput["metal"],
    gemstones: params.gemstones as CreateInput["gemstones"],
    style: params.style as CreateInput["style"],
    complexity: params.complexity,
  };
  return generatePromptPreview(input).summary;
}
