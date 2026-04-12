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

import type { AgentContext, AgentDefinition } from "../types.ts";

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

function estimateStrokeCount(designDna: DesignDna, viewType: string): number {
  const base = viewType === "front" ? 120 : viewType === "side" ? 80 : 60;
  const complexityFactor = 1 + designDna.complexity / 100;
  const gemBonus = designDna.gemstones.length * 15;
  return Math.round((base + gemBonus) * complexityFactor);
}

function buildViewDescription(
  designDna: DesignDna,
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

  return descriptions[viewType]?.[type] ?? `${viewType} view of ${style} ${metal} ${type}.`;
}

async function generateSvgWithLLM(
  techSheetOutput: TechSheetAgentOutput,
  designDna: DesignDna,
  viewType: "front" | "side" | "top",
  apiKey: string,
): Promise<string | null> {
  const dims = svgDimensionsByType[designDna.jewelryType] ?? svgDimensionsByType.ring;
  const viewWidth = viewType === "top" ? dims.heightMm : dims.widthMm;
  const viewHeight = viewType === "top" ? dims.widthMm : dims.heightMm;

  const dimensionSummary = techSheetOutput.geometryAndDimensions
    .map(d => `${d.label}: ${d.value}`)
    .join("\n");

  const systemPrompt = `You are a technical jewelry illustrator. Generate clean SVG technical drawings for manufacturing.

## Rules
- Use a viewBox appropriate for the piece (e.g., "0 0 ${viewWidth * 10} ${viewHeight * 10}")
- Draw clean lines using <path>, <line>, <circle>, <ellipse>, <rect> elements
- Use stroke="#333" fill="none" stroke-width="1" for outlines
- Use stroke="#999" stroke-dasharray="4 2" for dimension lines
- Use stroke="#666" for internal details (settings, facets)
- Include dimension annotations as <text> elements
- Keep the SVG clean and professional — no gradients, no fills, just line work
- The drawing should be a technical orthographic view, not artistic
- Include centerlines where appropriate (stroke-dasharray="8 4")

## Output
Return ONLY the SVG markup starting with <svg and ending with </svg>. No markdown, no explanation.`;

  const userMessage = `Draw a ${viewType} view technical drawing of a ${designDna.style} ${designDna.jewelryType} in ${designDna.metal}.

Dimensions:
${dimensionSummary}

Setting: ${designDna.settingType}
Gemstones: ${designDna.gemstones.join(", ") || "none"}
Profile: ${designDna.profile}
Complexity: ${designDna.complexity}/100`;

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
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    // Extract SVG content
    const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i);
    return svgMatch ? svgMatch[0] : null;
  } catch {
    return null;
  }
}

export const svgAgentDefinition: AgentDefinition<SvgAgentInput, SvgAgentOutput> = {
  agentId: "svg-agent",
  version: "2.0.0",
  description: "Uses LLM to produce SVG technical drawings (front, side, top) from tech-sheet data. Falls back to metadata-only output if LLM unavailable.",
  requiredPacks: ["prompt-pack", "view-pack"],
  requiredProviders: [],
  skills: ["view-plan"],
  inputSchema: SvgAgentInputSchema,
  outputSchema: SvgAgentOutputSchema,
  timeoutMs: 45_000,
  retryable: true,
  executionKind: "hybrid",
  async execute(input, ctx) {
    const { techSheetOutput, designDna, specId, techSheetId } = input;
    const dims = svgDimensionsByType[designDna.jewelryType] ?? svgDimensionsByType.ring;
    const viewTypes = ["front", "side", "top"] as const;
    const apiKey = ctx.env?.XAI_API_KEY?.trim();

    // Generate SVG content for each view (sequentially to avoid rate limits)
    const views = [];
    for (const view of viewTypes) {
      let svgContent: string | undefined;

      if (apiKey) {
        const content = await generateSvgWithLLM(techSheetOutput, designDna, view, apiKey);
        if (content) svgContent = content;
      }

      views.push({
        view,
        artifactId: `svg-${view}-${designDna.jewelryType}-${designDna.metal}`,
        description: buildViewDescription(designDna, view),
        svgContent,
      });
    }

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
