import { promptAgentDefinition } from "./agents/prompt-agent.ts";
import { AgentExecutor } from "./executor.ts";
import { AgentRegistry } from "./registry.ts";

export * from "./agents/prompt-agent.ts";
export * from "./executor.ts";
export * from "./packs/prompt-pack-v1.ts";
export * from "./packs/resolver.ts";
export * from "./packs/types.ts";
export * from "./registry.ts";
export * from "./skills/dna-resolve.ts";
export * from "./skills/prompt-compile.ts";
export * from "./types.ts";
export * from "./validation.ts";

export function createDefaultAgentRegistry(): AgentRegistry {
  const registry = new AgentRegistry();
  registry.register(promptAgentDefinition);
  return registry;
}

export function createDefaultAgentExecutor(): AgentExecutor {
  return new AgentExecutor(createDefaultAgentRegistry());
}
