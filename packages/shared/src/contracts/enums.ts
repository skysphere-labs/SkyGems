import { z } from "zod";

export const jewelryTypeValues = ["ring", "necklace", "earrings", "bracelet", "pendant"] as const;
export const metalValues = ["gold", "silver", "platinum", "rose-gold"] as const;
export const gemstoneValues = ["diamond", "ruby", "emerald", "sapphire", "pearl"] as const;
export const styleValues = [
  "contemporary",
  "minimalist",
  "vintage",
  "temple",
  "floral",
  "geometric",
] as const;

export const generationStatusValues = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled",
] as const;
export const generateExecutionModeValues = ["queue", "local"] as const;
export const generateExecutionSourceValues = [
  "configured_queue",
  "configured_local",
  "default_auto",
  "local_development",
  "queue_send_failed_fallback",
] as const;
export const selectionStateValues = ["candidate", "selected", "superseded", "archived"] as const;
export const workflowTargetStageValues = ["spec", "technical_sheet", "svg", "cad"] as const;
export const workflowStatusValues = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled",
] as const;
export const stepStatusValues = [
  "not_requested",
  "queued",
  "running",
  "succeeded",
  "failed",
  "skipped",
] as const;
export const workflowCurrentStageValues = [
  "none",
  "spec",
  "technical_sheet",
  "svg",
  "cad",
  "complete",
] as const;
export const artifactKindValues = [
  "pair_sketch_png",
  "pair_render_png",
  "tech_sheet_json",
  "tech_sheet_pdf",
  "svg_front",
  "svg_side",
  "svg_top",
  "svg_annotations_json",
  "cad_step",
  "cad_dxf",
  "cad_stl",
  "cad_package_zip",
  "cad_qa_report_json",
] as const;
export const errorCodeValues = [
  "unauthorized",
  "forbidden",
  "invalid_request",
  "not_found",
  "conflict",
  "idempotency_conflict",
  "agent_validation_failed",
  "provider_failure",
  "storage_failure",
  "workflow_failed",
] as const;
export const projectStatusValues = ["active", "archived"] as const;
export const planTierValues = ["free", "pro", "enterprise"] as const;
export const membershipRoleValues = ["owner", "editor", "viewer"] as const;
export const designSourceKindValues = ["create", "refine"] as const;
export const requestKindValues = ["create", "refine"] as const;
export const artifactProducerTypeValues = [
  "generation_pair",
  "technical_sheet",
  "svg",
  "cad",
] as const;
export const refinePresetValues = [
  "polish",
  "explore",
  "simplify",
  "luxury",
  "manufacturable",
  "swap_material",
  "swap_gemstone",
  "change_angle",
  "change_background",
  "adjust_scale",
  "add_inscription",
  "erase_oddities",
  "swap_findings",
  "pair_gems",
  "upscale",
  "relight",
  "add_texture",
] as const;
export const refinePreserveValues = ["metal", "gemstones", "style", "silhouette"] as const;
export const manufacturingIntentValues = [
  "concept",
  "prototype",
  "production_ready",
] as const;
export const svgViewValues = ["front", "side", "top"] as const;
export const cadFormatValues = ["step", "dxf", "stl"] as const;
export const readinessValues = [
  "pair_ready",
  "spec_ready",
  "technical_sheet_ready",
  "svg_ready",
  "cad_ready",
] as const;
export const measuredValueUnitValues = ["mm", "g", "ct"] as const;
export const measuredValueSourceValues = [
  "user_input",
  "pair_inference",
  "rule",
  "unknown",
] as const;
export const riskSeverityValues = ["low", "medium", "high"] as const;
export const riskFlagCodeValues = [
  "thin_structure",
  "unsupported_span",
  "unclear_dimensions",
  "stone_setting_risk",
  "manufacturing_ambiguity",
] as const;
export const manufacturingMethodValues = ["cast", "fabricated", "hybrid", "unknown"] as const;
export const gemstoneRoleValues = ["primary", "accent"] as const;
export const cadCleanupOperationValues = [
  "normalize_units",
  "close_open_paths",
  "flatten_transforms",
  "dedupe_nodes",
  "resolve_self_intersections",
  "label_views",
] as const;
export const cadQaCheckValues = [
  "closed_paths",
  "consistent_units",
  "nonzero_thickness",
  "manifold_geometry",
  "gem_seat_clearance",
  "export_roundtrip",
] as const;
export const cadBlockerCodeValues = [
  "missing_dimensions",
  "ambiguous_profile",
  "svg_invalid",
  "unsupported_geometry",
] as const;
export const renderModeValues = ["sketch", "render", "product"] as const;

