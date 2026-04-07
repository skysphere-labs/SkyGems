/**
 * Deterministic variation engine.
 * Keeps the useful domain vocabulary from the original app while making
 * prompt previews stable for the same create inputs.
 */

import type { CreateInput, DesignDna } from "../contracts/types";

export interface VariationConfig {
  bandStyle: string[];
  settingType: string[];
  stonePosition: string[];
  profile: string[];
  motif: string[];
}

export interface SelectedVariations {
  bandStyle: string;
  settingType: string;
  stonePosition: string;
  profile: string;
  motif: string;
}

const DEFAULT_VARIATION_CONFIG: VariationConfig = {
  bandStyle: [
    "split band",
    "twisted band",
    "tapered band",
    "braided band",
    "sculptural band",
    "asymmetric band",
  ],
  settingType: [
    "prong setting",
    "bezel setting",
    "tension setting",
    "flush setting",
    "halo setting",
    "cathedral setting",
  ],
  stonePosition: [
    "centered",
    "offset to left",
    "offset to right",
    "diagonal",
    "clustered",
    "graduated",
  ],
  profile: [
    "low profile",
    "raised setting",
    "vintage profile",
    "modern flat profile",
    "curved profile",
    "statement profile",
  ],
  motif: [
    "lotus lattice",
    "geometric precision",
    "organic flow",
    "minimalist lines",
    "nature-inspired details",
    "art deco influence",
  ],
};

const TYPE_SPECIFIC_CONFIGS: Record<string, Partial<VariationConfig>> = {
  ring: {
    bandStyle: [
      "split band",
      "twisted band",
      "bypass ring",
      "braided band",
      "sculptural band",
      "asymmetric band",
    ],
  },
  necklace: {
    bandStyle: [
      "chain link",
      "pendant drop",
      "collar style",
      "layered strands",
      "geometric chain",
      "sculptural pendant",
    ],
  },
  earrings: {
    bandStyle: [
      "stud earring",
      "drop earring",
      "hoop earring",
      "huggie earring",
      "threader earring",
      "sculptural pair",
    ],
  },
  bracelet: {
    bandStyle: [
      "bangle style",
      "cuff bracelet",
      "wrap bracelet",
      "link bracelet",
      "beaded bracelet",
      "sculptural bracelet",
    ],
  },
  pendant: {
    bandStyle: [
      "geometric pendant",
      "organic pendant",
      "minimalist pendant",
      "statement pendant",
      "sculptural pendant",
      "vintage-inspired pendant",
    ],
  },
};

function hashValue(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getConfigForType(jewelryType: string): VariationConfig {
  return {
    ...DEFAULT_VARIATION_CONFIG,
    ...TYPE_SPECIFIC_CONFIGS[jewelryType],
  };
}

export function fingerprintCreateInput(input: CreateInput) {
  const key = [
    input.jewelryType,
    input.metal,
    [...input.gemstones].sort().join(","),
    input.style,
    input.complexity,
  ].join("|");
  return `dna_${hashValue(key).toString(36).padStart(8, "0")}`;
}

function getSeededValue<T>(values: T[], seed: string, offset: number) {
  return values[hashValue(`${seed}:${offset}`) % values.length];
}

export function generateVariations(jewelryType: string): SelectedVariations {
  const config = getConfigForType(jewelryType);
  const seed = fingerprintCreateInput({
    jewelryType: jewelryType as CreateInput["jewelryType"],
    metal: "gold",
    gemstones: [],
    style: "contemporary",
    complexity: 50,
  });

  return {
    bandStyle: getSeededValue(config.bandStyle, seed, 0),
    settingType: getSeededValue(config.settingType, seed, 1),
    stonePosition: getSeededValue(config.stonePosition, seed, 2),
    profile: getSeededValue(config.profile, seed, 3),
    motif: getSeededValue(config.motif, seed, 4),
  };
}

export function getSelectedVariations(input: CreateInput): SelectedVariations {
  const config = getConfigForType(input.jewelryType);
  const seed = fingerprintCreateInput(input);

  return {
    bandStyle: getSeededValue(config.bandStyle, seed, 0),
    settingType: getSeededValue(config.settingType, seed, 1),
    stonePosition: getSeededValue(config.stonePosition, seed, 2),
    profile: getSeededValue(config.profile, seed, 3),
    motif: getSeededValue(config.motif, seed, 4),
  };
}

export function formatVariationsForPrompt(variations: SelectedVariations): string[] {
  return [
    `${variations.bandStyle} design`,
    `${variations.settingType} for secure hold`,
    `${variations.stonePosition} stone positioning`,
    `${variations.profile} aesthetic`,
    `${variations.motif} throughout design`,
  ];
}

export function buildDesignDna(input: CreateInput): DesignDna {
  const variations = getSelectedVariations(input);

  return {
    ...input,
    ...variations,
    fingerprintSha256: fingerprintCreateInput(input),
  };
}
