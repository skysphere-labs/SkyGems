import type { JewelryType } from "@skygems/shared";

import type { ViewPackRelease, ViewPlan } from "../packs/types.ts";
import type { SkillDefinition } from "./registry.ts";

export interface ViewPlanInput {
  jewelryType: JewelryType;
  viewPack: ViewPackRelease;
}

export const viewPlanSkill: SkillDefinition<ViewPlanInput, ViewPlan> = {
  skillId: "view-plan",
  description: "Resolves the stable view plan for a jewelry type from the active view pack.",
  execute(input) {
    const plan = input.viewPack.content.plans[input.jewelryType];
    if (!plan) {
      throw new Error(`No view plan defined for jewelry type: ${input.jewelryType}`);
    }

    return plan;
  },
};
