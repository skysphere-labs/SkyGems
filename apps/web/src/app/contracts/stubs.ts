/**
 * Typed placeholder data aligned to the Phase 1A route and state contracts.
 * These stand in for the real backend until API worker wiring lands.
 */

import { generatePrefixedId } from "@skygems/shared";

import type {
  ArtifactRef,
  CreateDraftState,
  CreateInput,
  Design,
  DesignSpecData,
  FlowStep,
  FlowStepItem,
  GallerySearchResult,
  Generation,
  ProjectWorkspace,
  RiskFlag,
  StageSnapshot,
  StageStatus,
  SvgViewData,
  TechnicalSheetData,
} from "./types";
import { appRoutes } from "../lib/routes";
import { buildDesignDna } from "../domain/variationEngine";
import { generatePromptPreview } from "../domain/promptGenerator";

let LAST_ACTIVE_PROJECT_ID = "prj_01JQZYG7M3N8K4R5T6V7W8X9YZ";
const LAST_ACTIVE_PROJECT_STORAGE_KEY = "skygems.last-active-project.v1";

function readPersistedLastActiveProjectId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(LAST_ACTIVE_PROJECT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writePersistedLastActiveProjectId(projectId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LAST_ACTIVE_PROJECT_STORAGE_KEY, projectId);
  } catch {
    // Ignore storage failures and keep the in-memory fallback working.
  }
}

const DEFAULT_BOOTSTRAP_INPUT: CreateInput = {
  jewelryType: "ring",
  metal: "gold",
  gemstones: ["diamond"],
  style: "contemporary",
  complexity: 44,
};

