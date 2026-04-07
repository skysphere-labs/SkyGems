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

import type { AgentDefinition } from "../types.ts";

export const TechSheetAgentInputSchema = z.object({
  specOutput: SpecAgentOutputSchema,
  designDna: DesignDnaSchema,
  specId: SpecIdSchema,
});

export type TechSheetAgentInput = z.infer<typeof TechSheetAgentInputSchema>;

// ── Default dimension estimates by jewelry type ──

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

// ── Default gemstone cut by type ──

const defaultCut: Record<string, string> = {
  diamond: "Round brilliant",
  ruby: "Oval mixed",
  emerald: "Emerald step",
  sapphire: "Cushion brilliant",
  pearl: "Baroque (natural)",
};

// ── Construction note templates by complexity tier ──

function buildConstructionNotes(
  designDna: DesignDna,
  specOutput: SpecAgentOutput,
): string[] {
  const notes: string[] = [];

  // Setting-related
  if (specOutput.construction.settingType) {
    notes.push(
      `Primary stone mounting: ${specOutput.construction.settingType} setting. Verify prong height relative to girdle diameter before wax approval.`,
    );
  }

  // Manufacturing method
  const method = specOutput.construction.manufacturingMethod;
  if (method === "cast") {
    notes.push(
      "Lost-wax casting recommended. Ensure spruing avoids thin sections. Post-cast cleanup includes devesting, pickling, and pre-polish tumble.",
    );
  } else if (method === "fabricated") {
    notes.push(
      "Fabricated construction: sheet and wire stock required. Solder joints must be flush and invisible at 10x loupe inspection.",
    );
  } else {
    notes.push(
      "Manufacturing method to be confirmed during CAD review. Prepare both cast and fabricated cost estimates.",
    );
  }

  // Motif
  if (designDna.motif && designDna.motif !== "none") {
    notes.push(
      `Motif direction: "${designDna.motif}". Ensure pattern continuity across all visible surfaces and that motif detail is achievable at specified scale.`,
    );
  }

  // Finish
  const finish = specOutput.materials.finish ?? "standard";
  notes.push(
    `Surface finish: ${finish}. Final quality check under 10x magnification for scratch-free surfaces.`,
  );

  // Complexity warning
  if (designDna.complexity > 70) {
    notes.push(
      "High complexity score detected. Consider prototype stage before production run. Multi-axis undercuts may require segmented molding.",
    );
  }

  // Assembly notes from spec
  for (const note of specOutput.construction.assemblyNotes) {
    notes.push(note);
  }

  return notes;
}

export const techSheetAgentDefinition: AgentDefinition<TechSheetAgentInput, TechSheetAgentOutput> = {
  agentId: "tech-sheet-agent",
  version: "0.1.0",
  description: "Produces a technical manufacturing sheet with BOM from a confirmed spec and design DNA.",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: ["jewelry-rules"],
  inputSchema: TechSheetAgentInputSchema,
  outputSchema: TechSheetAgentOutputSchema,
  timeoutMs: 5_000,
  retryable: false,
  executionKind: "deterministic",
  async execute(input) {
    const { specOutput, designDna, specId } = input;

    // Geometry and dimensions
    const geometryAndDimensions = [
      ...(dimensionsByType[designDna.jewelryType] ?? dimensionsByType.ring),
    ];

    // Merge any known dimensions from the spec
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

    // Materials and metal details
    const purity = metalPurityLabels[designDna.metal] ?? "Unknown purity";
    const metalWeightG = designDna.jewelryType === "ring" ? 6 : designDna.jewelryType === "earrings" ? 4 : designDna.jewelryType === "necklace" ? 18 : designDna.jewelryType === "bracelet" ? 22 : 8;
    const materialsAndMetalDetails = [
      {
        material: designDna.metal,
        weight_g: metalWeightG,
        purity,
        finish: specOutput.materials.finish ?? "High polish",
      },
    ];

    // Gemstone schedule
    const gemstoneSchedule = specOutput.materials.gemstones.map((gemstone, idx) => {
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

    // Construction notes
    const constructionNotes = buildConstructionNotes(designDna, specOutput);

    // BOM calculation
    const { items: billOfMaterials, estimatedRetailPrice } = calculateBom(
      designDna,
      specOutput,
    );

    // Risk flags
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
