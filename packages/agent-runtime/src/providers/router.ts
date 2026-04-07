import type { PromptPreviewProvider } from "@skygems/shared";

import { googleProviderAdapter } from "./google.ts";
import type { ProviderAdapter } from "./types.ts";
import { xaiProviderAdapter } from "./xai.ts";

export class ProviderRouter {
  private readonly adapters = new Map<PromptPreviewProvider, ProviderAdapter>([
    ["xai", xaiProviderAdapter],
    ["google", googleProviderAdapter],
  ]);

  resolve(provider: PromptPreviewProvider): ProviderAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return adapter;
  }

  list(): ProviderAdapter[] {
    return [...this.adapters.values()];
  }
}
