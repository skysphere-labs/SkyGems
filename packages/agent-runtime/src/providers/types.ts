import type { PromptBundle, PromptPreviewProvider } from "@skygems/shared";

export interface ProviderPromptPayload {
  model: string;
  prompts: {
    sketchPrompt: string;
    renderPrompt: string;
    negativePrompt: string;
  };
}

export interface ProviderAdapter {
  provider: PromptPreviewProvider;
  model: string;
  description: string;
  shapePromptBundle(promptBundle: PromptBundle): ProviderPromptPayload;
}
