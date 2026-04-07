import { generatePrefixedId, sha256Hex, stableStringify } from "@skygems/shared";

import { executeStatement, hoursFromNowIso, nowIso, queryFirst } from "./d1.ts";
import { HttpError } from "./http.ts";

interface IdempotencyRecordRow {
  request_hash: string;
  response_status_code: number;
  response_json: string;
}

export interface IdempotentExecution<T> {
  status: number;
  body: T;
  primaryResourceType: string;
  primaryResourceId: string;
}

export function requireIdempotencyKey(request: Request): string {
  const key = request.headers.get("Idempotency-Key")?.trim();
  if (!key) {
    throw new HttpError(400, "invalid_request", "Idempotency-Key header is required.");
  }

  if (key.length < 8 || key.length > 128) {
    throw new HttpError(
      400,
      "invalid_request",
      "Idempotency-Key must be between 8 and 128 characters.",
    );
  }

  return key;
}

export async function computeRequestHash(
  body: unknown,
  pathParams: Record<string, string>,
  tenantId: string,
): Promise<string> {
  return sha256Hex(
    stableStringify({
      body,
      pathParams,
      tenantId,
    }),
  );
}

export async function withIdempotency<T>(
  db: D1Database,
  tenantId: string,
  endpointName: string,
  idempotencyKey: string,
  requestHash: string,
  execute: () => Promise<IdempotentExecution<T>>,
): Promise<IdempotentExecution<T>> {
  const existing = await queryFirst<IdempotencyRecordRow>(
    db,
    `SELECT request_hash, response_status_code, response_json
     FROM idempotency_records
     WHERE tenant_id = ? AND endpoint_name = ? AND idempotency_key = ?`,
    [tenantId, endpointName, idempotencyKey],
  );

  if (existing) {
    if (existing.request_hash !== requestHash) {
      throw new HttpError(
        409,
        "idempotency_conflict",
        "Idempotency-Key was already used with a different request payload.",
      );
    }

    return {
      status: existing.response_status_code,
      body: JSON.parse(existing.response_json) as T,
      primaryResourceType: "replay",
      primaryResourceId: "replay",
    };
  }

  const result = await execute();

  await executeStatement(
    db,
    `INSERT INTO idempotency_records (
       id,
       tenant_id,
       endpoint_name,
       idempotency_key,
       request_hash,
       response_status_code,
       response_json,
       primary_resource_type,
       primary_resource_id,
       created_at,
       expires_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generatePrefixedId("idm"),
      tenantId,
      endpointName,
      idempotencyKey,
      requestHash,
      result.status,
      stableStringify(result.body),
      result.primaryResourceType,
      result.primaryResourceId,
      nowIso(),
      hoursFromNowIso(72),
    ],
  );

  return result;
}
