import { specAgentDefinition } from "./agents/spec-agent.ts";
import { techSheetAgentDefinition } from "./agents/tech-sheet-agent.ts";
import { promptAgentDefinition } from "./agents/prompt-agent.ts";
import { AgentExecutor } from "./executor.ts";
import { ProviderRouter } from "./providers/router.ts";
import { AgentRegistry } from "./registry.ts";
import { viewPackV1 } from "./packs/view-pack-v1.ts";
import { viewPlanSkill } from "./skills/view-plan.ts";
import { jewelryRulesSkill } from "./skills/jewelry-rules.ts";
import { SkillRegistry } from "./skills/registry.ts";

export * from "./agents/prompt-agent.ts";
export * from "./agents/spec-agent.ts";
export * from "./agents/tech-sheet-agent.ts";
export * from "./executor.ts";
export * from "./packs/prompt-pack-v1.ts";
export * from "./packs/resolver.ts";
export * from "./packs/types.ts";
export * from "./packs/view-pack-v1.ts";
export * from "./providers/google.ts";
export * from "./providers/router.ts";
export * from "./providers/types.ts";
export * from "./providers/xai.ts";
export * from "./registry.ts";
export * from "./skills/dna-resolve.ts";
export * from "./skills/jewelry-rules.ts";
export * from "./skills/prompt-compile.ts";
export * from "./skills/registry.ts";
export * from "./skills/view-plan.ts";
export * from "./types.ts";
export * from "./validation.ts";

export function createDefaultAgentRegistry(): AgentRegistry {
  const registry = new AgentRegistry();
  registry.register(promptAgentDefinition);
  registry.register(specAgentDefinition);
  registry.register(techSheetAgentDefinition);
  return registry;
}

export function createDefaultSkillRegistry(): SkillRegistry {
  const registry = new SkillRegistry();
  registry.register(viewPlanSkill);
  registry.register(jewelryRulesSkill);
  return registry;
}

export function createDefaultProviderRouter(): ProviderRouter {
  return new ProviderRouter();
}

export function createDefaultAgentExecutor(): AgentExecutor {
  return new AgentExecutor(
    createDefaultAgentRegistry(),
    undefined,
    createDefaultProviderRouter(),
    createDefaultSkillRegistry(),
  );
}
