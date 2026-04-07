import { z } from "zod";
import { SpecAgentOutputSchema, TechSheetAgentOutputSchema } from "./agents.ts";

import {
  CadFormatEnum,
  DesignSourceKindEnum,
  GenerationStatusEnum,
  GenerateExecutionModeEnum,
  GenerateExecutionSourceEnum,
  ManufacturingIntentEnum,
  ReadinessEnum,
  RefinePresetEnum,
  RefinePreserveEnum,
  RequestKindEnum,
  SelectionStateEnum,
  SvgViewEnum,
  WorkflowCurrentStageEnum,
  WorkflowStatusEnum,
  WorkflowTargetStageEnum,
} from "./enums.ts";
import {
  CadJobIdSchema,
  DesignIdSchema,
  GenerationIdSchema,
  PairIdSchema,
  ProjectIdSchema,
  SpecIdSchema,
  SvgAssetIdSchema,
  TechSheetIdSchema,
  TenantIdSchema,
  UserIdSchema,
  WorkflowRunIdSchema,
} from "./ids.ts";
import {
  ArtifactPublicSchema,
  CreateDesignInputSchema,
  DesignDnaSchema,
  DesignDnaPreviewSchema,
  IsoTimestampSchema,
  PairStandardVersion,
  PromptPreviewVersion,
  StageStatusesSchema,
  TechStandardVersion,
  SvgStandardVersion,
  SpecStandardVersion,
} from "./primitives.ts";

export const PromptPreviewRequestSchema = CreateDesignInputSchema;

export const PromptPreviewResponseSchema = z.object({
  projectId: ProjectIdSchema,
  promptPreviewVersion: z.literal(PromptPreviewVersion),
  pairStandardVersion: z.literal(PairStandardVersion),
  normalizedInput: CreateDesignInputSchema.omit({ projectId: true }),
  designDnaPreview: DesignDnaPreviewSchema,
  promptSummary: z.string().min(1).max(240),
  promptText: z.string().min(1).max(8000),
});

export const DevBootstrapRequestSchema = z.object({
  tenantSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,64}$/)
    .optional(),
  tenantName: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(320).optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
  projectName: z.string().trim().min(1).max(160).optional(),
  projectDescription: z.string().trim().max(500).optional(),
});

export const DevBootstrapResponseSchema = z.object({
  mode: z.literal("dev_bootstrap"),
  sessionToken: z.string().min(1),
  sessionExpiresAt: IsoTimestampSchema,
  tenant: z.object({
    id: TenantIdSchema,
    slug: z.string().min(1).max(64),
    name: z.string().min(1).max(120),
  }),
  user: z.object({
    id: UserIdSchema,
    email: z.string().email(),
    displayName: z.string().nullable(),
    authSubject: z.string().min(1).max(320),
  }),
  project: z.object({
    id: ProjectIdSchema,
    name: z.string().min(1).max(160),
    description: z.string().nullable(),
    status: z.enum(["active", "archived"]),
    createdAt: IsoTimestampSchema,
    updatedAt: IsoTimestampSchema,
  }),
  created: z.object({
    tenant: z.boolean(),
    user: z.boolean(),
    project: z.boolean(),
    membership: z.boolean(),
  }),
});

export const GenerateDesignRequestSchema = CreateDesignInputSchema.extend({
  promptTextOverride: z.string().trim().min(1).max(8000).optional(),
});

export const GenerateDesignResponseSchema = z.object({
  generationId: GenerationIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  status: z.enum(["queued", "running"]),
  executionMode: GenerateExecutionModeEnum,
  executionSource: GenerateExecutionSourceEnum,
  pairStandardVersion: z.literal(PairStandardVersion),
  createdAt: IsoTimestampSchema,
});

export const PairPublicSchema = z.object({
  pairId: PairIdSchema,
  selectionState: SelectionStateEnum,
  sketch: ArtifactPublicSchema.extend({
    kind: z.literal("pair_sketch_png"),
  }),
  render: ArtifactPublicSchema.extend({
    kind: z.literal("pair_render_png"),
  }),
});

export const DesignSummarySchema = z.object({
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  parentDesignId: DesignIdSchema.nullable(),
  sourceKind: DesignSourceKindEnum,
  sourceGenerationId: GenerationIdSchema.nullable(),
  displayName: z.string(),
  promptSummary: z.string(),
  designDna: DesignDnaSchema,
  selectionState: SelectionStateEnum,
  latestPairId: PairIdSchema.nullable(),
  pair: PairPublicSchema.nullable(),
  latestSpecId: SpecIdSchema.nullable(),
  latestTechnicalSheetId: TechSheetIdSchema.nullable(),
  latestSvgAssetId: SvgAssetIdSchema.nullable(),
  latestCadJobId: CadJobIdSchema.nullable(),
  stageStatuses: StageStatusesSchema,
  createdAt: IsoTimestampSchema,
  selectedAt: IsoTimestampSchema.nullable(),
  updatedAt: IsoTimestampSchema,
  archivedAt: IsoTimestampSchema.nullable(),
});

