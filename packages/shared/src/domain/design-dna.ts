import type { CreateDesignInput, DesignDna, DesignDnaPreview, PromptBundle } from "../contracts/primitives.ts";
import { CreateDesignInputSchema, DesignDnaPreviewSchema, DesignDnaSchema, PromptBundleSchema } from "../contracts/primitives.ts";
import type { Gemstone, JewelryType } from "../contracts/enums.ts";
import { gemstoneValues } from "../contracts/enums.ts";
import { sha256Hex } from "../lib/crypto.ts";
import { stableStringify } from "../lib/json.ts";
import {
  defaultNegativePrompt,
  gemstoneDescriptions,
  metalDescriptions,
  styleDescriptions,
  typeCompositionPrompts,
} from "./vocab.ts";

export interface VariationConfig {
  bandStyle: readonly string[];
  settingType: readonly string[];
  stonePosition: readonly string[];
  profile: readonly string[];
  motif: readonly string[];
}

export interface SelectedVariations {
  bandStyle: string;
  settingType: string;
  stonePosition: string;
  profile: string;
  motif: string;
}

export const promptPreviewProviderValues = ["xai", "google"] as const;
export type PromptPreviewProvider = (typeof promptPreviewProviderValues)[number];

export const SKYGEMS_PROMPT_PACK_VERSION = "skygems.prompt_pack.v1" as const;

export const DEFAULT_VARIATION_CONFIG: VariationConfig = {
  bandStyle: [
    "split band",
    "twisted band",
    "bypass ring",
    "tapered band",
    "braided band",
    "hammered band",
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
    "three-stone setting",
    "solitaire setting",
  ],
  stonePosition: [
    "centered",
    "offset to left",
    "offset to right",
    "diagonal",
    "clustered",
    "scattered",
    "graduated",
    "asymmetric placement",
  ],
  profile: [
    "low profile",
    "raised setting",
    "vintage profile",
    "modern flat profile",
    "curved profile",
    "angular profile",
    "minimalist profile",
    "statement profile",
  ],
  motif: [
    "wave pattern",
    "geometric precision",
    "organic flow",
    "minimalist lines",
    "nature-inspired details",
    "art deco influence",
    "modern abstraction",
    "floral elements",
  ],
};

export const TYPE_SPECIFIC_VARIATION_CONFIGS: Record<JewelryType, Partial<VariationConfig>> = {
  ring: {
    bandStyle: [
      "split band",
      "twisted band",
      "bypass ring",
      "tapered band",
      "braided band",
      "hammered band",
      "sculptural band",
      "asymmetric band",
    ],
  },
  necklace: {
    bandStyle: [
      "chain link",
      "pendant drop",
      "collar style",
      "lariat style",
      "Y-necklace",
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
      "chandelier earring",
      "huggie earring",
      "threader earring",
      "asymmetric pair",
      "sculptural earring",
    ],
  },
  bracelet: {
    bandStyle: [
      "bangle style",
      "tennis bracelet",
      "charm bracelet",
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
      "abstract pendant",
      "nature-inspired pendant",
    ],
  },
};

type VariationCategory = keyof VariationConfig;

const variationCategories: VariationCategory[] = [
  "bandStyle",
  "settingType",
  "stonePosition",
  "profile",
  "motif",
];

export function getAvailableVariations(jewelryType: JewelryType): VariationConfig {
  return {
    ...DEFAULT_VARIATION_CONFIG,
    ...TYPE_SPECIFIC_VARIATION_CONFIGS[jewelryType],
  };
}

function orderGemstones(gemstones: readonly string[]): string[] {
  return gemstoneValues.filter((gemstone) => gemstones.includes(gemstone));
}

