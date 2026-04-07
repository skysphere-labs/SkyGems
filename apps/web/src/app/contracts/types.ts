/**
 * Phase 1A aligned frontend contracts for the canonical workspace shell.
 * These stay typed even while backend wiring is still placeholder-only.
 */

import type {
  CadFormat as SharedCadFormat,
  CreateDesignInput,
  DesignDna as SharedDesignDna,
  Gemstone as SharedGemstone,
  JewelryType as SharedJewelryType,
  Metal as SharedMetal,
  RenderMode as SharedRenderMode,
  RequestKind as SharedRequestKind,
  SelectionState as SharedSelectionState,
  Style as SharedStyle,
} from "@skygems/shared";

export type PromptMode = "synced" | "override";
export type ApiSource = "live" | "fallback";

export type GenerationStatus =
  | "queued"
  | "processing"
  | "running"
  | "completed"
  | "succeeded"
  | "failed"
  | "canceled";

export type PairStatus = "pending" | "partial" | "ready" | "failed";

export type StageStatus =
  | "absent"
  | "not_requested"
  | "queued"
  | "processing"
  | "running"
  | "ready"
  | "succeeded"
  | "failed"
  | "skipped"
  | "stale";

export type SelectionState = SharedSelectionState;

export type SourceKind = SharedRequestKind;

export const FLOW_STEPS = [
  "create",
  "generate",
  "select",
  "spec",
  "technical-sheet",
  "svg",
  "cad",
] as const;

export type FlowStep = (typeof FLOW_STEPS)[number];

export type JewelryType = SharedJewelryType;

export type Metal = SharedMetal;

export type Gemstone = SharedGemstone;

export type DesignStyle = SharedStyle;

export type RenderMode = SharedRenderMode;

export type CadFormat = SharedCadFormat;
export type CadJobStatus =
  | "queued"
  | "processing"
  | "running"
  | "ready"
  | "succeeded"
  | "failed"
  | "stale"
  | "skipped";

export type CreateInput = Omit<CreateDesignInput, "pairStandardVersion" | "projectId">;

export type DesignDna = SharedDesignDna;

export interface ArtifactRef {
  artifactId: string;
  label: string;
  alt: string;
  url: string;
  kind: "image" | "vector" | "document";
}

export interface ProjectWorkspace {
  projectId: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  currentGenerationId?: string | null;
  selectedDesignId?: string | null;
  designCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDraftState {
  projectId: string;
  inputs: CreateInput;
  inputRevision: number;
  promptMode: PromptMode;
  promptValue: string;
  renderMode: RenderMode;
  previewStatus: "idle" | "loading" | "ready" | "error";
  previewRevision?: number;
}

export interface PairCandidate {
  designId: string;
  pairLabel: string;
  designDna: DesignDna;
  status: PairStatus;
  sketchArtifactUrl?: string;
  renderArtifactUrl?: string;
  sourceGenerationId: string;
  note?: string;
}

export interface Generation {
  id: string;
  projectId: string;
  requestKind: SourceKind;
  status: GenerationStatus;
  pairStandardVersion: "pair_v1";
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  message: string;
  readyPairs: number;
  totalPairs: number;
  reconnecting: boolean;
  pairs: PairCandidate[];
  source?: ApiSource;
  lastCheckedAt?: string;
}

export interface RiskFlag {
  severity: "blocking" | "warning" | "informational";
  message: string;
  field?: string;
}

export interface SpecField {
  label: string;
  value: string;
  state?: "complete" | "tbd" | "warning";
}

export interface StageSnapshot {
  status: StageStatus;
  summary: string;
  versionLabel?: string;
  updatedAt?: string;
}

export interface DownstreamStages {
  spec: StageSnapshot;
  technicalSheet: StageSnapshot;
  svg: StageSnapshot;
  cad: StageSnapshot;
}

export interface DesignSpecData {
  versionLabel: string;
  summary: string;
  geometry: SpecField[];
  materials: SpecField[];
  gemstones: SpecField[];
  constructionNotes: string[];
  riskFlags: RiskFlag[];
  missingInformation: string[];
}

export interface BomLineItem {
  item: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  source: string;
}

export interface EstimatedRetailPrice {
  low: number;
  mid: number;
  high: number;
  currency: string;
}

export interface TechnicalSheetData {
  versionLabel: string;
  generatedAt: string;
  geometryAndDimensions: SpecField[];
  materialsAndMetalDetails: SpecField[];
  gemstoneSchedule: SpecField[];
  constructionAndAssemblyNotes: string[];
  tolerancesAndConstraints: string[];
  riskFlags: RiskFlag[];
  missingInformation: string[];
  billOfMaterials?: BomLineItem[];
  estimatedRetailPrice?: EstimatedRetailPrice;
}

export interface SvgViewData {
  viewId: "front" | "side" | "top";
  label: string;
  asset: ArtifactRef;
  annotations: string[];
}

export interface CadJobRecord {
  format: CadFormat;
  status: CadJobStatus;
  updatedAt: string;
  fileName: string;
  note: string;
  artifact?: ArtifactRef;
  errorMessage?: string;
}

export interface Design {
  id: string;
  projectId: string;
  parentDesignId?: string | null;
  sourceKind: SourceKind;
  sourceGenerationId: string;
  selectionState: SelectionState;
  displayName: string;
  promptSummary: string;
  designDna: DesignDna;
  latestPairId?: string;
  createdAt: string;
  selectedAt?: string;
  sketch: ArtifactRef;
  render: ArtifactRef;
  stages: DownstreamStages;
  refinePresets: string[];
  refineTargetGenerationId?: string;
  lineageNotes: string[];
  specData: DesignSpecData;
  technicalSheetData: TechnicalSheetData;
  svgViews: SvgViewData[];
  cadJobs: CadJobRecord[];
}

export interface GallerySearchResult {
  designId: string;
  projectId: string;
  displayName: string;
  summary: string;
  selectionState: SelectionState;
  designDna: DesignDna;
  sketchThumbnailUrl?: string;
  renderThumbnailUrl?: string;
  createdAt: string;
}

export interface FlowStepItem {
  id: FlowStep;
  label: string;
  description: string;
  status: StageStatus;
  href?: string;
}
