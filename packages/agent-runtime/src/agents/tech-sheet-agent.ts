import {
  DesignDnaSchema,
  SpecAgentOutputSchema,
  SpecIdSchema,
  TechSheetAgentOutputSchema,
  calculateBom,
  metalPurityLabels,
  type DesignDna,
  type SpecAgentOutput,
  type TechSheetAgentOutput,
} from "@skygems/shared";
import { z } from "zod";

import { getWikiContextForDesign } from "../wiki/reader.ts";
import type { AgentContext, AgentDefinition } from "../types.ts";

export const TechSheetAgentInputSchema = z.object({
  specOutput: SpecAgentOutputSchema,
  designDna: DesignDnaSchema,
  specId: SpecIdSchema,
});

export type TechSheetAgentInput = z.infer<typeof TechSheetAgentInputSchema>;

async function generateTechSheetWithLLM(
  specOutput: SpecAgentOutput,
  designDna: DesignDna,
  apiKey: string,
): Promise<Partial<TechSheetAgentOutput> | null> {
  const wikiContext = getWikiContextForDesign(designDna);

  const systemPrompt = `You are a jewelry manufacturing engineer producing a technical manufacturing sheet. Given a jewelry specification and design attributes, produce precise manufacturing data.

## Jewelry Knowledge Base
${wikiContext}

## Rules
- Dimensions must be realistic and specific to the design (not generic defaults)
- Metal weights should account for the specific jewelry type, size, and complexity
- Use the knowledge base for material densities and standard gauges
- Gemstone dimensions should match the specified carats and cuts
- Construction notes must be actionable for a bench jeweler
- BOM should include realistic material costs

## Output
Return ONLY valid JSON — no markdown:
{
  "geometryAndDimensions": [
    { "label": "dimension name", "value": "measurement with units" }
  ],
  "materialsAndMetalDetails": [
    { "material": "metal name", "weight_g": 0.0, "purity": "purity label", "finish": "finish type" }
  ],
  "gemstoneSchedule": [
    { "stone": "stone description", "cut": "cut type", "caratWeight": 0.0, "dimensions": "L x W x D mm", "setting": "setting type" }
  ],
  "constructionNotes": ["actionable manufacturing instruction"],
  "billOfMaterials": [
    { "item": "material/component", "quantity": 1, "unitCost": 0.0, "totalCost": 0.0 }
  ],
  "estimatedRetailPrice": { "low": 0, "mid": 0, "high": 0, "currency": "USD" },
  "riskFlags": ["specific manufacturing risk"]
}`;

  const specSummary = [
    `Type: ${specOutput.jewelryType}`,
    `Metal: ${specOutput.materials.metal}, finish: ${specOutput.materials.finish}`,
    `Gemstones: ${specOutput.materials.gemstones.map(g => `${g.stoneType} (${g.role})`).join(", ") || "none"}`,
    `Setting: ${specOutput.construction.settingType}`,
    `Profile: ${specOutput.construction.profile}`,
    `Manufacturing: ${specOutput.construction.manufacturingMethod}`,
    `Complexity: ${designDna.complexity}/100`,
    `Style: ${designDna.style}`,
    specOutput.summary,
  ];

  if (specOutput.dimensions) {
    const dims = specOutput.dimensions;
    if (dims.bandWidth?.value) specSummary.push(`Band width: ${dims.bandWidth.value} ${dims.bandWidth.unit}`);
    if (dims.bandThickness?.value) specSummary.push(`Band thickness: ${dims.bandThickness.value} ${dims.bandThickness.unit}`);
    if (dims.overallLength?.value) specSummary.push(`Overall length: ${dims.overallLength.value} ${dims.overallLength.unit}`);
    if (dims.overallWidth?.value) specSummary.push(`Overall width: ${dims.overallWidth.value} ${dims.overallWidth.unit}`);
  }

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
          { role: "user", content: `Produce a technical manufacturing sheet for this jewelry piece:\n\n${specSummary.join("\n")}` },
        ],
        temperature: 0.3,
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

    return JSON.parse(jsonMatch[0]) as Partial<TechSheetAgentOutput>;
  } catch {
    return null;
  }
}

// ── Deterministic fallback data ──

