import {
  PromptBundleSchema,
  formatVariationsForPrompt,
  type DesignDna,
  type PromptBundle,
  type PromptPreviewProvider,
} from "@skygems/shared";

import type { PromptPackRelease } from "../packs/types.ts";
import type { ViewPlan } from "../packs/types.ts";

export function compilePromptBundle(options: {
  designDna: DesignDna;
  userNotes?: string;
  provider?: PromptPreviewProvider;
  promptPack: PromptPackRelease;
  viewPlan?: ViewPlan;
}): PromptBundle {
  const provider = options.provider ?? "xai";
  const { content } = options.promptPack;
  const variationNotes = formatVariationsForPrompt(options.designDna);
  const complexityDescription = describeComplexity(options.designDna.complexity);
  const notesSuffix = options.userNotes
    ? `\n\nUser notes to respect: ${options.userNotes.trim()}.`
    : "";
  const providerDirectives = content.providerDirectives[provider];

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

  const renderPrompt = `A luxury studio render of the same ${options.designDna.jewelryType} concept. Showcase ${content.metalDescriptions[
    options.designDna.metal
  ]} with ${describeGemstones(content, options.designDna.gemstones).toLowerCase()} Keep the structure faithful to this design DNA: ${options.designDna.bandStyle}, ${options.designDna.settingType}, ${options.designDna.stonePosition}, ${options.designDna.profile}, and ${options.designDna.motif}. Style direction: ${content.styleDescriptions[
    options.designDna.style
  ]}. Complexity level: ${complexityDescription}. ${content.renderRenderingStyle}

Provider targeting: ${providerDirectives.render}.${notesSuffix}`;

  return PromptBundleSchema.parse({
    sketchPrompt,
    renderPrompt,
    negativePrompt: content.defaultNegativePrompt,
  });
}

function describeComplexity(complexity: number): string {
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

function describeGemstones(
  promptPack: PromptPackRelease["content"],
  gemstones: readonly (keyof PromptPackRelease["content"]["gemstoneDescriptions"])[],
): string {
  if (gemstones.length === 0) {
    return "No gemstones. Focus on pure metalwork and construction clarity.";
  }

  return `Set with ${gemstones.map((gemstone) => promptPack.gemstoneDescriptions[gemstone]).join(" and ")}.`;
}
