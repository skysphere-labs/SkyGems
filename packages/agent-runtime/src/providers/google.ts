import type { PromptBundle } from "@skygems/shared";

import type { ProviderAdapter, ProviderPromptPayload } from "./types.ts";

export const googleProviderAdapter: ProviderAdapter = {
  provider: "google",
  model: "nano-banana-pro-2",
  description: "Google image generation adapter tuned for polished multi-view jewelry prompts.",
  shapePromptBundle(promptBundle: PromptBundle): ProviderPromptPayload {
    return {
      model: "nano-banana-pro-2",
      prompts: {
        sketchPrompt: promptBundle.sketchPrompt,
        renderPrompt: promptBundle.renderPrompt,
        negativePrompt: promptBundle.negativePrompt,
      },
    };
  },
};
