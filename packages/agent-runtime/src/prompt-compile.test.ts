import test from "node:test";
import assert from "node:assert/strict";

import { buildPromptBundle, type DesignDna } from "@skygems/shared";

import { promptPackV1 } from "./packs/prompt-pack-v1.ts";
import { compilePromptBundle } from "./skills/prompt-compile.ts";

const sampleDesignDna: DesignDna = {
  jewelryType: "ring",
  metal: "gold",
  gemstones: ["diamond"],
  style: "contemporary",
  complexity: 44,
  bandStyle: "split band",
  settingType: "prong setting",
  stonePosition: "centered",
  profile: "low profile",
  motif: "geometric precision",
  fingerprintSha256: "a".repeat(64),
};

for (const provider of ["xai", "google"] as const) {
  test(`prompt compiler matches legacy shared bundle for ${provider}`, () => {
    const legacy = buildPromptBundle(sampleDesignDna, "keep it elegant", { provider });
    const runtime = compilePromptBundle({
      designDna: sampleDesignDna,
      userNotes: "keep it elegant",
      provider,
      promptPack: promptPackV1,
    });

    assert.deepEqual(runtime, legacy);
  });
}
