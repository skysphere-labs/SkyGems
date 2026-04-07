import { PackResolver } from "./packs/resolver.ts";
import { ProviderRouter } from "./providers/router.ts";
import { AgentRegistry } from "./registry.ts";
import { SkillRegistry } from "./skills/registry.ts";
import { parseWithSchema } from "./validation.ts";
import type { AgentRunResult } from "./types.ts";

export class AgentExecutor {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly packResolver = new PackResolver(),
    private readonly providerRouter = new ProviderRouter(),
    private readonly skillRegistry = new SkillRegistry(),
  ) {}

  async run<TOutput>(
    agentId: string,
    input: unknown,
    options?: {
      promptPackId?: string;
      provider?: "xai" | "google";
      metadata?: Record<string, string | number | boolean | null | undefined>;
      env?: Record<string, string | undefined>;
    },
  ): Promise<AgentRunResult<TOutput>> {
    const definition = this.registry.resolve(agentId);
    if (!definition) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const parsedInput = parseWithSchema(definition.inputSchema, input, `${agentId} input`);
    const promptPack = this.packResolver.resolvePromptPack(options?.promptPackId);
    const viewPack = this.packResolver.resolveViewPack();
    const output = await definition.execute(parsedInput, {
      promptPack,
      viewPack,
      provider: options?.provider,
      providerRouter: this.providerRouter,
      skillRegistry: this.skillRegistry,
      metadata: options?.metadata,
      env: options?.env,
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
