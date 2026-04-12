import {
  PairIdSchema,
  PromptAgentOutputSchema,
  SpecAgentOutputSchema,
  type PromptAgentOutput,
  type SpecAgentOutput,
} from "@skygems/shared";
import { z } from "zod";

import { getWikiContextForDesign } from "../wiki/reader.ts";
import type { AgentContext, AgentDefinition } from "../types.ts";

export const SpecAgentInputSchema = z.object({
  promptAgentOutput: PromptAgentOutputSchema,
  pairId: PairIdSchema,
});

export type SpecAgentInput = z.infer<typeof SpecAgentInputSchema>;

async function generateSpecWithLLM(
  promptAgentOutput: PromptAgentOutput,
  apiKey: string,
): Promise<Partial<SpecAgentOutput> | null> {
  const designDna = promptAgentOutput.designDna;
  const wikiContext = getWikiContextForDesign(designDna);

  const systemPrompt = `You are a master jewelry manufacturing engineer. You analyze jewelry designs and produce precise technical specifications for manufacturing.

## Jewelry Knowledge Base
${wikiContext}

## Your Task
Given a jewelry design's attributes and the image-generation prompt that was used, produce a complete manufacturing specification. Be specific and realistic — use actual measurements a jeweler would use.

## Rules
- All dimensions must be realistic for the jewelry type
- Use the knowledge base for material properties, densities, and standard manufacturing tolerances
- Identify actual risk flags (thin walls, complex undercuts, delicate settings)
- Be honest about unknowns — don't guess stone sizes if not specified
- Manufacturing method should match the design complexity and style
- Assembly notes should be actionable for a bench jeweler

## Output
Return ONLY valid JSON with this structure — no markdown:
{
  "summary": "One sentence describing the piece and its key features",
  "jewelryType": "${designDna.jewelryType}",
  "materials": {
    "metal": "${designDna.metal}",
    "finish": "specific finish type",
    "gemstones": [
      {
        "role": "primary|accent",
        "stoneType": "stone name",
        "shape": "cut shape or null",
        "quantity": 1,
        "size": "dimensions in mm or null",
        "carat": { "value": 0.0, "unit": "ct", "source": "estimated", "confidence": 0.0 }
      }
    ]
  },
  "dimensions": {
    "overallLength": { "value": 0.0, "unit": "mm", "source": "estimated", "confidence": 0.7 },
    "overallWidth": { "value": 0.0, "unit": "mm", "source": "estimated", "confidence": 0.7 },
    "overallHeight": { "value": 0.0, "unit": "mm", "source": "estimated", "confidence": 0.7 },
    "bandWidth": { "value": 0.0, "unit": "mm", "source": "estimated", "confidence": 0.7 },
    "bandThickness": { "value": 0.0, "unit": "mm", "source": "estimated", "confidence": 0.7 }
  },
  "construction": {
    "settingType": "prong|bezel|tension|channel|pave|etc",
    "profile": "comfort-fit|flat|knife-edge|D-shape|etc",
    "manufacturingMethod": "cast|fabricated|3d-printed|hand-forged",
    "assemblyNotes": ["actionable note for the bench jeweler"]
  },
  "riskFlags": [
    { "severity": "low|medium|high", "message": "specific risk" }
  ],
  "unknowns": ["things that need human confirmation"],
  "humanReviewRequired": true
}`;

  const briefParts = [
    `Jewelry type: ${designDna.jewelryType}`,
    `Metal: ${designDna.metal}`,
    `Gemstones: ${designDna.gemstones.length > 0 ? designDna.gemstones.join(", ") : "none — pure metalwork"}`,
    `Style: ${designDna.style}`,
    `Complexity: ${designDna.complexity}/100`,
    `Band/form style: ${designDna.bandStyle}`,
    `Setting type: ${designDna.settingType}`,
    `Stone position: ${designDna.stonePosition}`,
    `Profile: ${designDna.profile}`,
    `Motif: ${designDna.motif}`,
  ];

  if (promptAgentOutput.promptBundle?.renderPrompt) {
    briefParts.push(`\nRender prompt used:\n${promptAgentOutput.promptBundle.renderPrompt}`);
  }

  const userMessage = `Analyze this jewelry design and produce a complete manufacturing specification:\n\n${briefParts.join("\n")}`;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as Partial<SpecAgentOutput>;
  } catch {
    return null;
  }
}

export const specAgentDefinition: AgentDefinition<SpecAgentInput, SpecAgentOutput> = {
  agentId: "spec-agent",
  version: "2.0.0",
  description: "Uses LLM intelligence to produce detailed jewelry specifications from design DNA and prompt output. Falls back to deterministic scaffold if LLM unavailable.",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: ["jewelry-rules", "view-plan"],
  inputSchema: SpecAgentInputSchema,
  outputSchema: SpecAgentOutputSchema,
  timeoutMs: 20_000,
  retryable: true,
  executionKind: "hybrid",
  async execute(input, ctx) {
    const normalized = input.promptAgentOutput.normalizedInput;
    const designDna = input.promptAgentOutput.designDna;

    // Try LLM-powered spec generation
    const apiKey = ctx.env?.XAI_API_KEY?.trim();
    let llmSpec: Partial<SpecAgentOutput> | null = null;

    if (apiKey) {
      llmSpec = await generateSpecWithLLM(input.promptAgentOutput, apiKey);
    }

    if (llmSpec) {
      return SpecAgentOutputSchema.parse({
        schemaVersion: "spec_agent.v1",
        designId: input.promptAgentOutput.designId,
        pairId: input.pairId,
        specStandardVersion: "spec_v1",
        summary: llmSpec.summary ?? `Spec for ${designDna.jewelryType} in ${designDna.metal}.`,
        jewelryType: llmSpec.jewelryType ?? designDna.jewelryType,
        materials: llmSpec.materials ?? {
          metal: designDna.metal,
          finish: "polished",
          gemstones: designDna.gemstones.map((stoneType, index) => ({
            role: index === 0 ? "primary" : "accent",
            stoneType,
            shape: null,
            quantity: 1,
            size: null,
            carat: null,
          })),
        },
        dimensions: llmSpec.dimensions ?? {
          overallLength: null,
          overallWidth: null,
          overallHeight: null,
          bandWidth: null,
          bandThickness: null,
        },
        construction: llmSpec.construction ?? {
          settingType: designDna.settingType,
          profile: designDna.profile,
          manufacturingMethod: "unknown",
          assemblyNotes: ["Human review required."],
        },
        riskFlags: llmSpec.riskFlags ?? [],
        unknowns: llmSpec.unknowns ?? [],
        humanReviewRequired: llmSpec.humanReviewRequired ?? true,
      });
    }

    // Deterministic fallback
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
