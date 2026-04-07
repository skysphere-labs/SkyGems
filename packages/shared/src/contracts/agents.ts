import { z } from "zod";

import {
  CadBlockerCodeEnum,
  CadCleanupOperationEnum,
  CadFormatEnum,
  CadQaCheckEnum,
  GemstoneEnum,
  GemstoneRoleEnum,
  JewelryTypeEnum,
  ManufacturingMethodEnum,
  MeasuredValueSourceEnum,
  MeasuredValueUnitEnum,
  MetalEnum,
  RiskFlagCodeEnum,
  RiskSeverityEnum,
  StyleEnum,
} from "./enums.ts";
import {
  DesignIdSchema,
  PairIdSchema,
  ProjectIdSchema,
  SpecIdSchema,
  SvgAssetIdSchema,
  TechSheetIdSchema,
} from "./ids.ts";
import {
  CreateDesignInputSchema,
  DesignDnaSchema,
  PairStandardVersion,
  PromptAgentSchemaVersion,
  PromptBundleSchema,
  Sha256Schema,
  SpecStandardVersion,
} from "./primitives.ts";

export const MeasuredValueSchema = z.object({
  value: z.number().positive().nullable(),
  unit: MeasuredValueUnitEnum,
  source: MeasuredValueSourceEnum,
  confidence: z.number().min(0).max(1),
});

export const PromptAgentOutputSchema = z.object({
  schemaVersion: z.literal(PromptAgentSchemaVersion),
  mode: z.enum(["generate", "refine"]),
  projectId: ProjectIdSchema,
  designId: DesignIdSchema,
  sourceDesignId: DesignIdSchema.optional(),
  pairStandardVersion: z.literal(PairStandardVersion),
  normalizedInput: CreateDesignInputSchema.omit({ projectId: true }).extend({
    refinementInstruction: z.string().trim().max(1200).optional(),
  }),
  designDna: DesignDnaSchema,
  promptBundle: PromptBundleSchema,
  blocked: z.boolean(),
  blockReasons: z.array(z.string().min(1).max(240)),
});

export const RiskFlagSchema = z.object({
  code: RiskFlagCodeEnum,
  severity: RiskSeverityEnum,
  message: z.string().min(1).max(240),
});

export const SpecAgentOutputSchema = z.object({
  schemaVersion: z.literal("spec_agent.v1"),
  designId: DesignIdSchema,
  pairId: PairIdSchema,
  specStandardVersion: z.literal(SpecStandardVersion),
  summary: z.string().min(1).max(500),
  jewelryType: JewelryTypeEnum,
  materials: z.object({
    metal: MetalEnum,
    finish: z.string().trim().max(120).nullable(),
    gemstones: z.array(
      z.object({
        role: GemstoneRoleEnum,
        stoneType: z.union([GemstoneEnum, z.string().min(1).max(80)]),
        shape: z.string().trim().max(80).nullable(),
        quantity: z.number().int().positive().nullable(),
        size: MeasuredValueSchema.nullable(),
        carat: MeasuredValueSchema.nullable(),
      }),
    ),
  }),
  dimensions: z.object({
    overallLength: MeasuredValueSchema.nullable(),
    overallWidth: MeasuredValueSchema.nullable(),
    overallHeight: MeasuredValueSchema.nullable(),
    bandWidth: MeasuredValueSchema.nullable(),
    bandThickness: MeasuredValueSchema.nullable(),
  }),
  construction: z.object({
    settingType: z.string().trim().max(120).nullable(),
    profile: z.string().trim().max(120).nullable(),
    manufacturingMethod: ManufacturingMethodEnum,
    assemblyNotes: z.array(z.string().min(1).max(240)),
  }),
  riskFlags: z.array(RiskFlagSchema),
  unknowns: z.array(z.string().min(1).max(240)),
  humanReviewRequired: z.boolean(),
});

export const CadPrepAgentOutputSchema = z.object({
  schemaVersion: z.literal("cad_prep_agent.v1"),
  designId: DesignIdSchema,
  specId: SpecIdSchema,
  technicalSheetId: TechSheetIdSchema,
  svgAssetId: SvgAssetIdSchema,
  requestedFormats: z.array(CadFormatEnum).min(1),
  modelingPlan: z.object({
    cleanupOperations: z.array(CadCleanupOperationEnum),
    modelingSteps: z.array(z.string().min(1).max(240)).min(1).max(20),
    qaChecks: z.array(CadQaCheckEnum),
  }),
  blockers: z.array(
    z.object({
      code: CadBlockerCodeEnum,
      message: z.string().min(1).max(240),
      blocking: z.boolean(),
    }),
  ),
  requiresHumanReview: z.boolean(),
});

export type MeasuredValue = z.infer<typeof MeasuredValueSchema>;
export type PromptAgentOutput = z.infer<typeof PromptAgentOutputSchema>;
export type RiskFlag = z.infer<typeof RiskFlagSchema>;
export type SpecAgentOutput = z.infer<typeof SpecAgentOutputSchema>;
export type CadPrepAgentOutput = z.infer<typeof CadPrepAgentOutputSchema>;
