import {
  CadPrepAgentOutputSchema,
  DesignDnaSchema,
  SpecAgentOutputSchema,
  SpecIdSchema,
  SvgAgentOutputSchema,
  SvgAssetIdSchema,
  TechSheetIdSchema,
  type CadFormat,
  type CadPrepAgentOutput,
  type DesignDna,
  type SpecAgentOutput,
  type SvgAgentOutput,
} from "@skygems/shared";
import { z } from "zod";

import type { AgentDefinition } from "../types.ts";

export const CadPrepAgentInputSchema = z.object({
  svgAgentOutput: SvgAgentOutputSchema,
  specOutput: SpecAgentOutputSchema,
  designDna: DesignDnaSchema,
  specId: SpecIdSchema,
  techSheetId: TechSheetIdSchema,
  svgAssetId: SvgAssetIdSchema,
  requestedFormats: z.array(z.enum(["step", "dxf", "stl"])).min(1),
});

export type CadPrepAgentInput = z.infer<typeof CadPrepAgentInputSchema>;

// ── Cleanup operation selection based on SVG analysis ──

function selectCleanupOperations(svgOutput: SvgAgentOutput): CadPrepAgentOutput["modelingPlan"]["cleanupOperations"] {
  const ops: CadPrepAgentOutput["modelingPlan"]["cleanupOperations"] = [
    "normalize_units",
    "flatten_transforms",
    "label_views",
  ];

  const totalStrokes = svgOutput.manifestJson.views.reduce(
    (sum, v) => sum + v.strokeCount,
    0,
  );

  if (totalStrokes > 200) {
    ops.push("dedupe_nodes");
  }

  ops.push("close_open_paths");

  return ops;
}

// ── Modeling steps generator ──

function buildModelingSteps(
  designDna: DesignDna,
  specOutput: SpecAgentOutput,
  formats: CadFormat[],
): string[] {
  const steps: string[] = [];

  steps.push("Import and validate cleaned SVG paths into CAD workspace.");
  steps.push(`Create ${designDna.jewelryType} base geometry from front and side profiles.`);

  if (specOutput.construction.settingType) {
    steps.push(`Model ${specOutput.construction.settingType} setting geometry with clearance tolerances.`);
  }

  if (designDna.gemstones.length > 0) {
    const stoneList = designDna.gemstones.join(", ");
    steps.push(`Place gem seats for: ${stoneList}. Verify girdle clearance.`);
  }

  const method = specOutput.construction.manufacturingMethod;
  if (method === "cast") {
    steps.push("Add casting sprues and vents. Ensure minimum wall thickness of 0.8mm.");
  } else if (method === "fabricated") {
    steps.push("Define sheet/wire stock profiles and solder joint locations.");
  } else {
    steps.push("Define manufacturing approach and add appropriate tooling geometry.");
  }

  if (designDna.motif && designDna.motif !== "none") {
    steps.push(`Apply motif pattern "${designDna.motif}" ensuring continuity across visible surfaces.`);
  }

  steps.push("Run boolean operations and heal surfaces.");
  steps.push("Verify manifold geometry and non-zero thickness on all bodies.");

  for (const format of formats) {
    steps.push(`Export to ${format.toUpperCase()} format with production-ready tolerances.`);
  }

  return steps;
}

// ── QA check selection ──

function selectQaChecks(designDna: DesignDna): CadPrepAgentOutput["modelingPlan"]["qaChecks"] {
  const checks: CadPrepAgentOutput["modelingPlan"]["qaChecks"] = [
    "closed_paths",
    "consistent_units",
    "nonzero_thickness",
    "manifold_geometry",
  ];

  if (designDna.gemstones.length > 0) {
    checks.push("gem_seat_clearance");
  }

  checks.push("export_roundtrip");

  return checks;
}

// ── Blocker detection ──

function detectBlockers(
  designDna: DesignDna,
  specOutput: SpecAgentOutput,
  svgOutput: SvgAgentOutput,
): CadPrepAgentOutput["blockers"] {
  const blockers: CadPrepAgentOutput["blockers"] = [];

  // Check for missing dimensions
  const hasAnyDimension =
    specOutput.dimensions.overallLength?.value != null ||
    specOutput.dimensions.overallWidth?.value != null ||
    specOutput.dimensions.overallHeight?.value != null;

  if (!hasAnyDimension) {
    blockers.push({
      code: "missing_dimensions",
      message: "No precise dimensions are available from the spec. CAD will use estimated defaults.",
      blocking: false,
    });
  }

  // Check for ambiguous profile
  if (!specOutput.construction.profile) {
    blockers.push({
      code: "ambiguous_profile",
      message: "Profile type is not specified. Side-view extrusion may require manual adjustment.",
      blocking: false,
    });
  }

  // High complexity warning
  if (designDna.complexity > 85) {
    blockers.push({
      code: "unsupported_geometry",
      message: "Very high complexity score may result in geometry that exceeds automated modeling capabilities.",
      blocking: designDna.complexity > 95,
    });
  }

  // SVG view count check
  if (svgOutput.views.length < 2) {
    blockers.push({
      code: "svg_invalid",
      message: "Fewer than two SVG views are available. 3D reconstruction may be unreliable.",
      blocking: true,
    });
  }

  return blockers;
}

export const cadPrepAgentDefinition: AgentDefinition<CadPrepAgentInput, CadPrepAgentOutput> = {
  agentId: "cad-prep-agent",
  version: "0.1.0",
  description:
    "Analyzes SVG assets and spec to produce a CAD modeling plan with QA checks and blocker detection.",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: ["jewelry-rules"],
  inputSchema: CadPrepAgentInputSchema,
  outputSchema: CadPrepAgentOutputSchema,
  timeoutMs: 5_000,
  retryable: false,
  executionKind: "deterministic",
  async execute(input) {
    const {
      svgAgentOutput,
      specOutput,
      designDna,
      specId,
      techSheetId,
      svgAssetId,
      requestedFormats,
    } = input;

    const cleanupOperations = selectCleanupOperations(svgAgentOutput);
    const modelingSteps = buildModelingSteps(designDna, specOutput, requestedFormats);
    const qaChecks = selectQaChecks(designDna);
    const blockers = detectBlockers(designDna, specOutput, svgAgentOutput);

    const requiresHumanReview =
      blockers.some((b) => b.blocking) || designDna.complexity > 80;

    return CadPrepAgentOutputSchema.parse({
      schemaVersion: "cad_prep_agent.v1",
      designId: specOutput.designId,
      specId,
      technicalSheetId: techSheetId,
      svgAssetId,
      requestedFormats,
      modelingPlan: {
        cleanupOperations,
        modelingSteps,
        qaChecks,
      },
      blockers,
      requiresHumanReview,
    });
  },
};
