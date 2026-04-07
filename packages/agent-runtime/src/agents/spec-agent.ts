import {
  PairIdSchema,
  PromptAgentOutputSchema,
  SpecAgentOutputSchema,
  type PromptAgentOutput,
  type SpecAgentOutput,
} from "@skygems/shared";
import { z } from "zod";

import type { AgentDefinition } from "../types.ts";

export const SpecAgentInputSchema = z.object({
  promptAgentOutput: PromptAgentOutputSchema,
  pairId: PairIdSchema,
});

export type SpecAgentInput = z.infer<typeof SpecAgentInputSchema>;

export const specAgentDefinition: AgentDefinition<SpecAgentInput, SpecAgentOutput> = {
  agentId: "spec-agent",
  version: "0.1.0",
  description: "Derives a first structured jewelry specification from prompt-agent output and a selected pair.",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: ["jewelry-rules", "view-plan"],
  inputSchema: SpecAgentInputSchema,
  outputSchema: SpecAgentOutputSchema,
  timeoutMs: 5_000,
  retryable: false,
  executionKind: "deterministic",
  async execute(input) {
    const normalized = input.promptAgentOutput.normalizedInput;
    const designDna = input.promptAgentOutput.designDna;

    return SpecAgentOutputSchema.parse({
      schemaVersion: "spec_agent.v1",
      designId: input.promptAgentOutput.designId,
      pairId: input.pairId,
      specStandardVersion: "spec_v1",
      summary: `Initial spec scaffold for ${designDna.jewelryType} in ${designDna.metal}.`,
      jewelryType: designDna.jewelryType,
      materials: {
        metal: designDna.metal,
        finish: normalized.style === "minimalist" ? "high polish" : "luxury polished finish",
        gemstones: designDna.gemstones.map((stoneType, index) => ({
          role: index === 0 ? "primary" : "accent",
          stoneType,
          shape: null,
          quantity: index === 0 ? 1 : null,
          size: null,
          carat: null,
        })),
      },
      dimensions: {
        overallLength: null,
        overallWidth: null,
        overallHeight: null,
        bandWidth: designDna.jewelryType === "ring" ? {
          value: null,
          unit: "mm",
          source: "unknown",
          confidence: 0,
        } : null,
        bandThickness: designDna.jewelryType === "ring" ? {
          value: null,
          unit: "mm",
          source: "unknown",
          confidence: 0,
        } : null,
      },
      construction: {
        settingType: designDna.settingType,
        profile: designDna.profile,
        manufacturingMethod: "unknown",
        assemblyNotes: [
          `Respect motif direction: ${designDna.motif}.`,
          "Human review required before manufacturing release.",
        ],
      },
      riskFlags: [],
      unknowns: [
        "Precise dimensions are not yet inferred.",
        "Stone cut and exact size still require confirmation.",
      ],
      humanReviewRequired: true,
    });
  },
};
