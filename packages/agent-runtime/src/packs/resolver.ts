import { promptPackV1 } from "./prompt-pack-v1.ts";
import type { PromptPackRelease, ViewPackRelease } from "./types.ts";
import { viewPackV1 } from "./view-pack-v1.ts";

export class PackResolver {
  resolvePromptPack(packId = "prompt-pack"): PromptPackRelease {
    if (packId !== "prompt-pack") {
      throw new Error(`Unknown prompt pack: ${packId}`);
    }

    return promptPackV1;
  }

  resolveViewPack(packId = "view-pack"): ViewPackRelease {
    if (packId !== "view-pack") {
      throw new Error(`Unknown view pack: ${packId}`);
    }

    return viewPackV1;
  }
}
