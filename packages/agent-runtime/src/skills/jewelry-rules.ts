import type { DesignDna } from "@skygems/shared";

import type { SkillDefinition } from "./registry.ts";

export interface JewelryRulesOutput {
  constraints: string[];
}

export const jewelryRulesSkill: SkillDefinition<DesignDna, JewelryRulesOutput> = {
  skillId: "jewelry-rules",
  description: "Applies jewelry-specific quality constraints that every prompt should respect.",
  execute(input) {
    const constraints = [
      "Show the complete piece with no cropping or cut-off geometry.",
      "Preserve accurate metal and gemstone identity in every view.",
      "Keep proportions commercially plausible for luxury jewelry.",
    ];

    if (input.jewelryType === "ring") {
      constraints.push("Ensure the ring band, head, and setting remain structurally coherent.");
    }

    if (input.gemstones.length > 0) {
      constraints.push("Keep gemstone placement and count consistent across all views.");
    }

    return { constraints };
  },
};