function normalizeVariationOverrides(
  overrides: CreateDesignInput["variationOverrides"],
): CreateDesignInput["variationOverrides"] {
  if (!overrides) {
    return undefined;
  }

  const entries = Object.entries(overrides).filter(([, value]) => Boolean(value));
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function normalizeCreateDesignInput(input: CreateDesignInput): CreateDesignInput {
  const parsed = CreateDesignInputSchema.parse(input);

  return CreateDesignInputSchema.parse({
    ...parsed,
    gemstones: orderGemstones(parsed.gemstones),
    variationOverrides: normalizeVariationOverrides(parsed.variationOverrides),
    userNotes: parsed.userNotes?.trim() || undefined,
  });
}

function selectIndex(hash: string, position: number, length: number): number {
  const chunk = hash.slice(position * 8, position * 8 + 8);
  return Number.parseInt(chunk, 16) % length;
}

function getComplexityDescription(complexity: number): string {
  if (complexity <= 25) {
    return "simple and clean";
  }

  if (complexity <= 50) {
    return "moderate detail";
  }

  if (complexity <= 75) {
    return "intricate with filigree and texture";
  }

  return "highly elaborate with dense ornamentation";
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

async function resolveVariations(input: CreateDesignInput): Promise<SelectedVariations> {
  const normalized = normalizeCreateDesignInput(input);
  const seedHash = await sha256Hex(
    stableStringify({
      jewelryType: normalized.jewelryType,
      metal: normalized.metal,
      gemstones: normalized.gemstones,
      style: normalized.style,
      complexity: normalized.complexity,
      variationOverrides: normalized.variationOverrides ?? {},
    }),
  );
  const config = getAvailableVariations(normalized.jewelryType);
  const overrides = normalized.variationOverrides ?? {};

  return {
    bandStyle:
      overrides.bandStyle ??
      config.bandStyle[selectIndex(seedHash, 0, config.bandStyle.length)],
    settingType:
      overrides.settingType ??
      config.settingType[selectIndex(seedHash, 1, config.settingType.length)],
    stonePosition:
      overrides.stonePosition ??
      config.stonePosition[selectIndex(seedHash, 2, config.stonePosition.length)],
    profile:
      overrides.profile ??
      config.profile[selectIndex(seedHash, 3, config.profile.length)],
    motif: overrides.motif ?? config.motif[selectIndex(seedHash, 4, config.motif.length)],
  };
}

export async function buildDesignDna(input: CreateDesignInput): Promise<DesignDna> {
  const normalized = normalizeCreateDesignInput(input);
  const variations = await resolveVariations(normalized);
  const fingerprintSha256 = await sha256Hex(
    stableStringify({
      jewelryType: normalized.jewelryType,
      metal: normalized.metal,
      gemstones: normalized.gemstones,
      style: normalized.style,
      complexity: normalized.complexity,
      ...variations,
    }),
  );

  return DesignDnaSchema.parse({
    jewelryType: normalized.jewelryType,
    metal: normalized.metal,
    gemstones: normalized.gemstones,
    style: normalized.style,
    complexity: normalized.complexity,
    ...variations,
    fingerprintSha256,
  });
}

export async function buildDesignDnaPreview(input: CreateDesignInput): Promise<DesignDnaPreview> {
  const designDna = await buildDesignDna(input);
  return DesignDnaPreviewSchema.parse({
    jewelryType: designDna.jewelryType,
    metal: designDna.metal,
    gemstones: designDna.gemstones,
    style: designDna.style,
    complexity: designDna.complexity,
    bandStyle: designDna.bandStyle,
    settingType: designDna.settingType,
    stonePosition: designDna.stonePosition,
    profile: designDna.profile,
    motif: designDna.motif,
  });
}

function describeGemstones(gemstones: readonly Gemstone[]): string {
  if (gemstones.length === 0) {
    return "No gemstones. Focus on pure metalwork and construction clarity.";
  }

  return `Set with ${gemstones.map((gemstone) => gemstoneDescriptions[gemstone]).join(" and ")}.`;
}

export function buildPromptSummary(input: Pick<CreateDesignInput, "jewelryType" | "metal" | "gemstones">): string {
  const gemSummary =
    input.gemstones.length > 0
      ? input.gemstones.map((gemstone) => gemstoneDescriptions[gemstone]).join(", ")
      : "plain metal";

  return `${input.jewelryType} in ${metalDescriptions[input.metal]} with ${gemSummary}`.slice(0, 240);
}

export function buildDesignDisplayName(designDna: DesignDna): string {
  const words = [
    designDna.style.replace(/(^|-)([a-z])/g, (_, hyphen: string, letter: string) =>
      `${hyphen}${letter.toUpperCase()}`,
    ),
    designDna.jewelryType.charAt(0).toUpperCase() + designDna.jewelryType.slice(1),
  ];

  return words.join(" ");
}

export function buildSearchText(designDna: DesignDna, promptSummary: string, userNotes?: string): string {
  return [
    designDna.jewelryType,
    designDna.metal,
    ...designDna.gemstones,
    designDna.style,
    designDna.bandStyle,
    designDna.settingType,
    designDna.stonePosition,
    designDna.profile,
    designDna.motif,
    promptSummary,
    userNotes ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function buildProviderSketchDirective(provider: PromptPreviewProvider): string {
  if (provider === "google") {
    return "Optimize for Google image prompting with a centered single object, high silhouette clarity, and explicit material separation.";
  }

  return "Optimize for xAI image prompting with faithful silhouette language, premium material detail, and consistent whole-object framing.";
}

function buildProviderRenderDirective(provider: PromptPreviewProvider): string {
  if (provider === "google") {
    return "Favor polished product-photography wording with restrained background detail and premium gemstone readability.";
  }

  return "Favor luxury editorial wording with crisp metal reflections, gemstone depth, and premium hero-object staging.";
}

export function buildPromptBundle(
  designDna: DesignDna,
  userNotes?: string,
  options: {
    provider?: PromptPreviewProvider;
  } = {},
): PromptBundle {
  const provider = options.provider ?? "xai";
  const variationNotes = formatVariationsForPrompt(designDna);
  const complexityDescription = getComplexityDescription(designDna.complexity);
  const notesSuffix = userNotes ? `\n\nUser notes to respect: ${userNotes.trim()}.` : "";

  const sketchPrompt = `${typeCompositionPrompts[designDna.jewelryType]}

Material: ${metalDescriptions[designDna.metal]}. ${describeGemstones(designDna.gemstones)}

Design intent: ${styleDescriptions[designDna.style]}, ${complexityDescription}. Features ${variationNotes[0]}, ${variationNotes[1]}, ${variationNotes[2]}, ${variationNotes[3]}, and ${variationNotes[4]}.

Rendering style: Conceptual jeweler's design sheet with confident pencil linework, graphite shading, clean white paper, careful material indication, and complete object framing.

Provider targeting: ${buildProviderSketchDirective(provider)}${notesSuffix}

IMPORTANT: This is a ${designDna.jewelryType.toUpperCase()}. Show the complete piece in every view with nothing cropped.`;

  const renderPrompt = `A luxury studio render of the same ${designDna.jewelryType} concept. Showcase ${metalDescriptions[designDna.metal]} with ${describeGemstones(
    designDna.gemstones,
  ).toLowerCase()} Keep the structure faithful to this design DNA: ${designDna.bandStyle}, ${designDna.settingType}, ${designDna.stonePosition}, ${designDna.profile}, and ${designDna.motif}. Style direction: ${styleDescriptions[
    designDna.style
  ]}. Complexity level: ${complexityDescription}. Present a single hero object on a clean neutral background with premium lighting and crisp material detail.

Provider targeting: ${buildProviderRenderDirective(provider)}.${notesSuffix}`;

  return PromptBundleSchema.parse({
    sketchPrompt,
    renderPrompt,
    negativePrompt: defaultNegativePrompt,
  });
}

export async function buildPromptPreview(input: CreateDesignInput): Promise<{
  normalizedInput: Omit<CreateDesignInput, "projectId">;
  designDnaPreview: DesignDnaPreview;
  promptSummary: string;
  promptText: string;
}> {
  return buildPromptPreviewWithOptions(input, {});
}

export async function buildPromptPreviewWithOptions(
  input: CreateDesignInput,
  options: {
    provider?: PromptPreviewProvider;
  },
): Promise<{
  normalizedInput: Omit<CreateDesignInput, "projectId">;
  designDnaPreview: DesignDnaPreview;
  promptSummary: string;
  promptText: string;
}> {
  const normalizedInput = normalizeCreateDesignInput(input);
  const designDna = await buildDesignDna(normalizedInput);
  const promptBundle = buildPromptBundle(designDna, normalizedInput.userNotes, {
    provider: options.provider,
  });

  return {
    normalizedInput: CreateDesignInputSchema.omit({ projectId: true }).parse({
      jewelryType: normalizedInput.jewelryType,
      metal: normalizedInput.metal,
      gemstones: normalizedInput.gemstones,
      style: normalizedInput.style,
      complexity: normalizedInput.complexity,
      variationOverrides: normalizedInput.variationOverrides,
      userNotes: normalizedInput.userNotes,
      pairStandardVersion: normalizedInput.pairStandardVersion,
    }),
    designDnaPreview: await buildDesignDnaPreview(normalizedInput),
    promptSummary: buildPromptSummary(normalizedInput),
    promptText: `Sketch prompt:\n${promptBundle.sketchPrompt}\n\nRender prompt:\n${promptBundle.renderPrompt}\n\nNegative prompt:\n${promptBundle.negativePrompt}`.slice(
      0,
      8000,
    ),
  };
}