function formatTimestamp(date = new Date()) {
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createPoster(params: {
  title: string;
  subtitle: string;
  accent: string;
  mode: "sketch" | "render" | "vector";
}) {
  const background =
    params.mode === "render"
      ? "linearGradient"
      : params.mode === "vector"
        ? "vectorGradient"
        : "paperGradient";
  const illustration =
    params.mode === "render"
      ? `<circle cx="450" cy="430" r="130" fill="rgba(255,255,255,0.06)" stroke="${params.accent}" stroke-width="2" />
         <path d="M338 530 C410 300, 490 300, 562 530" fill="none" stroke="${params.accent}" stroke-width="3" />
         <path d="M365 394 C420 325, 480 325, 535 394" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2" />`
      : params.mode === "vector"
        ? `<path d="M210 550 H690" stroke="${params.accent}" stroke-width="2" />
           <path d="M305 490 C390 380, 510 380, 595 490" fill="none" stroke="${params.accent}" stroke-width="3" />
           <circle cx="450" cy="390" r="85" fill="none" stroke="${params.accent}" stroke-width="3" />
           <path d="M450 120 V820" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="8 8" />`
        : `<path d="M235 560 C320 390, 580 390, 665 560" fill="none" stroke="${params.accent}" stroke-width="5" stroke-linecap="round" />
           <circle cx="450" cy="365" r="110" fill="none" stroke="${params.accent}" stroke-width="4" />
           <path d="M320 365 H580" stroke="rgba(30,30,30,0.18)" stroke-width="2" stroke-dasharray="10 10" />`;

  return svgToDataUri(`
    <svg width="900" height="1125" viewBox="0 0 900 1125" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="paperGradient" x1="0" y1="0" x2="900" y2="1125">
          <stop stop-color="#F3E8CE" />
          <stop offset="1" stop-color="#E4D8BC" />
        </linearGradient>
        <linearGradient id="linearGradient" x1="120" y1="120" x2="780" y2="1000">
          <stop stop-color="#171717" />
          <stop offset="1" stop-color="#080808" />
        </linearGradient>
        <linearGradient id="vectorGradient" x1="0" y1="0" x2="900" y2="1125">
          <stop stop-color="#0F172A" />
          <stop offset="1" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect width="900" height="1125" rx="36" fill="url(#${background})" />
      <rect x="52" y="52" width="796" height="1021" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <text x="92" y="132" fill="${params.mode === "sketch" ? "#2A2418" : "#F5DEB3"}" font-size="38" font-family="Inter, sans-serif" font-weight="700">
        ${params.title}
      </text>
      <text x="92" y="176" fill="${params.mode === "sketch" ? "#5C5138" : "rgba(255,255,255,0.65)"}" font-size="22" font-family="Inter, sans-serif">
        ${params.subtitle}
      </text>
      <g>${illustration}</g>
      <text x="92" y="1038" fill="${params.mode === "sketch" ? "#6E6243" : "rgba(255,255,255,0.45)"}" font-size="18" font-family="Inter, sans-serif">
        SkyGems placeholder asset
      </text>
      <text x="808" y="1038" text-anchor="end" fill="${params.accent}" font-size="18" font-family="Inter, sans-serif">
        ${params.mode.toUpperCase()}
      </text>
    </svg>
  `);
}

function createArtifact(
  artifactId: string,
  label: string,
  subtitle: string,
  accent: string,
  mode: "sketch" | "render" | "vector",
): ArtifactRef {
  return {
    artifactId,
    label,
    alt: `${label} preview`,
    url: createPoster({ title: label, subtitle, accent, mode }),
    kind: mode === "vector" ? "vector" : "image",
  };
}

function createStageStatus(
  status: StageStatus,
  summary: string,
  versionLabel?: string,
  updatedAt?: string,
): StageSnapshot {
  return { status, summary, versionLabel, updatedAt };
}

function createRiskFlag(
  severity: RiskFlag["severity"],
  message: string,
): RiskFlag {
  return { severity, message };
}

function createDefaultSpec(summary: string): DesignSpecData {
  return {
    versionLabel: "Not generated",
    summary,
    geometry: [],
    materials: [],
    gemstones: [],
    constructionNotes: [],
    riskFlags: [],
    missingInformation: [],
  };
}

function createDefaultTechnicalSheet(summary: string): TechnicalSheetData {
  return {
    versionLabel: "Not generated",
    generatedAt: "Awaiting upstream approval",
    geometryAndDimensions: [],
    materialsAndMetalDetails: [],
    gemstoneSchedule: [],
    constructionAndAssemblyNotes: [],
    tolerancesAndConstraints: [],
    riskFlags: [],
    missingInformation: [],
  };
}

function createSvgViews(designName: string, accent: string): SvgViewData[] {
  return [
    {
      viewId: "front",
      label: "Front",
      asset: createArtifact(
        `${designName}-svg-front`,
        "Front View",
        `${designName} vector front elevation`,
        accent,
        "vector",
      ),
      annotations: [
        "Centerline locked to stone seat.",
        "Primary prong spacing preserved for CAD handoff.",
      ],
    },
    {
      viewId: "side",
      label: "Side",
      asset: createArtifact(
        `${designName}-svg-side`,
        "Side View",
        `${designName} vector side elevation`,
        accent,
        "vector",
      ),
      annotations: [
        "Head height called out for casting clearance.",
        "Gallery rail thickness flagged for review.",
      ],
    },
    {
      viewId: "top",
      label: "Top",
      asset: createArtifact(
        `${designName}-svg-top`,
        "Top View",
        `${designName} vector plan`,
        accent,
        "vector",
      ),
      annotations: [
        "Stone map reflects approved spec schedule.",
        "Band symmetry references approved pair selection.",
      ],
    },
  ];
}

function makeDesign(params: {
  designId: string;
  projectId: string;
  displayName: string;
  selectionState: Design["selectionState"];
  sourceKind: Design["sourceKind"];
  sourceGenerationId: string;
  selectedAt?: string;
  input: CreateInput;
  accent: string;
  stages: Design["stages"];
  lineageNotes: string[];
  specData: DesignSpecData;
  technicalSheetData: TechnicalSheetData;
  svgViews: SvgViewData[];
  cadJobs: Design["cadJobs"];
  refineTargetGenerationId?: string;
}) {
  const designDna = buildDesignDna(params.input);
  const promptPreview = generatePromptPreview(params.input);

  return {
    id: params.designId,
    projectId: params.projectId,
    parentDesignId: null,
    sourceKind: params.sourceKind,
    sourceGenerationId: params.sourceGenerationId,
    selectionState: params.selectionState,
    displayName: params.displayName,
    promptSummary: promptPreview.summary,
    designDna,
    latestPairId: `${params.designId}-pair`,
    createdAt: "2026-04-05T16:18:00Z",
    selectedAt: params.selectedAt,
    sketch: createArtifact(
      `${params.designId}-sketch`,
      `${params.displayName} Sketch`,
      `${params.displayName} sketch board`,
      params.accent,
      "sketch",
    ),
    render: createArtifact(
      `${params.designId}-render`,
      `${params.displayName} Render`,
      `${params.displayName} render board`,
      params.accent,
      "render",
    ),
    stages: params.stages,
    refinePresets: [
      "Tighten silhouette",
      "Push gemstone hierarchy",
      "Reduce crown height",
      "Introduce temple detail",
    ],
    refineTargetGenerationId: params.refineTargetGenerationId,
    lineageNotes: params.lineageNotes,
    specData: params.specData,
    technicalSheetData: params.technicalSheetData,
    svgViews: params.svgViews,
    cadJobs: params.cadJobs,
  } satisfies Design;
}

const OBSIDIAN_SELECTED_INPUT: CreateInput = {
  jewelryType: "ring",
  metal: "rose-gold",
  gemstones: ["sapphire", "diamond"],
  style: "temple",
  complexity: 82,
};

const OBSIDIAN_ALTERNATE_INPUT: CreateInput = {
  jewelryType: "ring",
  metal: "gold",
  gemstones: ["sapphire"],
  style: "geometric",
  complexity: 68,
};

const OBSIDIAN_SUPERSEDED_INPUT: CreateInput = {
  jewelryType: "ring",
  metal: "platinum",
  gemstones: ["diamond"],
  style: "minimalist",
  complexity: 36,
};

const HALCYON_READY_INPUT: CreateInput = {
  jewelryType: "necklace",
  metal: "platinum",
  gemstones: ["pearl", "diamond"],
  style: "floral",
  complexity: 58,
};

const HALCYON_PENDING_INPUT: CreateInput = {
  jewelryType: "necklace",
  metal: "silver",
  gemstones: ["pearl"],
  style: "contemporary",
  complexity: 44,
};

const SOLSTICE_DRAFT_INPUT: CreateInput = {
  jewelryType: "bracelet",
  metal: "gold",
  gemstones: [],
  style: "minimalist",
  complexity: 22,
};

const PROJECT_IDS = {
  obsidianBloom: "prj_01JQZYG7M3N8K4R5T6V7W8X9YZ",
  halcyonThread: "prj_01JQZYH8N4P9M5R6T7V8W9X0YZ",
  solsticeLattice: "prj_01JQZYJ9P5R1N6T7V8W9X0Y1ZA",
} as const;

const GENERATION_IDS = {
  obsidianBloomR2: "gen_01JQZZ01A1B2C3D4E5F6G7H8JK",
  halcyonThreadR1: "gen_01JQZZ02B2C3D4E5F6G7H8JK9M",
  obsidianBloomR3: "gen_01JQZZ03C3D4E5F6G7H8JK9MNP",
  solsticeLatticeR0: "gen_01JQZZ04D4E5F6G7H8JK9MNPQ",
} as const;

const DESIGN_IDS = {
  obsidianBloomHero: "dsn_01JQZZ10E5F6G7H8JK9MNPQRS",
  obsidianBloomAngular: "dsn_01JQZZ11F6G7H8JK9MNPQRST0",
  obsidianBloomMinimal: "dsn_01JQZZ12G7H8JK9MNPQRST01V",
  halcyonThreadPearlDrop: "dsn_01JQZZ13H8JK9MNPQRST01VW2",
  obsidianBloomFailed: "dsn_01JQZZ14JK9MNPQRST01VW23X",
  halcyonThreadPartial: "dsn_01JQZZ15K9MNPQRST01VW23XY",
  halcyonThreadPending: "dsn_01JQZZ16MNPQRST01VW23XYZ",
} as const;

const obsidianSelectedDesign = makeDesign({
  designId: DESIGN_IDS.obsidianBloomHero,
  projectId: PROJECT_IDS.obsidianBloom,
  displayName: "Obsidian Bloom Hero",
  selectionState: "selected",
  sourceKind: "create",
  sourceGenerationId: GENERATION_IDS.obsidianBloomR2,
  selectedAt: "April 5, 2026 · 5:12 PM EDT",
  input: OBSIDIAN_SELECTED_INPUT,
  accent: "#D4AF37",
  stages: {
    spec: createStageStatus(
      "ready",
      "Spec v2 approved with gemstone schedule and dimensions locked.",
      "Spec v2",
      "April 5, 2026 · 4:40 PM EDT",
    ),
    technicalSheet: createStageStatus(
      "ready",
      "Tech v1 generated from approved spec.",
      "Tech v1",
      "April 5, 2026 · 4:58 PM EDT",
    ),
    svg: createStageStatus(
      "ready",
      "Front, side, and top vectors annotated for CAD.",
      "SVG v1",
      "April 5, 2026 · 5:04 PM EDT",
    ),
    cad: createStageStatus(
      "processing",
      "STL ready, STEP still processing, and DXF needs one retry.",
      "CAD batch 14",
      "April 5, 2026 · 5:17 PM EDT",
    ),
  },
  lineageNotes: [
    "Selected from Generation r2 after reviewing three pair candidates.",
    "Spec approval preserved temple motif hierarchy and sapphire dominance.",
  ],
  specData: {
    versionLabel: "Spec v2",
    summary: "Approved spec with final gemstone schedule and crown dimensions.",
    geometry: [
      { label: "Ring size", value: "US 7.0", state: "complete" },
      { label: "Head diameter", value: "17.6 mm", state: "complete" },
      { label: "Shoulder taper", value: "2.8 mm to 4.6 mm", state: "complete" },
    ],
    materials: [
      { label: "Primary metal", value: "14K rose gold", state: "complete" },
      { label: "Finish", value: "High polish with matte recess", state: "complete" },
    ],
    gemstones: [
      { label: "Center stone", value: "1 sapphire, oval, 8x6 mm", state: "complete" },
      { label: "Halo", value: "16 diamonds, 1.2 mm", state: "complete" },
    ],
    constructionNotes: [
      "Temple crown remains open under-gallery for cleaning access.",
      "Inner shank engraving zone reserved but omitted from current render pair.",
    ],
    riskFlags: [
      createRiskFlag(
        "warning",
        "Confirm final halo seat depth before CAD freeze.",
      ),
    ],
    missingInformation: ["Inner shank engraving copy is still TBD."],
  },
  technicalSheetData: {
    versionLabel: "Tech v1",
    generatedAt: "April 5, 2026 · 4:58 PM EDT",
    geometryAndDimensions: [
      { label: "Overall width", value: "17.6 mm", state: "complete" },
      { label: "Gallery height", value: "8.3 mm", state: "complete" },
      { label: "Shank base width", value: "3.1 mm", state: "complete" },
    ],
    materialsAndMetalDetails: [
      { label: "Metal", value: "14K rose gold", state: "complete" },
      { label: "Approx. target weight", value: "8.2 g", state: "complete" },
    ],
    gemstoneSchedule: [
      { label: "Center sapphire", value: "1 pc, 8x6 mm", state: "complete" },
      { label: "Halo diamonds", value: "16 pcs, 1.2 mm", state: "complete" },
    ],
    constructionAndAssemblyNotes: [
      "Prong tips to remain rounded after polish pass.",
      "Temple sidewall relief kept shallow for casting integrity.",
    ],
    tolerancesAndConstraints: [
      "Stone seat tolerance +/- 0.05 mm.",
      "Minimum wall thickness 0.8 mm across relief zone.",
    ],
    riskFlags: [
      createRiskFlag(
        "warning",
        "Halo depth must be checked against final sapphire girdle.",
      ),
    ],
    missingInformation: ["Engraving copy remains TBD and excluded from plate."],
  },
  svgViews: createSvgViews("Obsidian Bloom Hero", "#D4AF37"),
  cadJobs: [
    {
      format: "stl",
      status: "ready",
      updatedAt: "April 5, 2026 · 5:09 PM EDT",
      fileName: "obsidian-bloom-hero.stl",
      note: "Validated print mesh ready for download.",
      artifact: createArtifact(
        "cad-stl-ready",
        "STL Mesh",
        "Validated print mesh",
        "#D4AF37",
        "vector",
      ),
    },
    {
      format: "step",
      status: "processing",
      updatedAt: "April 5, 2026 · 5:17 PM EDT",
      fileName: "obsidian-bloom-hero.step",
      note: "Solid conversion in progress from SVG handoff.",
    },
    {
      format: "dxf",
      status: "failed",
      updatedAt: "April 5, 2026 · 5:11 PM EDT",
      fileName: "obsidian-bloom-hero.dxf",
      note: "Retry required for workshop drawing export.",
      errorMessage:
        "Top-view callout layer overflowed the DXF export tolerance.",
    },
  ],
  refineTargetGenerationId: GENERATION_IDS.obsidianBloomR3,
});

const obsidianAlternateDesign = makeDesign({
  designId: DESIGN_IDS.obsidianBloomAngular,
  projectId: PROJECT_IDS.obsidianBloom,
  displayName: "Obsidian Bloom Angular",
  selectionState: "candidate",
  sourceKind: "create",
  sourceGenerationId: GENERATION_IDS.obsidianBloomR2,
  input: OBSIDIAN_ALTERNATE_INPUT,
  accent: "#C7A23A",
  stages: {
    spec: createStageStatus("absent", "Spec not started for this candidate."),
    technicalSheet: createStageStatus(
      "absent",
      "Awaiting selected design promotion.",
    ),
    svg: createStageStatus("absent", "Awaiting technical sheet."),
    cad: createStageStatus("absent", "Awaiting SVG handoff."),
  },
  lineageNotes: ["Alternate pair retained as a candidate for future spec promotion."],
  specData: createDefaultSpec("Spec has not been generated for this candidate."),
  technicalSheetData: createDefaultTechnicalSheet(
    "Technical sheet blocked until spec approval.",
  ),
  svgViews: [],
  cadJobs: [],
});

const obsidianSupersededDesign = makeDesign({
  designId: DESIGN_IDS.obsidianBloomMinimal,
  projectId: PROJECT_IDS.obsidianBloom,
  displayName: "Obsidian Bloom Minimal",
  selectionState: "superseded",
  sourceKind: "create",
  sourceGenerationId: GENERATION_IDS.obsidianBloomR2,
  selectedAt: "April 5, 2026 · 2:08 PM EDT",
  input: OBSIDIAN_SUPERSEDED_INPUT,
  accent: "#A4AFC0",
  stages: {
    spec: createStageStatus(
      "stale",
      "Replaced by the selected hero pair before spec approval.",
    ),
    technicalSheet: createStageStatus("absent", "No technical sheet retained."),
    svg: createStageStatus("absent", "No SVG retained."),
    cad: createStageStatus("absent", "No CAD retained."),
  },
  lineageNotes: ["Superseded after selecting the more ornate temple direction."],
  specData: createDefaultSpec("Superseded candidate. No active spec."),
  technicalSheetData: createDefaultTechnicalSheet(
    "Superseded candidate. No active technical sheet.",
  ),
  svgViews: [],
  cadJobs: [],
});

const halcyonReadyDesign = makeDesign({
  designId: DESIGN_IDS.halcyonThreadPearlDrop,
  projectId: PROJECT_IDS.halcyonThread,
  displayName: "Halcyon Thread Pearl Drop",
  selectionState: "candidate",
  sourceKind: "create",
  sourceGenerationId: GENERATION_IDS.halcyonThreadR1,
  input: HALCYON_READY_INPUT,
  accent: "#C7D2FE",
  stages: {
    spec: createStageStatus("absent", "No selection has promoted this pair yet."),
    technicalSheet: createStageStatus("absent", "Awaiting spec."),
    svg: createStageStatus("absent", "Awaiting technical sheet."),
    cad: createStageStatus("absent", "Awaiting SVG handoff."),
  },
  lineageNotes: ["Ready pair candidate surfaced while generation is still polling."],
  specData: createDefaultSpec("Selection required before spec generation."),
  technicalSheetData: createDefaultTechnicalSheet(
    "Selection required before technical sheet generation.",
  ),
  svgViews: [],
  cadJobs: [],
});

export const stubProjects: ProjectWorkspace[] = [
  {
    projectId: PROJECT_IDS.obsidianBloom,
    name: "Obsidian Bloom",
    description: "Temple-inspired sapphire ring exploration moving into CAD.",
    status: "active",
    currentGenerationId: GENERATION_IDS.obsidianBloomR2,
    selectedDesignId: DESIGN_IDS.obsidianBloomHero,
    designCount: 3,
    createdAt: "April 4, 2026",
    updatedAt: "April 5, 2026 · 5:17 PM EDT",
  },
  {
    projectId: PROJECT_IDS.halcyonThread,
    name: "Halcyon Thread",
    description:
      "Pearl necklace generation still polling for a stable second pair.",
    status: "active",
    currentGenerationId: GENERATION_IDS.halcyonThreadR1,
    selectedDesignId: null,
    designCount: 1,
    createdAt: "April 5, 2026",
    updatedAt: "April 5, 2026 · 4:26 PM EDT",
  },
  {
    projectId: PROJECT_IDS.solsticeLattice,
    name: "Solstice Lattice",
    description: "Draft bracelet workspace waiting for the first live generation.",
    status: "active",
    currentGenerationId: GENERATION_IDS.solsticeLatticeR0,
    selectedDesignId: null,
    designCount: 0,
    createdAt: "April 5, 2026",
    updatedAt: "April 5, 2026 · 1:02 PM EDT",
  },
];

export const stubCreateDrafts: Record<string, CreateDraftState> = {
  [PROJECT_IDS.obsidianBloom]: {
    projectId: PROJECT_IDS.obsidianBloom,
    inputs: OBSIDIAN_SELECTED_INPUT,
    inputRevision: 7,
    promptMode: "synced",
    promptValue: generatePromptPreview(OBSIDIAN_SELECTED_INPUT).prompt,
    previewStatus: "ready",
    previewRevision: 7,
  },
  [PROJECT_IDS.halcyonThread]: {
    projectId: PROJECT_IDS.halcyonThread,
    inputs: HALCYON_PENDING_INPUT,
    inputRevision: 3,
    promptMode: "synced",
    promptValue: generatePromptPreview(HALCYON_PENDING_INPUT).prompt,
    previewStatus: "ready",
    previewRevision: 3,
  },
  [PROJECT_IDS.solsticeLattice]: {
    projectId: PROJECT_IDS.solsticeLattice,
    inputs: SOLSTICE_DRAFT_INPUT,
    inputRevision: 1,
    promptMode: "synced",
    promptValue: generatePromptPreview(SOLSTICE_DRAFT_INPUT).prompt,
    previewStatus: "ready",
    previewRevision: 1,
  },
};

export const stubGenerations: Record<string, Generation> = {
  [GENERATION_IDS.obsidianBloomR2]: {
    id: GENERATION_IDS.obsidianBloomR2,
    projectId: PROJECT_IDS.obsidianBloom,
    requestKind: "create",
    status: "completed",
    pairStandardVersion: "pair_v1",
    createdAt: "April 5, 2026 · 4:18 PM EDT",
    completedAt: "April 5, 2026 · 4:33 PM EDT",
    message:
      "Completed placeholder payload keeps pair ordering stable and surfaces the selected candidate without reintroducing preview routes.",
    readyPairs: 2,
    totalPairs: 3,
    reconnecting: false,
    pairs: [
      {
        designId: obsidianSelectedDesign.id,
        pairLabel: "Pair 01",
        designDna: obsidianSelectedDesign.designDna,
        status: "ready",
        sketchArtifactUrl: obsidianSelectedDesign.sketch.url,
        renderArtifactUrl: obsidianSelectedDesign.render.url,
        sourceGenerationId: GENERATION_IDS.obsidianBloomR2,
        note: "Selected pair now drives the downstream production lane.",
      },
      {
        designId: obsidianAlternateDesign.id,
        pairLabel: "Pair 02",
        designDna: obsidianAlternateDesign.designDna,
        status: "ready",
        sketchArtifactUrl: obsidianAlternateDesign.sketch.url,
        renderArtifactUrl: obsidianAlternateDesign.render.url,
        sourceGenerationId: GENERATION_IDS.obsidianBloomR2,
        note: "Retained as an alternate direction.",
      },
      {
        designId: DESIGN_IDS.obsidianBloomFailed,
        pairLabel: "Pair 03",
        designDna: obsidianSupersededDesign.designDna,
        status: "failed",
        sourceGenerationId: GENERATION_IDS.obsidianBloomR2,
        note: "Render slot failed downstream validation in the placeholder dataset.",
      },
    ],
  },
  [GENERATION_IDS.halcyonThreadR1]: {
    id: GENERATION_IDS.halcyonThreadR1,
    projectId: PROJECT_IDS.halcyonThread,
    requestKind: "create",
    status: "processing",
    pairStandardVersion: "pair_v1",
    createdAt: "April 5, 2026 · 4:09 PM EDT",
    message:
      "This shell preserves last-good pair data during a transient poll interruption instead of blanking the screen.",
    readyPairs: 1,
    totalPairs: 3,
    reconnecting: true,
    pairs: [
      {
        designId: halcyonReadyDesign.id,
        pairLabel: "Pair 01",
        designDna: halcyonReadyDesign.designDna,
        status: "ready",
        sketchArtifactUrl: halcyonReadyDesign.sketch.url,
        renderArtifactUrl: halcyonReadyDesign.render.url,
        sourceGenerationId: GENERATION_IDS.halcyonThreadR1,
        note: "Ready candidate can be selected while the remaining slots continue processing.",
      },
      {
        designId: DESIGN_IDS.halcyonThreadPartial,
        pairLabel: "Pair 02",
        designDna: buildDesignDna(HALCYON_PENDING_INPUT),
        status: "partial",
        sketchArtifactUrl: createArtifact(
          "halcyon-partial-sketch",
          "Pair 02 Sketch",
          "Halcyon Thread partial sketch",
          "#C7D2FE",
          "sketch",
        ).url,
        sourceGenerationId: GENERATION_IDS.halcyonThreadR1,
        note: "Sketch arrived first; render slot is still pending.",
      },
      {
        designId: DESIGN_IDS.halcyonThreadPending,
        pairLabel: "Pair 03",
        designDna: buildDesignDna({
          jewelryType: "necklace",
          metal: "silver",
          gemstones: ["diamond"],
          style: "minimalist",
          complexity: 28,
        }),
        status: "pending",
        sourceGenerationId: GENERATION_IDS.halcyonThreadR1,
        note: "Queue placeholder for a third pair.",
      },
    ],
  },
  [GENERATION_IDS.obsidianBloomR3]: {
    id: GENERATION_IDS.obsidianBloomR3,
    projectId: PROJECT_IDS.obsidianBloom,
    requestKind: "refine",
    status: "queued",
    pairStandardVersion: "pair_v1",
    createdAt: "April 5, 2026 · 5:22 PM EDT",
    message:
      "Queued placeholder generation reserved for refine handoff once backend foundation merges.",
    readyPairs: 0,
    totalPairs: 2,
    reconnecting: false,
    pairs: [],
  },
  [GENERATION_IDS.solsticeLatticeR0]: {
    id: GENERATION_IDS.solsticeLatticeR0,
    projectId: PROJECT_IDS.solsticeLattice,
    requestKind: "create",
    status: "queued",
    pairStandardVersion: "pair_v1",
    createdAt: "April 5, 2026 · 1:10 PM EDT",
    message: "Fresh draft project waiting for its first backend-backed generation.",
    readyPairs: 0,
    totalPairs: 2,
    reconnecting: false,
    pairs: [],
  },
};

export const stubDesigns: Record<string, Design> = {
  [obsidianSelectedDesign.id]: obsidianSelectedDesign,
  [obsidianAlternateDesign.id]: obsidianAlternateDesign,
  [obsidianSupersededDesign.id]: obsidianSupersededDesign,
  [halcyonReadyDesign.id]: halcyonReadyDesign,
};

export const stubGalleryResults: GallerySearchResult[] = Object.values(
  stubDesigns,
).map((design) => ({
  designId: design.id,
  projectId: design.projectId,
  displayName: design.displayName,
  summary: design.promptSummary,
  selectionState: design.selectionState,
  designDna: design.designDna,
  sketchThumbnailUrl: design.sketch.url,
  renderThumbnailUrl: design.render.url,
  createdAt: design.createdAt,
}));

export function getLastActiveProjectId() {
  return readPersistedLastActiveProjectId() ?? LAST_ACTIVE_PROJECT_ID;
}

export function rememberLastActiveProject(projectId: string) {
  LAST_ACTIVE_PROJECT_ID = projectId;
  writePersistedLastActiveProjectId(projectId);
}

export function getProjectById(projectId: string) {
  return stubProjects.find((project) => project.projectId === projectId) ?? null;
}

export function getCreateDraftByProjectId(projectId: string) {
  return stubCreateDrafts[projectId] ?? null;
}

export function getGenerationById(generationId: string) {
  return stubGenerations[generationId] ?? null;
}

export function listGenerationsForProject(projectId: string) {
  return Object.values(stubGenerations).filter(
    (generation) => generation.projectId === projectId,
  );
}

export function getDesignById(designId: string) {
  return stubDesigns[designId] ?? null;
}

export function listDesignsForProject(projectId: string) {
  return Object.values(stubDesigns).filter(
    (design) => design.projectId === projectId,
  );
}

export function searchGalleryResults(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return stubGalleryResults;
  }

  return stubGalleryResults.filter((result) => {
    return (
      result.displayName.toLowerCase().includes(normalizedQuery) ||
      result.summary.toLowerCase().includes(normalizedQuery) ||
      result.designDna.jewelryType.includes(normalizedQuery) ||
      result.designDna.style.includes(normalizedQuery) ||
      result.designDna.metal.includes(normalizedQuery)
    );
  });
}

