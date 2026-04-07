import { generatePrefixedId } from "@skygems/shared";

import { executeStatement, hoursFromNowIso, nowIso, queryFirst } from "./d1.ts";
import { HttpError } from "./http.ts";
import {
  isLocalDevelopmentRequest,
  resolveAuth0Issuer,
  resolveClaimsNamespace,
  type ApiEnv,
} from "./runtime.ts";

export interface AuthIdentity {
  authMode: "auth0" | "dev_bootstrap";
  tenantId?: string;
  tenantName: string;
  tenantSlug: string;
  userId?: string;
  authSubject: string;
  email: string;
  displayName: string | null;
  role: "owner" | "editor" | "viewer";
  permissions: string[];
}

export interface AuthContext extends AuthIdentity {
  tenantId: string;
  userId: string;
}

export interface EnsuredAuthContextResult {
  auth: AuthContext;
  createdTenant: boolean;
  createdUser: boolean;
}

interface TenantRow {
  id: string;
}

interface UserRow {
  id: string;
}

interface JwtHeader {
  alg: string;
  typ?: string;
  kid?: string;
}

interface JwtPayload {
  sub: string;
  iss: string;
  aud: string | string[];
  exp?: number;
  iat?: number;
  nbf?: number;
  email?: string;
  name?: string;
  org_name?: string;
  [key: string]: unknown;
}

interface DevSessionPayload {
  kind: "skygems.dev_session.v2";
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  userId: string;
  authSubject: string;
  email: string;
  displayName: string | null;
  role: "owner" | "editor" | "viewer";
  permissions: string[];
  iat: number;
  exp: number;
}

interface ArtifactAccessTokenPayload {
  kind: "skygems.artifact_access.v1";
  artifactId: string;
  tenantId: string;
  projectId: string;
  iat: number;
  exp: number;
}

interface JwksKey {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

interface JwksResponse {
  keys: JwksKey[];
}

const DEV_SESSION_KIND = "skygems.dev_session.v2" as const;
const ARTIFACT_ACCESS_KIND = "skygems.artifact_access.v1" as const;
const LOCAL_ONLY_DEV_BOOTSTRAP_SECRET = "skygems-local-dev-bootstrap";
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
const jwksCache = new Map<string, { expiresAt: number; value: JwksResponse }>();

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function base64urlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeJsonPart<T>(value: string): T {
  try {
    return JSON.parse(new TextDecoder().decode(base64urlToBytes(value))) as T;
  } catch (error) {
    throw new HttpError(401, "unauthorized", "Bearer token could not be decoded.", {
      cause: String(error),
    });
  }
}

function encodeJsonPart(value: unknown): string {
  return bytesToBase64url(new TextEncoder().encode(JSON.stringify(value)));
}

function titleizeSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function resolveDevBootstrapSecret(env: ApiEnv, allowLocalFallback: boolean): string {
  const configured = env.DEV_BOOTSTRAP_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (allowLocalFallback) {
    return LOCAL_ONLY_DEV_BOOTSTRAP_SECRET;
  }

  throw new HttpError(
    500,
    "provider_failure",
    "DEV_BOOTSTRAP_SECRET must be configured before issuing remote dev bootstrap sessions.",
  );
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signHmac(data: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToBase64url(new Uint8Array(signature));
}

async function verifyHmac(data: string, signature: string, secret: string): Promise<boolean> {
  const key = await importHmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    toArrayBuffer(base64urlToBytes(signature)),
    new TextEncoder().encode(data),
  );
}

function decodeJwtParts(token: string): { header: JwtHeader; payload: JwtPayload } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new HttpError(401, "unauthorized", "Bearer token is not a valid JWT.");
  }

  return {
    header: decodeJsonPart<JwtHeader>(parts[0]),
    payload: decodeJsonPart<JwtPayload>(parts[1]),
  };
}

async function fetchJwks(env: ApiEnv): Promise<JwksResponse> {
  const issuer = resolveAuth0Issuer(env);
  if (!issuer) {
    throw new HttpError(401, "unauthorized", "Auth0 issuer is not configured for this environment.");
  }

  const cached = jwksCache.get(issuer);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const response = await fetch(`${issuer.replace(/\/$/, "")}/.well-known/jwks.json`);
  if (!response.ok) {
    throw new HttpError(401, "unauthorized", "Unable to fetch Auth0 JWKS for token verification.", {
      status: response.status,
    });
  }

  const value = (await response.json()) as JwksResponse;
  jwksCache.set(issuer, { expiresAt: Date.now() + JWKS_CACHE_TTL_MS, value });
  return value;
}

