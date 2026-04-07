import type {
  CreateDesignInput,
  PromptAgentOutput,
  PromptPreviewProvider,
} from "@skygems/shared";
import type { ZodType } from "zod";

import type { PromptPackRelease } from "./packs/types.ts";

export type ProviderKind = "prompt_compilation";

export interface AgentContext {
  promptPack: PromptPackRelease;
  provider?: PromptPreviewProvider;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface AgentDefinition<TInput, TOutput> {
  agentId: string;
  version: string;
  description: string;
  requiredPacks: string[];
  requiredProviders: ProviderKind[];
  skills: string[];
  inputSchema: ZodType<TInput>;
  outputSchema: ZodType<TOutput>;
  execute: (input: TInput, ctx: AgentContext) => Promise<TOutput>;
  timeoutMs: number;
  retryable: boolean;
  executionKind: "deterministic" | "llm_structured" | "image_generation" | "hybrid";
}

export interface AgentRunResult<TOutput> {
  agentId: string;
  version: string;
  promptPackVersion: string;
  output: TOutput;
}

export interface PromptAgentInput {
  mode: "generate" | "refine";
  projectId: string;
  designId: string;
  input: CreateDesignInput;
  sourceDesignId?: string;
  provider?: PromptPreviewProvider;
  refinementInstruction?: string;
}

export type PromptAgentRunResult = AgentRunResult<PromptAgentOutput>;
