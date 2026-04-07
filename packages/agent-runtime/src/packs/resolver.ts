import { promptPackV1 } from "./prompt-pack-v1.ts";
import type { PromptPackRelease } from "./types.ts";

export class PackResolver {
  resolvePromptPack(packId = "prompt-pack"): PromptPackRelease {
    if (packId !== "prompt-pack") {
      throw new Error(`Unknown prompt pack: ${packId}`);
    }

    return promptPackV1;
  }
}
