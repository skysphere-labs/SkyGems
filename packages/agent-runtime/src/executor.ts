import { PackResolver } from "./packs/resolver.ts";
import { AgentRegistry } from "./registry.ts";
import { parseWithSchema } from "./validation.ts";
import type { AgentRunResult } from "./types.ts";

export class AgentExecutor {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly packResolver = new PackResolver(),
  ) {}

  async run<TOutput>(
    agentId: string,
    input: unknown,
    options?: {
      promptPackId?: string;
      provider?: "xai" | "google";
      metadata?: Record<string, string | number | boolean | null | undefined>;
    },
  ): Promise<AgentRunResult<TOutput>> {
    const definition = this.registry.resolve(agentId);
    if (!definition) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const parsedInput = parseWithSchema(definition.inputSchema, input, `${agentId} input`);
    const promptPack = this.packResolver.resolvePromptPack(options?.promptPackId);
    const output = await definition.execute(parsedInput, {
      promptPack,
      provider: options?.provider,
      metadata: options?.metadata,
    });
    const parsedOutput = parseWithSchema(definition.outputSchema, output, `${agentId} output`);

    return {
      agentId: definition.agentId,
      version: definition.version,
      promptPackVersion: promptPack.version,
      output: parsedOutput as TOutput,
    };
  }
}
