import type { AgentDefinition } from "./types.ts";

export class AgentRegistry {
  private readonly agents = new Map<string, AgentDefinition<unknown, unknown>>();

  register<TInput, TOutput>(definition: AgentDefinition<TInput, TOutput>): void {
    this.agents.set(definition.agentId, definition as AgentDefinition<unknown, unknown>);
  }

  resolve(agentId: string): AgentDefinition<unknown, unknown> | undefined {
    return this.agents.get(agentId);
  }

  list(): AgentDefinition<unknown, unknown>[] {
    return [...this.agents.values()];
  }
}
