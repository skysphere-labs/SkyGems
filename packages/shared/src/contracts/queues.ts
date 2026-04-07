import { z } from "zod";

import {
  CadFormatEnum,
  ManufacturingIntentEnum,
  RefinePresetEnum,
  RefinePreserveEnum,
  WorkflowTargetStageEnum,
} from "./enums.ts";
import {
  DesignIdSchema,
  GenerationIdSchema,
  PairIdSchema,
  ProjectIdSchema,
  TenantIdSchema,
  UserIdSchema,
  WorkflowRunIdSchema,
} from "./ids.ts";
import { CreateDesignInputSchema, IsoTimestampSchema, Sha256Schema } from "./primitives.ts";
import { SizeContextSchema } from "./api.ts";

export const GenerateQueuePayloadSchema = z.object({
  schemaVersion: z.literal("generate_queue.v1"),
  generationId: GenerationIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  tenantId: TenantIdSchema,
  requestedByUserId: UserIdSchema,
  idempotencyKey: z.string().min(8).max(128),
  requestHash: Sha256Schema,
  queuedAt: IsoTimestampSchema,
  input: CreateDesignInputSchema.omit({ projectId: true }),
  promptTextOverride: z.string().max(8000).optional(),
});

export const RefineQueuePayloadSchema = z.object({
  schemaVersion: z.literal("refine_queue.v1"),
  generationId: GenerationIdSchema,
  baseDesignId: DesignIdSchema,
  refinedDesignId: DesignIdSchema,
  projectId: ProjectIdSchema,
  tenantId: TenantIdSchema,
  requestedByUserId: UserIdSchema,
  idempotencyKey: z.string().min(8).max(128),
  requestHash: Sha256Schema,
  queuedAt: IsoTimestampSchema,
  instruction: z.string().min(1).max(1200),
  preset: RefinePresetEnum.optional(),
  preserve: z.array(RefinePreserveEnum),
});

export const SpecQueuePayloadSchema = z.object({
  schemaVersion: z.literal("spec_queue.v1"),
  workflowRunId: WorkflowRunIdSchema,
  designId: DesignIdSchema,
  projectId: ProjectIdSchema,
  tenantId: TenantIdSchema,
  requestedByUserId: UserIdSchema,
  pairId: PairIdSchema,
  targetStage: WorkflowTargetStageEnum,
  idempotencyKey: z.string().min(8).max(128),
  requestHash: Sha256Schema,
  queuedAt: IsoTimestampSchema,
  manufacturingIntent: ManufacturingIntentEnum,
  sizeContext: SizeContextSchema.optional(),
  forceRegenerate: z.boolean(),
});

export type GenerateQueuePayload = z.infer<typeof GenerateQueuePayloadSchema>;
export type RefineQueuePayload = z.infer<typeof RefineQueuePayloadSchema>;
export type SpecQueuePayload = z.infer<typeof SpecQueuePayloadSchema>;
