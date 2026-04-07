import type { PromptBundle } from "@skygems/shared";

import type { ProviderAdapter, ProviderPromptPayload } from "./types.ts";

export const xaiProviderAdapter: ProviderAdapter = {
  provider: "xai",
  model: "grok-imagine-image",
  description: "xAI image generation adapter for premium jewelry rendering prompts.",
  shapePromptBundle(promptBundle: PromptBundle): ProviderPromptPayload {
    return {
      model: "grok-imagine-image",
      prompts: {
        sketchPrompt: promptBundle.sketchPrompt,
        renderPrompt: promptBundle.renderPrompt,
        negativePrompt: promptBundle.negativePrompt,
      },
    };
  },
};
