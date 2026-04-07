import {
  buildPromptBundle,
  type DesignDna,
  type PromptBundle,
  type PromptPreviewProvider,
} from "@skygems/shared";

import type { PromptPackRelease } from "../packs/types.ts";

export function compilePromptBundle(options: {
  designDna: DesignDna;
  userNotes?: string;
  provider?: PromptPreviewProvider;
  promptPack: PromptPackRelease;
}): PromptBundle {
  // First migration step: resolve a versioned prompt pack via the runtime boundary,
  // while still delegating compilation parity to the existing shared-domain implementation.
  void options.promptPack;

  return buildPromptBundle(options.designDna, options.userNotes, {
    provider: options.provider,
  });
}
