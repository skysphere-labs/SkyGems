import { z } from "zod";

import {
  ArtifactKindEnum,
  ErrorCodeEnum,
  GemstoneEnum,
  JewelryTypeEnum,
  MetalEnum,
  StepStatusEnum,
  StyleEnum,
} from "./enums.ts";
import { ArtifactIdSchema, ProjectIdSchema } from "./ids.ts";

export const PairStandardVersion = "pair_v1" as const;
export const PromptPreviewVersion = "prompt_preview.v1" as const;
export const PromptAgentSchemaVersion = "prompt_agent.v1" as const;
export const SpecStandardVersion = "spec_v1" as const;
export const TechStandardVersion = "tech_v1" as const;
export const SvgStandardVersion = "svg_v1" as const;

export const IsoTimestampSchema = z.string().datetime({ offset: true });
export const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const VariationOverrideSchema = z.object({
  bandStyle: z.string().trim().min(1).max(120).optional(),
  settingType: z.string().trim().min(1).max(120).optional(),
  stonePosition: z.string().trim().min(1).max(120).optional(),
  profile: z.string().trim().min(1).max(120).optional(),
  motif: z.string().trim().min(1).max(120).optional(),
  viewId: z.string().trim().min(1).max(80).optional(),
});

export const CreateDesignInputSchema = z.object({
  projectId: ProjectIdSchema,
  jewelryType: JewelryTypeEnum,
  metal: MetalEnum,
  gemstones: z.array(GemstoneEnum).max(5),
  style: StyleEnum,
  complexity: z.number().int().min(0).max(100),
  variationOverrides: VariationOverrideSchema.optional(),
  userNotes: z.string().trim().max(1200).optional(),
  pairStandardVersion: z.literal(PairStandardVersion).default(PairStandardVersion),
});

export const DesignDnaSchema = z.object({
  jewelryType: JewelryTypeEnum,
  metal: MetalEnum,
  gemstones: z.array(GemstoneEnum),
  style: StyleEnum,
  complexity: z.number().int().min(0).max(100),
  bandStyle: z.string().min(1).max(120),
  settingType: z.string().min(1).max(120),
  stonePosition: z.string().min(1).max(120),
  profile: z.string().min(1).max(120),
  motif: z.string().min(1).max(120),
  fingerprintSha256: Sha256Schema,
});

export const DesignDnaPreviewSchema = DesignDnaSchema.omit({
  fingerprintSha256: true,
});

export const PromptBundleSchema = z.object({
  sketchPrompt: z.string().min(1).max(8000),
  renderPrompt: z.string().min(1).max(8000),
  negativePrompt: z.string().max(4000).default(""),
});

export const ArtifactPublicSchema = z.object({
  artifactId: ArtifactIdSchema,
  kind: ArtifactKindEnum,
  contentType: z.string().min(1),
  byteSize: z.number().int().nonnegative(),
  sha256: Sha256Schema,
  signedUrl: z.string().url(),
});

export const StageStatusesSchema = z.object({
  spec: StepStatusEnum,
  technicalSheet: StepStatusEnum,
  svg: StepStatusEnum,
  cad: StepStatusEnum,
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeEnum,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type VariationOverride = z.infer<typeof VariationOverrideSchema>;
export type CreateDesignInput = z.infer<typeof CreateDesignInputSchema>;
export type DesignDna = z.infer<typeof DesignDnaSchema>;
export type DesignDnaPreview = z.infer<typeof DesignDnaPreviewSchema>;
export type PromptBundle = z.infer<typeof PromptBundleSchema>;
export type ArtifactPublic = z.infer<typeof ArtifactPublicSchema>;
export type StageStatuses = z.infer<typeof StageStatusesSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
