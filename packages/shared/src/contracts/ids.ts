import { z } from "zod";

import { generateUlid } from "../lib/crypto.ts";

export const ULID_PART_PATTERN = "[0-9A-HJKMNP-TV-Z]{26}";

export type KnownIdPrefix =
  | "ten"
  | "usr"
  | "prj"
  | "dsn"
  | "gen"
  | "pair"
  | "spc"
  | "tch"
  | "svg"
  | "cad"
  | "art"
  | "wfr"
  | "idm";

export function prefixedIdSchema(prefix: KnownIdPrefix) {
  return z.string().regex(new RegExp(`^${prefix}_${ULID_PART_PATTERN}$`));
}

export const TenantIdSchema = prefixedIdSchema("ten");
export const UserIdSchema = prefixedIdSchema("usr");
export const ProjectIdSchema = prefixedIdSchema("prj");
export const DesignIdSchema = prefixedIdSchema("dsn");
export const GenerationIdSchema = prefixedIdSchema("gen");
export const PairIdSchema = prefixedIdSchema("pair");
export const SpecIdSchema = prefixedIdSchema("spc");
export const TechSheetIdSchema = prefixedIdSchema("tch");
export const SvgAssetIdSchema = prefixedIdSchema("svg");
export const CadJobIdSchema = prefixedIdSchema("cad");
export const ArtifactIdSchema = prefixedIdSchema("art");
export const WorkflowRunIdSchema = prefixedIdSchema("wfr");
export const IdempotencyRecordIdSchema = prefixedIdSchema("idm");

export type TenantId = z.infer<typeof TenantIdSchema>;
export type UserId = z.infer<typeof UserIdSchema>;
export type ProjectId = z.infer<typeof ProjectIdSchema>;
export type DesignId = z.infer<typeof DesignIdSchema>;
export type GenerationId = z.infer<typeof GenerationIdSchema>;
export type PairId = z.infer<typeof PairIdSchema>;
export type SpecId = z.infer<typeof SpecIdSchema>;
export type TechSheetId = z.infer<typeof TechSheetIdSchema>;
export type SvgAssetId = z.infer<typeof SvgAssetIdSchema>;
export type CadJobId = z.infer<typeof CadJobIdSchema>;
export type ArtifactId = z.infer<typeof ArtifactIdSchema>;
export type WorkflowRunId = z.infer<typeof WorkflowRunIdSchema>;
export type IdempotencyRecordId = z.infer<typeof IdempotencyRecordIdSchema>;

export function generatePrefixedId(prefix: KnownIdPrefix, now = Date.now()): string {
  return `${prefix}_${generateUlid(now)}`;
}

export function isPrefixedId(value: string, prefix: KnownIdPrefix): boolean {
  return prefixedIdSchema(prefix).safeParse(value).success;
}