export function bootstrapProjectWorkspace(name?: string): ProjectWorkspace {
  const projectId = generatePrefixedId("prj");
  const generationId = generatePrefixedId("gen");
  const createdAt = formatTimestamp();
  const project: ProjectWorkspace = {
    projectId,
    name: name?.trim() || `Project ${stubProjects.length + 1}`,
    description: "Fresh draft workspace prepared for the first integrated generation.",
    status: "active",
    currentGenerationId: generationId,
    selectedDesignId: null,
    designCount: 0,
    createdAt,
    updatedAt: createdAt,
  };

  stubProjects.unshift(project);
  stubCreateDrafts[projectId] = {
    projectId,
    inputs: DEFAULT_BOOTSTRAP_INPUT,
    inputRevision: 1,
    promptMode: "synced",
    promptValue: generatePromptPreview(DEFAULT_BOOTSTRAP_INPUT).prompt,
    previewStatus: "ready",
    previewRevision: 1,
  };
  stubGenerations[generationId] = {
    id: generationId,
    projectId,
    requestKind: "create",
    status: "queued",
    pairStandardVersion: "pair_v1",
    createdAt,
    message: "Fresh draft project waiting for its first backend-backed generation.",
    readyPairs: 0,
    totalPairs: 2,
    reconnecting: false,
    pairs: [],
  };
  rememberLastActiveProject(projectId);

  return project;
}