const dimensionsByType: Record<string, { label: string; value: string }[]> = {
  ring: [
    { label: "Band Width", value: "2.5 mm" },
    { label: "Band Thickness", value: "1.8 mm" },
    { label: "Crown Height", value: "6.2 mm" },
    { label: "Overall Diameter", value: "18.9 mm (US size 8)" },
    { label: "Shank Profile", value: "Comfort-fit D-shape" },
  ],
  necklace: [
    { label: "Chain Length", value: "450 mm (18 in)" },
    { label: "Chain Width", value: "1.2 mm" },
    { label: "Pendant Height", value: "22 mm" },
    { label: "Pendant Width", value: "16 mm" },
    { label: "Clasp Type", value: "Lobster claw" },
  ],
  bracelet: [
    { label: "Inner Circumference", value: "178 mm (7 in)" },
    { label: "Band Width", value: "8 mm" },
    { label: "Band Thickness", value: "2.2 mm" },
    { label: "Clasp Length", value: "14 mm" },
    { label: "Total Weight Target", value: "22 g" },
  ],
  earrings: [
    { label: "Drop Length", value: "28 mm" },
    { label: "Width at Widest", value: "12 mm" },
    { label: "Post Length", value: "11 mm" },
    { label: "Post Gauge", value: "20 ga (0.81 mm)" },
    { label: "Back Type", value: "Push-back butterfly" },
  ],
  pendant: [
    { label: "Height", value: "24 mm" },
    { label: "Width", value: "18 mm" },
    { label: "Depth", value: "6 mm" },
    { label: "Bail Opening", value: "4 mm" },
    { label: "Bail Width", value: "3.5 mm" },
  ],
};

const defaultCut: Record<string, string> = {
  diamond: "Round brilliant",
  ruby: "Oval mixed",
  emerald: "Emerald step",
  sapphire: "Cushion brilliant",
  pearl: "Baroque (natural)",
};

function buildConstructionNotes(
  designDna: DesignDna,
  specOutput: SpecAgentOutput,
): string[] {
  const notes: string[] = [];

  if (specOutput.construction.settingType) {
    notes.push(`Primary stone mounting: ${specOutput.construction.settingType} setting. Verify prong height relative to girdle diameter before wax approval.`);
  }

  const method = specOutput.construction.manufacturingMethod;
  if (method === "cast") {
    notes.push("Lost-wax casting recommended. Ensure spruing avoids thin sections. Post-cast cleanup includes devesting, pickling, and pre-polish tumble.");
  } else if (method === "fabricated") {
    notes.push("Fabricated construction: sheet and wire stock required. Solder joints must be flush and invisible at 10x loupe inspection.");
  } else {
    notes.push("Manufacturing method to be confirmed during CAD review. Prepare both cast and fabricated cost estimates.");
  }

  if (designDna.motif && designDna.motif !== "none") {
    notes.push(`Motif direction: "${designDna.motif}". Ensure pattern continuity across all visible surfaces.`);
  }

  const finish = specOutput.materials.finish ?? "standard";
  notes.push(`Surface finish: ${finish}. Final quality check under 10x magnification.`);

  if (designDna.complexity > 70) {
    notes.push("High complexity score. Consider prototype stage before production run.");
  }

  for (const note of specOutput.construction.assemblyNotes) {
    notes.push(note);
  }

  return notes;
}

