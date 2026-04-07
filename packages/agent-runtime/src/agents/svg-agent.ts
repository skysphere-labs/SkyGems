import {
  DesignDnaSchema,
  SpecIdSchema,
  SvgAgentOutputSchema,
  TechSheetAgentOutputSchema,
  TechSheetIdSchema,
  type DesignDna,
  type SvgAgentOutput,
  type TechSheetAgentOutput,
} from "@skygems/shared";
import { z } from "zod";

import type { AgentDefinition } from "../types.ts";

export const SvgAgentInputSchema = z.object({
  techSheetOutput: TechSheetAgentOutputSchema,
  designDna: DesignDnaSchema,
  specId: SpecIdSchema,
  techSheetId: TechSheetIdSchema,
});

export type SvgAgentInput = z.infer<typeof SvgAgentInputSchema>;

// ── SVG dimension defaults by jewelry type ──

const svgDimensionsByType: Record<string, { widthMm: number; heightMm: number }> = {
  ring: { widthMm: 40, heightMm: 50 },
  necklace: { widthMm: 120, heightMm: 160 },
  bracelet: { widthMm: 100, heightMm: 60 },
  earrings: { widthMm: 30, heightMm: 45 },
  pendant: { widthMm: 35, heightMm: 50 },
};

// ── Stroke count estimation based on design complexity ──

function estimateStrokeCount(designDna: DesignDna, viewType: string): number {
  const base = viewType === "front" ? 120 : viewType === "side" ? 80 : 60;
  const complexityFactor = 1 + designDna.complexity / 100;
  const gemBonus = designDna.gemstones.length * 15;
  return Math.round((base + gemBonus) * complexityFactor);
}

// ── View description generator ──

function buildViewDescription(
  designDna: DesignDna,
  techSheetOutput: TechSheetAgentOutput,
  viewType: "front" | "side" | "top",
): string {
  const type = designDna.jewelryType;
  const metal = designDna.metal;
  const style = designDna.style;

  const descriptions: Record<string, Record<string, string>> = {
    front: {
      ring: `Front elevation of ${style} ${metal} ring showing setting profile and stone placement.`,
      necklace: `Front view of ${style} ${metal} necklace with pendant and chain detail.`,
      bracelet: `Front elevation of ${style} ${metal} bracelet showing clasp and link detail.`,
      earrings: `Front view of ${style} ${metal} earrings showing drop profile and stone layout.`,
      pendant: `Front elevation of ${style} ${metal} pendant with bail and stone setting.`,
    },
    side: {
      ring: `Side profile of ${metal} ring band showing thickness and crown height.`,
      necklace: `Side profile of ${metal} necklace showing pendant depth and bail clearance.`,
      bracelet: `Side profile of ${metal} bracelet showing band thickness and curvature.`,
      earrings: `Side profile of ${metal} earrings showing post angle and depth.`,
      pendant: `Side profile of ${metal} pendant showing depth and bail geometry.`,
    },
    top: {
      ring: `Top-down plan view of ${metal} ring showing stone symmetry and band geometry.`,
      necklace: `Top-down plan view of ${metal} necklace pendant showing stone layout.`,
      bracelet: `Top-down plan view of ${metal} bracelet showing pattern continuity.`,
      earrings: `Top-down plan view of ${metal} earrings showing symmetry and post placement.`,
      pendant: `Top-down plan view of ${metal} pendant showing stone arrangement and silhouette.`,
    },
  };

  return (
    descriptions[viewType]?.[type] ??
    `${viewType.charAt(0).toUpperCase() + viewType.slice(1)} view of ${style} ${metal} ${type}.`
  );
}

export const svgAgentDefinition: AgentDefinition<SvgAgentInput, SvgAgentOutput> = {
  agentId: "svg-agent",
  version: "0.1.0",
  description:
    "Produces structured SVG view metadata (front, side, top) from tech-sheet output for CAD handoff.",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: ["view-plan"],
  inputSchema: SvgAgentInputSchema,
  outputSchema: SvgAgentOutputSchema,
  timeoutMs: 5_000,
  retryable: false,
  executionKind: "deterministic",
  async execute(input) {
    const { techSheetOutput, designDna, specId, techSheetId } = input;
    const dims = svgDimensionsByType[designDna.jewelryType] ?? svgDimensionsByType.ring;

    const viewTypes = ["front", "side", "top"] as const;

    const views = viewTypes.map((view) => ({
      view,
      artifactId: `svg-${view}-${designDna.jewelryType}-${designDna.metal}`,
      description: buildViewDescription(designDna, techSheetOutput, view),
    }));

    const manifestViews = viewTypes.map((view) => ({
      view,
      widthMm: view === "top" ? dims.heightMm : dims.widthMm,
      heightMm: view === "top" ? dims.widthMm : dims.heightMm,
      strokeCount: estimateStrokeCount(designDna, view),
    }));

    return SvgAgentOutputSchema.parse({
      schemaVersion: "svg_agent.v1",
      designId: techSheetOutput.designId,
      specId,
      technicalSheetId: techSheetId,
      views,
      annotationsArtifactId: null,
      manifestJson: {
        viewCount: views.length,
        views: manifestViews,
      },
    });
  },
};