export function enqueueStubGeneration(projectId: string, requestKind: Generation["requestKind"] = "create") {
  const project = getProjectById(projectId);
  const draft = getCreateDraftByProjectId(projectId);
  const generationId = generatePrefixedId("gen");
  const createdAt = formatTimestamp();
  const generation: Generation = {
    id: generationId,
    projectId,
    requestKind,
    status: "queued",
    pairStandardVersion: "pair_v1",
    createdAt,
    message:
      requestKind === "refine"
        ? "Refine placeholder generation queued for the next selected design cycle."
        : "Integrated foundation placeholder queued this draft for generation polling.",
    readyPairs: 0,
    totalPairs: 2,
    reconnecting: false,
    pairs: [],
  };

  stubGenerations[generationId] = generation;

  if (project) {
    project.currentGenerationId = generationId;
    project.updatedAt = createdAt;
  }

  if (draft) {
    draft.promptMode = "synced";
  }

  rememberLastActiveProject(projectId);
  return generation;
}

function mapGenerationStatusToStageStatus(
  status: Generation["status"],
): StageStatus {
  switch (status) {
    case "queued":
      return "queued";
    case "processing":
    case "running":
      return "processing";
    case "completed":
    case "succeeded":
      return "ready";
    case "canceled":
      return "stale";
    case "failed":
      return "failed";
  }
}