export const techSheetAgentDefinition: AgentDefinition<TechSheetAgentInput, TechSheetAgentOutput> = {
  agentId: "tech-sheet-agent",
  version: "2.0.0",
  description: "Uses LLM intelligence to produce a technical manufacturing sheet with BOM. Falls back to deterministic defaults if LLM unavailable.",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: ["jewelry-rules"],
  inputSchema: TechSheetAgentInputSchema,
  outputSchema: TechSheetAgentOutputSchema,
  timeoutMs: 20_000,
  retryable: true,
  executionKind: "hybrid",
  async execute(input, ctx) {
    const { specOutput, designDna, specId } = input;

    // Try LLM-powered tech sheet generation
    const apiKey = ctx.env?.XAI_API_KEY?.trim();
    let llmSheet: Partial<TechSheetAgentOutput> | null = null;

    if (apiKey) {
      llmSheet = await generateTechSheetWithLLM(specOutput, designDna, apiKey);
    }

    if (llmSheet) {
      // Use LLM output, falling back to calculated BOM if LLM didn't provide it
      const { items: fallbackBom, estimatedRetailPrice: fallbackPrice } = calculateBom(designDna, specOutput);

      return TechSheetAgentOutputSchema.parse({
        schemaVersion: "tech_v1",
        designId: specOutput.designId,
        specId,
        geometryAndDimensions: llmSheet.geometryAndDimensions ?? dimensionsByType[designDna.jewelryType] ?? dimensionsByType.ring,
        materialsAndMetalDetails: llmSheet.materialsAndMetalDetails ?? [{
          material: designDna.metal,
          weight_g: 6,
          purity: metalPurityLabels[designDna.metal] ?? "Unknown",
          finish: specOutput.materials.finish ?? "High polish",
        }],
        gemstoneSchedule: llmSheet.gemstoneSchedule ?? [],
        constructionNotes: llmSheet.constructionNotes ?? buildConstructionNotes(designDna, specOutput),
        billOfMaterials: llmSheet.billOfMaterials ?? fallbackBom,
        estimatedRetailPrice: llmSheet.estimatedRetailPrice ?? fallbackPrice,
        riskFlags: llmSheet.riskFlags ?? [],
      });
    }

    // Deterministic fallback (original logic)
    const geometryAndDimensions = [
      ...(dimensionsByType[designDna.jewelryType] ?? dimensionsByType.ring),
    ];

    if (specOutput.dimensions.overallLength?.value) {
      geometryAndDimensions.push({
        label: "Spec Overall Length",
        value: `${specOutput.dimensions.overallLength.value} ${specOutput.dimensions.overallLength.unit}`,
      });
    }
    if (specOutput.dimensions.overallWidth?.value) {
      geometryAndDimensions.push({
        label: "Spec Overall Width",
        value: `${specOutput.dimensions.overallWidth.value} ${specOutput.dimensions.overallWidth.unit}`,
      });
    }

    const purity = metalPurityLabels[designDna.metal] ?? "Unknown purity";
    const metalWeightG = designDna.jewelryType === "ring" ? 6 : designDna.jewelryType === "earrings" ? 4 : designDna.jewelryType === "necklace" ? 18 : designDna.jewelryType === "bracelet" ? 22 : 8;
    const materialsAndMetalDetails = [{
      material: designDna.metal,
      weight_g: metalWeightG,
      purity,
      finish: specOutput.materials.finish ?? "High polish",
    }];

    const gemstoneSchedule = specOutput.materials.gemstones.map((gemstone) => {
      const stoneType = gemstone.stoneType;
      const cut = defaultCut[stoneType] ?? "Mixed cut";
      const caratWeight = gemstone.role === "primary" ? 1.0 : 0.15;
      const quantity = gemstone.quantity ?? (gemstone.role === "primary" ? 1 : 2);
      const dimStr = gemstone.role === "primary" ? "6.5 x 6.5 x 4.0 mm" : "2.0 x 2.0 x 1.2 mm";

      return {
        stone: `${stoneType} (${gemstone.role})${quantity > 1 ? ` x${quantity}` : ""}`,
        cut,
        caratWeight: caratWeight * quantity,
        dimensions: dimStr,
        setting: specOutput.construction.settingType ?? "Prong",
      };
    });

    const constructionNotes = buildConstructionNotes(designDna, specOutput);
    const { items: billOfMaterials, estimatedRetailPrice } = calculateBom(designDna, specOutput);

    const riskFlags: string[] = [];
    for (const flag of specOutput.riskFlags) {
      riskFlags.push(`[${flag.severity.toUpperCase()}] ${flag.message}`);
    }
    for (const unknown of specOutput.unknowns) {
      riskFlags.push(`[INFO] Unresolved: ${unknown}`);
    }
    if (designDna.complexity > 80) {
      riskFlags.push("[MEDIUM] High complexity may increase manufacturing reject rate.");
    }

    return TechSheetAgentOutputSchema.parse({
      schemaVersion: "tech_v1",
      designId: specOutput.designId,
      specId,
      geometryAndDimensions,
      materialsAndMetalDetails,
      gemstoneSchedule,
      constructionNotes,
      billOfMaterials,
      estimatedRetailPrice,
      riskFlags,
    });
  },
};
