import {
  PromptBundleSchema,
  formatVariationsForPrompt,
  resolveView,
  styleLightingPresets,
  type DesignDna,
  type JewelryType,
  type PromptBundle,
  type PromptPreviewProvider,
  type Style,
} from "@skygems/shared";

import type { PromptPackRelease } from "../packs/types.ts";
import type { ViewPlan } from "../packs/types.ts";

export function compilePromptBundle(options: {
  designDna: DesignDna;
  userNotes?: string;
  provider?: PromptPreviewProvider;
  promptPack: PromptPackRelease;
  viewPlan?: ViewPlan;
  viewId?: string;
}): PromptBundle {
  const provider = options.provider ?? "xai";
  const { content } = options.promptPack;
  const variationNotes = formatVariationsForPrompt(options.designDna);
  const complexityDescription = describeComplexity(options.designDna.complexity);
  const notesSuffix = options.userNotes
    ? `\n\nUser notes to respect: ${options.userNotes.trim()}.`
    : "";
  const providerDirectives = content.providerDirectives[provider];

  // Sketch prompt uses the legacy two-view composition (design sheet with multiple angles)
  const compositionPrompt =
    options.viewPlan?.compositionPrompt ??
    content.typeCompositionPrompts[options.designDna.jewelryType];

  const sketchPrompt = `${compositionPrompt}

Material: ${content.metalDescriptions[options.designDna.metal]}. ${describeGemstones(
    content,
    options.designDna.gemstones,
  )}

Design intent: ${content.styleDescriptions[options.designDna.style]}, ${complexityDescription}. Features ${variationNotes[0]}, ${variationNotes[1]}, ${variationNotes[2]}, ${variationNotes[3]}, and ${variationNotes[4]}.

Rendering style: ${content.sketchRenderingStyle}

Provider targeting: ${providerDirectives.sketch}${notesSuffix}

IMPORTANT: This is a ${options.designDna.jewelryType.toUpperCase()}. ${content.wholePieceConstraint}`;

  // Render prompt uses the view-specific composition from VIEW_CATALOG
  // so each concept in a batch shows a different camera angle.
  const view = resolveView(
    options.designDna.jewelryType as JewelryType,
    options.viewId,
  );

  // Style-specific lighting preset for the render
  const lightingPreset = styleLightingPresets[options.designDna.style as Style]
    ?? styleLightingPresets.contemporary;

  const renderPrompt = `${view.compositionPrompt}

Lighting: ${lightingPreset}

This is a ${options.designDna.jewelryType} in ${content.metalDescriptions[
    options.designDna.metal
  ]} with ${describeGemstones(content, options.designDna.gemstones).toLowerCase()} Design DNA: ${options.designDna.bandStyle}, ${options.designDna.settingType}, ${options.designDna.stonePosition}, ${options.designDna.profile}, and ${options.designDna.motif}. Style direction: ${content.styleDescriptions[
    options.designDna.style
  ]}. Complexity: ${complexityDescription}. ${content.renderRenderingStyle}

Provider targeting: ${providerDirectives.render}.${notesSuffix}`;

  return PromptBundleSchema.parse({
    sketchPrompt,
    renderPrompt,
    negativePrompt: content.defaultNegativePrompt,
  });
}

function describeComplexity(complexity: number): string {
  if (complexity <= 25) {
    return "simple clean forms, smooth unadorned surfaces, single focal element, thin wire-gauge metal, maximum negative space";
  }

  if (complexity <= 50) {
    return "moderate detail, refined beveling and chamfers, one accent technique such as pavé border or milgrain edge, balanced visual weight";
  }

  if (complexity <= 75) {
    return "intricate layered work, filigree scrollwork, multiple stone sizes, textured metalwork with hammered or engraved surfaces, visible gallery openwork";
  }

  return "maximum craftsmanship density, micro-pavé coverage, repousse relief, granulation, multiple setting types in one piece, every surface carrying detail";
}

function describeGemstones(
  promptPack: PromptPackRelease["content"],
  gemstones: readonly (keyof PromptPackRelease["content"]["gemstoneDescriptions"])[],
): string {
  if (gemstones.length === 0) {
    return "No gemstones. Focus on pure metalwork and construction clarity.";
  }

  return `Set with ${gemstones.map((gemstone) => promptPack.gemstoneDescriptions[gemstone]).join(" and ")}.`;
}