export const GenerationErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const GenerationStatusResponseSchema = z.object({
  generationId: GenerationIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  requestKind: RequestKindEnum,
  status: GenerationStatusEnum,
  executionMode: GenerateExecutionModeEnum,
  executionSource: GenerateExecutionSourceEnum,
  pairStandardVersion: z.literal(PairStandardVersion),
  createdAt: IsoTimestampSchema,
  startedAt: IsoTimestampSchema.nullable(),
  completedAt: IsoTimestampSchema.nullable(),
  error: GenerationErrorSchema.nullable(),
  pair: PairPublicSchema.nullable(),
  projectSelectedDesignId: DesignIdSchema.nullable(),
  canSelect: z.boolean(),
  design: DesignSummarySchema,
});

export const DesignGenerationSummarySchema = z.object({
  generationId: GenerationIdSchema,
  requestKind: RequestKindEnum,
  status: GenerationStatusEnum,
  executionMode: GenerateExecutionModeEnum,
  executionSource: GenerateExecutionSourceEnum,
  pairStandardVersion: z.literal(PairStandardVersion),
  createdAt: IsoTimestampSchema,
  startedAt: IsoTimestampSchema.nullable(),
  completedAt: IsoTimestampSchema.nullable(),
  error: GenerationErrorSchema.nullable(),
});

export const ProjectDesignsResponseSchema = z.object({
  projectId: ProjectIdSchema,
  selectedDesignId: DesignIdSchema.nullable(),
  total: z.number().int().nonnegative(),
  items: z.array(z.object(DesignSummarySchema.shape)),
});

export const DesignDetailResponseSchema = z.object({
  projectId: ProjectIdSchema,
  selectedDesignId: DesignIdSchema.nullable(),
  canSelect: z.boolean(),
  design: z.object(DesignSummarySchema.shape),
  latestSpec: SpecAgentOutputSchema.nullable(),
  latestTechSheet: TechSheetAgentOutputSchema.nullable(),
  recentGenerations: z.array(DesignGenerationSummarySchema),
});

export const DesignSelectResponseSchema = z.object({
  projectId: ProjectIdSchema,
  selectedDesignId: DesignIdSchema.nullable(),
  previousSelectedDesignId: DesignIdSchema.nullable(),
  selectionChanged: z.boolean(),
  canSelect: z.boolean(),
  design: z.object(DesignSummarySchema.shape),
  latestSpec: SpecAgentOutputSchema.nullable(),
  recentGenerations: z.array(DesignGenerationSummarySchema),
});

export const RefineRequestSchema = z.object({
  instruction: z.string().trim().min(1).max(1200),
  preset: RefinePresetEnum.optional(),
  preserve: z.array(RefinePreserveEnum).default([]),
  pairStandardVersion: z.literal(PairStandardVersion).default(PairStandardVersion),
});

export const RefineResponseSchema = z.object({
  generationId: GenerationIdSchema,
  sourceDesignId: DesignIdSchema,
  refinedDesignId: DesignIdSchema,
  status: z.enum(["queued", "running"]),
  createdAt: IsoTimestampSchema,
});

export const WorkflowStageResponseSchema = z.object({
  workflowRunId: WorkflowRunIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  selectionState: SelectionStateEnum,
  requestedTargetStage: WorkflowTargetStageEnum,
  currentStage: WorkflowCurrentStageEnum,
  workflowStatus: WorkflowStatusEnum,
  stageStatuses: StageStatusesSchema,
  latestSpecId: SpecIdSchema.nullable(),
  latestTechnicalSheetId: TechSheetIdSchema.nullable(),
  latestSvgAssetId: SvgAssetIdSchema.nullable(),
  latestCadJobId: CadJobIdSchema.nullable(),
  updatedAt: IsoTimestampSchema,
});

export const SizeContextSchema = z.object({
  ringSizeUs: z.string().trim().max(12).optional(),
  braceletLengthMm: z.number().positive().max(400).optional(),
  necklaceLengthMm: z.number().positive().max(1200).optional(),
});

export const SpecRequestSchema = z.object({
  manufacturingIntent: ManufacturingIntentEnum.default("prototype"),
  sizeContext: SizeContextSchema.optional(),
  forceRegenerate: z.boolean().default(false),
});

export const TechnicalSheetRequestSchema = z.object({
  includePdf: z.boolean().default(true),
  forceRegenerate: z.boolean().default(false),
});