export function inferCurrentFlowStep(pathname: string, projectId?: string | null): FlowStep {
  if (!projectId) return "create";
  if (pathname.includes("/technical-sheet")) return "technical-sheet";
  if (pathname.includes("/svg")) return "svg";
  if (pathname.includes("/cad")) return "cad";
  if (pathname.includes("/spec")) return "spec";
  if (pathname.includes("/generations/")) return "generate";
  if (pathname.includes("/designs/")) return "select";
  if (pathname.includes("/create")) return "create";

  const project = getProjectById(projectId);
  if (project?.selectedDesignId) return "select";
  if (project?.currentGenerationId) return "generate";
  return "create";
}

export function getProjectFlowSteps(
  projectId: string,
  pathname: string,
  routeDesignId?: string,
  routeGenerationId?: string,
): FlowStepItem[] {
  const project = getProjectById(projectId);
  if (!project) {
    return [];
  }

  const generation = routeGenerationId
    ? getGenerationById(routeGenerationId)
    : project.currentGenerationId
      ? getGenerationById(project.currentGenerationId)
      : null;
  const design = routeDesignId
    ? getDesignById(routeDesignId)
    : project.selectedDesignId
      ? getDesignById(project.selectedDesignId)
      : null;

  const selectStatus: StageStatus = project.selectedDesignId
    ? "ready"
    : generation && generation.readyPairs > 0
      ? "processing"
      : "absent";

  const steps: FlowStepItem[] = [
    {
      id: "create",
      label: "Create",
      description: "Structured inputs and prompt preview.",
      status: "ready",
      href: appRoutes.create(projectId),
    },
    {
      id: "generate",
      label: "Generate Pair",
      description: "Queue and poll pair candidates.",
      status: generation ? mapGenerationStatusToStageStatus(generation.status) : "absent",
      href: generation ? appRoutes.generation(projectId, generation.id) : undefined,
    },
    {
      id: "select",
      label: "Select",
      description: "Choose the active project design.",
      status: selectStatus,
      href: design ? appRoutes.design(projectId, design.id) : undefined,
    },
    {
      id: "spec",
      label: "Spec",
      description: "Approve structured production intent.",
      status: design?.stages.spec.status ?? "absent",
      href: design ? appRoutes.spec(projectId, design.id) : undefined,
    },
    {
      id: "technical-sheet",
      label: "Technical Sheet",
      description: "Manufacturing-facing packet review.",
      status: design?.stages.technicalSheet.status ?? "absent",
      href: design ? appRoutes.technicalSheet(projectId, design.id) : undefined,
    },
    {
      id: "svg",
      label: "SVG",
      description: "Inspect vector views and annotations.",
      status: design?.stages.svg.status ?? "absent",
      href: design ? appRoutes.svg(projectId, design.id) : undefined,
    },
    {
      id: "cad",
      label: "CAD",
      description: "Track per-format export jobs.",
      status: design?.stages.cad.status ?? "absent",
      href: design ? appRoutes.cad(projectId, design.id) : undefined,
    },
  ];

  return steps.map((step) => ({
    ...step,
    description:
      step.href && pathname === step.href
        ? `${step.description} You are here.`
        : step.description,
  }));
}
