import test from "node:test";
import assert from "node:assert/strict";

import type { DesignDna } from "@skygems/shared";

import { getWikiContextForDesign } from "./reader.ts";

test("wiki reader returns worker-safe context for prompt-agent designs", () => {
  const designDna: DesignDna = {
    jewelryType: "ring",
    metal: "gold",
    gemstones: ["diamond", "emerald"],
    style: "contemporary",
    complexity: 68,
    bandStyle: "split band",
    settingType: "halo setting",
    stonePosition: "centered",
    profile: "low profile",
    motif: "geometric precision",
    fingerprintSha256: "f".repeat(64),
  };

  const context = getWikiContextForDesign(designDna);

  assert.match(context, /Jewelry Type: ring/i);
  assert.match(context, /warm buttery glow|rich buttery reflections/i);
  assert.match(context, /rainbow fire/i);
  assert.match(context, /verdant green/i);
  assert.match(context, /Halo setting/i);
  assert.match(context, /Prompt Engineering Rules/i);
});