export const SvgRequestSchema = z.object({
  views: z.array(SvgViewEnum).min(1).default(["front", "side", "top"]),
  includeAnnotations: z.boolean().default(true),
  forceRegenerate: z.boolean().default(false),
});

export const CadRequestSchema = z.object({
  formats: z.array(CadFormatEnum).min(1),
  includeQaReport: z.boolean().default(true),
  forceRegenerate: z.boolean().default(false),
});

export const GallerySearchRequestSchema = z.object({
  projectId: ProjectIdSchema.optional(),
  query: z.string().trim().max(200).default(""),
  filters: z
    .object({
      jewelryTypes: z.array(CreateDesignInputSchema.shape.jewelryType).optional(),
      metals: z.array(CreateDesignInputSchema.shape.metal).optional(),
      styles: z.array(CreateDesignInputSchema.shape.style).optional(),
      selectionStates: z.array(SelectionStateEnum).optional(),
      readiness: z.array(ReadinessEnum).optional(),
    })
    .default({}),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(24),
  sort: z.enum(["newest", "updated", "selected"]).default("newest"),
});

export const GallerySearchResponseSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      designId: DesignIdSchema,
      projectId: ProjectIdSchema,
      displayName: z.string(),
      promptSummary: z.string(),
      selectionState: SelectionStateEnum,
      latestPairId: PairIdSchema.nullable(),
      sketchImage: ArtifactPublicSchema.nullable(),
      coverImage: ArtifactPublicSchema.nullable(),
      stageStatuses: StageStatusesSchema,
      updatedAt: IsoTimestampSchema,
    }),
  ),
});

export const ProjectResponseSchema = z.object({
  project: z.object({
    id: ProjectIdSchema,
    tenantId: TenantIdSchema,
    name: z.string().min(1).max(160),
    description: z.string().nullable(),
    status: z.enum(["active", "archived"]),
    selectedDesignId: DesignIdSchema.nullable(),
    designCount: z.number().int().nonnegative(),
    createdAt: IsoTimestampSchema,
    updatedAt: IsoTimestampSchema,
  }),
  selectedDesign: z
    .object(DesignSummarySchema.shape)
    .nullable(),
  recentDesigns: z.array(
    z.object({
      designId: DesignIdSchema,
      displayName: z.string(),
      selectionState: SelectionStateEnum,
      updatedAt: IsoTimestampSchema,
    }),
  ),
  recentGenerations: z.array(
    z.object({
      generationId: GenerationIdSchema,
      designId: DesignIdSchema,
      status: GenerationStatusEnum,
      createdAt: IsoTimestampSchema,
    }),
  ),
});

export type PromptPreviewRequest = z.infer<typeof PromptPreviewRequestSchema>;
export type PromptPreviewResponse = z.infer<typeof PromptPreviewResponseSchema>;
export type DevBootstrapRequest = z.infer<typeof DevBootstrapRequestSchema>;
export type DevBootstrapResponse = z.infer<typeof DevBootstrapResponseSchema>;
export type GenerateDesignRequest = z.infer<typeof GenerateDesignRequestSchema>;
export type GenerateDesignResponse = z.infer<typeof GenerateDesignResponseSchema>;
export type PairPublic = z.infer<typeof PairPublicSchema>;
export type DesignSummary = z.infer<typeof DesignSummarySchema>;
export type GenerationError = z.infer<typeof GenerationErrorSchema>;
export type GenerationStatusResponse = z.infer<typeof GenerationStatusResponseSchema>;
export type DesignGenerationSummary = z.infer<typeof DesignGenerationSummarySchema>;
export type ProjectDesignsResponse = z.infer<typeof ProjectDesignsResponseSchema>;
export type DesignDetailResponse = z.infer<typeof DesignDetailResponseSchema>;
export type DesignSelectResponse = z.infer<typeof DesignSelectResponseSchema>;
export type RefineRequest = z.infer<typeof RefineRequestSchema>;
export type RefineResponse = z.infer<typeof RefineResponseSchema>;
export type WorkflowStageResponse = z.infer<typeof WorkflowStageResponseSchema>;
export type SizeContext = z.infer<typeof SizeContextSchema>;
export type SpecRequest = z.infer<typeof SpecRequestSchema>;
export type TechnicalSheetRequest = z.infer<typeof TechnicalSheetRequestSchema>;
export type SvgRequest = z.infer<typeof SvgRequestSchema>;
export type CadRequest = z.infer<typeof CadRequestSchema>;
export type GallerySearchRequest = z.infer<typeof GallerySearchRequestSchema>;
export type GallerySearchResponse = z.infer<typeof GallerySearchResponseSchema>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

export {
  PairStandardVersion,
  PromptPreviewVersion,
  SpecStandardVersion,
  SvgStandardVersion,
  TechStandardVersion,
};