async function importRsaVerificationKey(jwk: JwksKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

function asMembershipRole(value: unknown): "owner" | "editor" | "viewer" {
  return value === "owner" || value === "editor" || value === "viewer" ? value : "viewer";
}

async function verifyAuth0Token(token: string, env: ApiEnv): Promise<AuthIdentity> {
  const { header, payload } = decodeJwtParts(token);
  if (header.alg !== "RS256" || !header.kid) {
    throw new HttpError(401, "unauthorized", "Only RS256 Auth0 bearer tokens are supported.");
  }

  const issuer = resolveAuth0Issuer(env);
  const audience = env.SKYGEMS_AUTH0_AUDIENCE?.trim();
  if (!issuer || !audience) {
    throw new HttpError(
      401,
      "unauthorized",
      "Auth0 audience and issuer must both be configured before bearer auth is accepted.",
    );
  }

  const jwks = await fetchJwks(env);
  const jwk = jwks.keys.find((key) => key.kid === header.kid);
  if (!jwk) {
    throw new HttpError(401, "unauthorized", "No matching Auth0 signing key was found.");
  }

  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    await importRsaVerificationKey(jwk),
    toArrayBuffer(base64urlToBytes(token.split(".")[2])),
    new TextEncoder().encode(token.split(".").slice(0, 2).join(".")),
  );
  if (!verified) {
    throw new HttpError(401, "unauthorized", "Bearer token signature verification failed.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.nbf && payload.nbf > now) {
    throw new HttpError(401, "unauthorized", "Bearer token is not valid yet.");
  }
  if (payload.exp && payload.exp <= now) {
    throw new HttpError(401, "unauthorized", "Bearer token has expired.");
  }
  if (payload.iss !== issuer) {
    throw new HttpError(401, "unauthorized", "Bearer token issuer does not match configuration.");
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(audience)) {
    throw new HttpError(401, "unauthorized", "Bearer token audience does not match configuration.");
  }

  const claimsNamespace = resolveClaimsNamespace(env);
  const tenantSlug = payload[`${claimsNamespace}tenant_slug`];
  const tenantName = payload[`${claimsNamespace}tenant_name`] ?? payload.org_name;
  const permissionsClaim = payload[`${claimsNamespace}permissions`];
  if (typeof tenantSlug !== "string" || !tenantSlug.trim()) {
    throw new HttpError(401, "unauthorized", "Bearer token is missing the tenant_slug claim.");
  }

  return {
    authMode: "auth0",
    tenantSlug: tenantSlug.trim(),
    tenantName:
      typeof tenantName === "string" && tenantName.trim()
        ? tenantName.trim()
        : titleizeSlug(tenantSlug.trim()),
    authSubject: payload.sub,
    email:
      typeof payload.email === "string" && payload.email.trim()
        ? payload.email.trim().toLowerCase()
        : `${payload.sub}@auth0.local`,
    displayName: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : null,
    role: asMembershipRole(payload[`${claimsNamespace}role`]),
    permissions: Array.isArray(permissionsClaim)
      ? permissionsClaim.filter((value: unknown): value is string => typeof value === "string")
      : [],
  };
}

async function verifyDevBootstrapToken(
  token: string,
  env: ApiEnv,
  allowLocalFallback: boolean,
): Promise<AuthIdentity> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new HttpError(401, "unauthorized", "Dev bootstrap session token is malformed.");
  }

  const header = decodeJsonPart<JwtHeader>(parts[0]);
  const payload = decodeJsonPart<DevSessionPayload>(parts[1]);
  if (header.alg !== "HS256" || payload.kind !== DEV_SESSION_KIND) {
    throw new HttpError(401, "unauthorized", "Dev bootstrap session token is invalid.");
  }

  const secret = resolveDevBootstrapSecret(env, allowLocalFallback);
  const verified = await verifyHmac(`${parts[0]}.${parts[1]}`, parts[2], secret);
  if (!verified) {
    throw new HttpError(401, "unauthorized", "Dev bootstrap session signature verification failed.");
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new HttpError(401, "unauthorized", "Dev bootstrap session token has expired.");
  }

  return {
    authMode: "dev_bootstrap",
    tenantId: payload.tenantId,
    tenantName: payload.tenantName,
    tenantSlug: payload.tenantSlug,
    userId: payload.userId,
    authSubject: payload.authSubject,
    email: payload.email,
    displayName: payload.displayName,
    role: payload.role,
    permissions: payload.permissions,
  };
}

export async function resolveAuthContext(request: Request, env: ApiEnv): Promise<AuthIdentity> {
  const authorization = request.headers.get("Authorization")?.trim();
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "unauthorized", "Authorization: Bearer token required.");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new HttpError(401, "unauthorized", "Bearer token cannot be empty.");
  }

  const { payload } = decodeJwtParts(token);
  if ((payload as Partial<DevSessionPayload>).kind === DEV_SESSION_KIND) {
    return verifyDevBootstrapToken(token, env, isLocalDevelopmentRequest(request));
  }

  return verifyAuth0Token(token, env);
}

