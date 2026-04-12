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

import type { AgentContext, AgentDefinition } from "../types.ts";

export const CadPrepAgentInputSchema = z.object({
  svgAgentOutput: SvgAgentOutputSchema,
  specOutput: SpecAgentOutputSchema,
  designDna: DesignDnaSchema,
  specId: SpecIdSchema,
  techSheetId: TechSheetIdSchema,
  svgAssetId: SvgAssetIdSchema,
  requestedFormats: z.array(z.enum(["step", "dxf", "stl", "cdr"])).min(1),
});

export type CadPrepAgentInput = z.infer<typeof CadPrepAgentInputSchema>;

// ── Cleanup operation selection ──

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
    if (format === "cdr") {
      steps.push("Export SVG to CDR format via CorelDraw conversion with proper layer mapping.");
    } else {
      steps.push(`Export to ${format.toUpperCase()} format with production-ready tolerances.`);
    }
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

  if (!specOutput.construction.profile) {
    blockers.push({
      code: "ambiguous_profile",
      message: "Profile type is not specified. Side-view extrusion may require manual adjustment.",
      blocking: false,
    });
  }

  if (designDna.complexity > 85) {
    blockers.push({
      code: "unsupported_geometry",
      message: "Very high complexity score may result in geometry that exceeds automated modeling capabilities.",
      blocking: designDna.complexity > 95,
    });
  }

  if (svgOutput.views.length < 2) {
    blockers.push({
      code: "svg_invalid",
      message: "Fewer than two SVG views are available. 3D reconstruction may be unreliable.",
      blocking: true,
    });
  }

  return blockers;
}

async function generateCadPlanWithLLM(
  svgAgentOutput: SvgAgentOutput,
  specOutput: SpecAgentOutput,
  designDna: DesignDna,
  requestedFormats: CadFormat[],
  apiKey: string,
): Promise<{ modelingSteps?: string[]; cleanupOperations?: string[]; qaChecks?: string[] } | null> {
  const systemPrompt = `You are a CAD engineer specializing in jewelry manufacturing. Given a jewelry design's specs, SVG views, and requested output formats, produce a detailed modeling plan.

## Output
Return ONLY valid JSON — no markdown:
{
  "modelingSteps": ["step 1", "step 2", ...],
  "cleanupOperations": ["operation 1", ...],
  "qaChecks": ["check 1", ...]
}

Make steps specific to this jewelry piece — reference actual dimensions, settings, and materials. Include CDR conversion steps if CDR format is requested.`;

  const specSummary = [
    `Type: ${specOutput.jewelryType}, Metal: ${specOutput.materials.metal}`,
    `Setting: ${specOutput.construction.settingType}, Profile: ${specOutput.construction.profile}`,
    `Manufacturing: ${specOutput.construction.manufacturingMethod}`,
    `Gemstones: ${specOutput.materials.gemstones.map(g => g.stoneType).join(", ") || "none"}`,
    `Complexity: ${designDna.complexity}/100`,
    `SVG views: ${svgAgentOutput.views.map(v => v.view).join(", ")}`,
    `Has SVG content: ${svgAgentOutput.views.some(v => v.svgContent) ? "yes" : "metadata only"}`,
    `Formats requested: ${requestedFormats.join(", ")}`,
  ].join("\n");

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
          { role: "user", content: `Create a CAD modeling plan for this jewelry design:\n\n${specSummary}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
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

    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export const cadPrepAgentDefinition: AgentDefinition<CadPrepAgentInput, CadPrepAgentOutput> = {
  agentId: "cad-prep-agent",
  version: "2.0.0",
  description: "Uses LLM intelligence to produce detailed CAD modeling plans with QA checks and blocker detection. Supports CDR format. Falls back to deterministic planning if LLM unavailable.",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: ["jewelry-rules"],
  inputSchema: CadPrepAgentInputSchema,
  outputSchema: CadPrepAgentOutputSchema,
  timeoutMs: 20_000,
  retryable: true,
  executionKind: "hybrid",
  async execute(input, ctx) {
    const {
      svgAgentOutput,
      specOutput,
      designDna,
      specId,
      techSheetId,
      svgAssetId,
      requestedFormats,
    } = input;

    const apiKey = ctx.env?.XAI_API_KEY?.trim();
    let llmPlan: { modelingSteps?: string[]; cleanupOperations?: string[]; qaChecks?: string[] } | null = null;

    if (apiKey) {
      llmPlan = await generateCadPlanWithLLM(svgAgentOutput, specOutput, designDna, requestedFormats, apiKey);
    }

    const cleanupOperations = llmPlan?.cleanupOperations ?? selectCleanupOperations(svgAgentOutput);
    const modelingSteps = llmPlan?.modelingSteps ?? buildModelingSteps(designDna, specOutput, requestedFormats);
    const qaChecks = llmPlan?.qaChecks ?? selectQaChecks(designDna);
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
