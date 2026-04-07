import {
  defaultNegativePrompt,
  gemstoneDescriptions,
  metalDescriptions,
  SKYGEMS_PROMPT_PACK_VERSION,
  styleDescriptions,
  typeCompositionPrompts,
} from "@skygems/shared";

import type { PromptPackRelease } from "./types.ts";

export const promptPackV1: PromptPackRelease = {
  packId: "prompt-pack",
  version: SKYGEMS_PROMPT_PACK_VERSION,
  content: {
    typeCompositionPrompts,
    metalDescriptions,
    gemstoneDescriptions,
    styleDescriptions,
    defaultNegativePrompt,
    providerDirectives: {
      xai: {
        sketch:
          "Optimize for xAI image prompting with faithful silhouette language, premium material detail, and consistent whole-object framing.",
        render:
          "Favor luxury editorial wording with crisp metal reflections, gemstone depth, and premium hero-object staging.",
      },
      google: {
        sketch:
          "Optimize for Google image prompting with a centered single object, high silhouette clarity, and explicit material separation.",
        render:
          "Favor polished product-photography wording with restrained background detail and premium gemstone readability.",
      },
    },
    sketchRenderingStyle:
      "Conceptual jeweler's design sheet with confident pencil linework, graphite shading, clean white paper, careful material indication, and complete object framing.",
    renderRenderingStyle:
      "Present a single hero object on a clean neutral background with premium lighting and crisp material detail.",
    wholePieceConstraint: "Show the complete piece in every view with nothing cropped.",
  },
};