export async function ensureTenantAndUser(
  db: D1Database,
  identity: AuthIdentity,
): Promise<EnsuredAuthContextResult> {
  const timestamp = nowIso();
  const existingTenant = identity.tenantId
    ? await queryFirst<TenantRow>(db, `SELECT id FROM tenants WHERE id = ?`, [identity.tenantId])
    : await queryFirst<TenantRow>(db, `SELECT id FROM tenants WHERE slug = ?`, [identity.tenantSlug]);
  const tenantId = existingTenant?.id ?? identity.tenantId ?? generatePrefixedId("ten");

  await executeStatement(
    db,
    `INSERT INTO tenants (id, slug, name, plan_tier, created_at, updated_at)
     VALUES (?, ?, ?, 'free', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug,
       name = excluded.name,
       updated_at = excluded.updated_at`,
    [tenantId, identity.tenantSlug, identity.tenantName, timestamp, timestamp],
  );

  const existingUser = identity.userId
    ? await queryFirst<UserRow>(db, `SELECT id FROM users WHERE id = ?`, [identity.userId])
    : await queryFirst<UserRow>(db, `SELECT id FROM users WHERE auth_subject = ?`, [identity.authSubject]);
  const userId = existingUser?.id ?? identity.userId ?? generatePrefixedId("usr");

  await executeStatement(
    db,
    `INSERT INTO users (id, tenant_id, auth_subject, email, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       tenant_id = excluded.tenant_id,
       auth_subject = excluded.auth_subject,
       email = excluded.email,
       display_name = excluded.display_name,
       updated_at = excluded.updated_at`,
    [userId, tenantId, identity.authSubject, identity.email, identity.displayName, timestamp, timestamp],
  );

  return {
    auth: {
      ...identity,
      tenantId,
      userId,
    },
    createdTenant: !existingTenant,
    createdUser: !existingUser,
  };
}

export async function issueDevBootstrapSession(
  auth: AuthContext,
  env: ApiEnv,
  options: {
    allowLocalFallback?: boolean;
    ttlHours?: number;
  } = {},
): Promise<{ token: string; expiresAt: string }> {
  const allowLocalFallback = options.allowLocalFallback ?? false;
  const secret = resolveDevBootstrapSecret(env, allowLocalFallback);
  const expiresAt = hoursFromNowIso(options.ttlHours ?? 72);
  const payload: DevSessionPayload = {
    kind: DEV_SESSION_KIND,
    tenantId: auth.tenantId,
    tenantName: auth.tenantName,
    tenantSlug: auth.tenantSlug,
    userId: auth.userId,
    authSubject: auth.authSubject,
    email: auth.email,
    displayName: auth.displayName,
    role: auth.role,
    permissions: auth.permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(new Date(expiresAt).getTime() / 1000),
  };
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const encodedHeader = encodeJsonPart(header);
  const encodedPayload = encodeJsonPart(payload);
  const signature = await signHmac(`${encodedHeader}.${encodedPayload}`, secret);

  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    expiresAt,
  };
}

export async function issueArtifactAccessToken(
  params: {
    artifactId: string;
    tenantId: string;
    projectId: string;
  },
  env: ApiEnv,
  options: {
    allowLocalFallback?: boolean;
    ttlMinutes?: number;
  } = {},
): Promise<string> {
  const allowLocalFallback = options.allowLocalFallback ?? false;
  const secret = resolveDevBootstrapSecret(env, allowLocalFallback);
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ((options.ttlMinutes ?? 15) * 60);
  const payload: ArtifactAccessTokenPayload = {
    kind: ARTIFACT_ACCESS_KIND,
    artifactId: params.artifactId,
    tenantId: params.tenantId,
    projectId: params.projectId,
    iat: issuedAt,
    exp: expiresAt,
  };
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const encodedHeader = encodeJsonPart(header);
  const encodedPayload = encodeJsonPart(payload);
  const signature = await signHmac(`${encodedHeader}.${encodedPayload}`, secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function verifyArtifactAccessToken(
  token: string,
  env: ApiEnv,
  options: {
    allowLocalFallback?: boolean;
  } = {},
): Promise<ArtifactAccessTokenPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new HttpError(401, "unauthorized", "Artifact access token is malformed.");
  }

  const header = decodeJsonPart<JwtHeader>(parts[0]);
  const payload = decodeJsonPart<ArtifactAccessTokenPayload>(parts[1]);
  if (header.alg !== "HS256" || payload.kind !== ARTIFACT_ACCESS_KIND) {
    throw new HttpError(401, "unauthorized", "Artifact access token is invalid.");
  }

  const secret = resolveDevBootstrapSecret(env, options.allowLocalFallback ?? false);
  const verified = await verifyHmac(`${parts[0]}.${parts[1]}`, parts[2], secret);
  if (!verified) {
    throw new HttpError(401, "unauthorized", "Artifact access token signature verification failed.");
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new HttpError(401, "unauthorized", "Artifact access token has expired.");
  }

  return payload;
}
