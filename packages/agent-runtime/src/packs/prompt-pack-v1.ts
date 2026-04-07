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
  },
};