export const JewelryTypeEnum = z.enum(jewelryTypeValues);
export const MetalEnum = z.enum(metalValues);
export const GemstoneEnum = z.enum(gemstoneValues);
export const StyleEnum = z.enum(styleValues);
export const GenerationStatusEnum = z.enum(generationStatusValues);
export const GenerateExecutionModeEnum = z.enum(generateExecutionModeValues);
export const GenerateExecutionSourceEnum = z.enum(generateExecutionSourceValues);
export const SelectionStateEnum = z.enum(selectionStateValues);
export const WorkflowTargetStageEnum = z.enum(workflowTargetStageValues);
export const WorkflowStatusEnum = z.enum(workflowStatusValues);
export const StepStatusEnum = z.enum(stepStatusValues);
export const WorkflowCurrentStageEnum = z.enum(workflowCurrentStageValues);
export const ArtifactKindEnum = z.enum(artifactKindValues);
export const ErrorCodeEnum = z.enum(errorCodeValues);
export const ProjectStatusEnum = z.enum(projectStatusValues);
export const PlanTierEnum = z.enum(planTierValues);
export const MembershipRoleEnum = z.enum(membershipRoleValues);
export const DesignSourceKindEnum = z.enum(designSourceKindValues);
export const RequestKindEnum = z.enum(requestKindValues);
export const ArtifactProducerTypeEnum = z.enum(artifactProducerTypeValues);
export const RefinePresetEnum = z.enum(refinePresetValues);
export const RefinePreserveEnum = z.enum(refinePreserveValues);
export const ManufacturingIntentEnum = z.enum(manufacturingIntentValues);
export const SvgViewEnum = z.enum(svgViewValues);
export const CadFormatEnum = z.enum(cadFormatValues);
export const ReadinessEnum = z.enum(readinessValues);
export const MeasuredValueUnitEnum = z.enum(measuredValueUnitValues);
export const MeasuredValueSourceEnum = z.enum(measuredValueSourceValues);
export const RiskSeverityEnum = z.enum(riskSeverityValues);
export const RiskFlagCodeEnum = z.enum(riskFlagCodeValues);
export const ManufacturingMethodEnum = z.enum(manufacturingMethodValues);
export const GemstoneRoleEnum = z.enum(gemstoneRoleValues);
export const CadCleanupOperationEnum = z.enum(cadCleanupOperationValues);
export const CadQaCheckEnum = z.enum(cadQaCheckValues);
export const CadBlockerCodeEnum = z.enum(cadBlockerCodeValues);
export const RenderModeEnum = z.enum(renderModeValues);

export type JewelryType = z.infer<typeof JewelryTypeEnum>;
export type Metal = z.infer<typeof MetalEnum>;
export type Gemstone = z.infer<typeof GemstoneEnum>;
export type Style = z.infer<typeof StyleEnum>;
export type GenerationStatus = z.infer<typeof GenerationStatusEnum>;
export type GenerateExecutionMode = z.infer<typeof GenerateExecutionModeEnum>;
export type GenerateExecutionSource = z.infer<typeof GenerateExecutionSourceEnum>;
export type SelectionState = z.infer<typeof SelectionStateEnum>;
export type WorkflowTargetStage = z.infer<typeof WorkflowTargetStageEnum>;
export type WorkflowStatus = z.infer<typeof WorkflowStatusEnum>;
export type StepStatus = z.infer<typeof StepStatusEnum>;
export type WorkflowCurrentStage = z.infer<typeof WorkflowCurrentStageEnum>;
export type ArtifactKind = z.infer<typeof ArtifactKindEnum>;
export type ErrorCode = z.infer<typeof ErrorCodeEnum>;
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;
export type PlanTier = z.infer<typeof PlanTierEnum>;
export type MembershipRole = z.infer<typeof MembershipRoleEnum>;
export type DesignSourceKind = z.infer<typeof DesignSourceKindEnum>;
export type RequestKind = z.infer<typeof RequestKindEnum>;
export type ArtifactProducerType = z.infer<typeof ArtifactProducerTypeEnum>;
export type RefinePreset = z.infer<typeof RefinePresetEnum>;
export type RefinePreserve = z.infer<typeof RefinePreserveEnum>;
export type ManufacturingIntent = z.infer<typeof ManufacturingIntentEnum>;
export type SvgView = z.infer<typeof SvgViewEnum>;
export type CadFormat = z.infer<typeof CadFormatEnum>;
export type Readiness = z.infer<typeof ReadinessEnum>;
export type MeasuredValueUnit = z.infer<typeof MeasuredValueUnitEnum>;
export type MeasuredValueSource = z.infer<typeof MeasuredValueSourceEnum>;
export type RiskSeverity = z.infer<typeof RiskSeverityEnum>;
export type RiskFlagCode = z.infer<typeof RiskFlagCodeEnum>;
export type ManufacturingMethod = z.infer<typeof ManufacturingMethodEnum>;
export type GemstoneRole = z.infer<typeof GemstoneRoleEnum>;
export type CadCleanupOperation = z.infer<typeof CadCleanupOperationEnum>;
export type CadQaCheck = z.infer<typeof CadQaCheckEnum>;
export type CadBlockerCode = z.infer<typeof CadBlockerCodeEnum>;
export type RenderMode = z.infer<typeof RenderModeEnum>;
