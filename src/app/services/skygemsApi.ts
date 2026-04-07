/**
 * SkyGems Backend API integration.
 * Connects the UI to the real backend (apps/api) running on the Cloudflare Worker.
 * All calls go through /v1/* which Vite proxies to localhost:8787.
 */

import { generateMultipleVariations, type SelectedVariations } from './variationEngine';
import type { DesignMetadata } from './storageService';
import { getDesign, resetStorage, upsertDesignMetadata } from './storageService';
import { generateJewelryPrompt } from '../utils/promptGenerator';

// ── Types ──

export interface RootCreateInput {
  type: string;
  metal: string;
  gemstones: string[];
  style: string;
  complexity: number;
  promptText: string;
  promptMode: 'synced' | 'override';
  variations: number;
}

export interface RootPromptPreviewInput {
  type: string;
  metal: string;
  gemstones: string[];
  style: string;
  complexity: number;
  userNotes?: string;
}

export interface RootPromptPreviewResult {
  promptText: string;
  source: 'live' | 'fallback';
  errorMessage?: string;
}

export interface RootGeneratedDesign {
  generationId: string;
  designId: string;
  prompt: string;
  imageUrl: string;
  features: {
    type: string;
    metal: string;
    gemstones: string[];
    style: string;
    complexity: number;
    variation: SelectedVariations;
  };
}

export type DesignOwnerScope = 'all' | 'mine';

interface DevBootstrapConfig {
  username?: string;
}

// ── Session ──

interface DevSession {
  token: string;
  expiresAt: string;
  projectId: string;
  projectName: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  bootstrapConfigKey: string;
}

export type AuthSession = DevSession;

const DEV_SESSION_KEY = 'skygems.session.v1';
const DEV_BOOTSTRAP_CONFIG_KEY = 'skygems.dev-bootstrap.config.v1';
const AUTH_REQUIRED_MESSAGE = 'SkyGems authentication is required.';
let validatedSessionToken: string | null = null;

function titleizeSegment(value: string): string {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function normalizeBootstrapConfig(config: DevBootstrapConfig): DevBootstrapConfig {
  const entries = Object.entries(config)
    .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value] as const)
    .filter(([, value]) => Boolean(value));
  return Object.fromEntries(entries) as DevBootstrapConfig;
}

function getBootstrapConfigFromUrl(): DevBootstrapConfig {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  return normalizeBootstrapConfig({
    username: params.get('dev-user') ?? undefined,
  });
}

function getStoredBootstrapConfig(): DevBootstrapConfig {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev-reset') === '1') {
      storeBootstrapConfig({});
      clearStoredSession();
      return {};
    }
  }

  try {
    const raw = localStorage.getItem(DEV_BOOTSTRAP_CONFIG_KEY);
    const stored = raw ? normalizeBootstrapConfig(JSON.parse(raw) as DevBootstrapConfig) : {};
    const merged = {
      ...stored,
      ...getBootstrapConfigFromUrl(),
    };
    if (JSON.stringify(merged) !== JSON.stringify(stored)) {
      storeBootstrapConfig(merged);
    }
    return merged;
  } catch {
    const urlConfig = getBootstrapConfigFromUrl();
    if (Object.keys(urlConfig).length > 0) {
      storeBootstrapConfig(urlConfig);
    }
    return urlConfig;
  }
}

function storeBootstrapConfig(config: DevBootstrapConfig) {
  const normalized = normalizeBootstrapConfig(config);
  if (Object.keys(normalized).length === 0) {
    localStorage.removeItem(DEV_BOOTSTRAP_CONFIG_KEY);
    return;
  }

  localStorage.setItem(DEV_BOOTSTRAP_CONFIG_KEY, JSON.stringify(normalized));
}

function buildBootstrapConfigKey(config: DevBootstrapConfig): string {
  return JSON.stringify(normalizeBootstrapConfig(config));
}

function clearStoredSession() {
  sessionStorage.removeItem(DEV_SESSION_KEY);
  localStorage.removeItem(DEV_SESSION_KEY);
}

function getStoredSession(): DevSession | null {
  try {
    const raw = localStorage.getItem(DEV_SESSION_KEY) ?? sessionStorage.getItem(DEV_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DevSession;
    const configKey = buildBootstrapConfigKey(getStoredBootstrapConfig());
    if (parsed.bootstrapConfigKey !== configKey) {
      clearStoredSession();
      return null;
    }
    if (new Date(parsed.expiresAt) <= new Date()) {
      clearStoredSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readStoredSession(): AuthSession | null {
  return getStoredSession();
}

export function readDevBootstrapState() {
  const config = getStoredBootstrapConfig();
  const session = getStoredSession();

  return {
    username: config.username ?? 'gemsdev',
    displayName: session?.userDisplayName ?? titleizeSegment((config.username ?? 'gemsdev').trim()),
    userId: session?.userId,
    projectId: session?.projectId,
    hasCustomConfig: Object.keys(config).length > 0,
  };
}

export function clearAuthSession() {
  storeBootstrapConfig({});
  clearStoredSession();
  validatedSessionToken = null;
  resetStorage();
}

function saveBootstrapIdentity(config: DevBootstrapConfig) {
  storeBootstrapConfig(config);
  clearStoredSession();
  validatedSessionToken = null;
  resetStorage();
}

async function validateStoredSession(session: DevSession): Promise<void> {
  if (validatedSessionToken === session.token) {
    return;
  }

  const response = await fetch('/v1/auth/session', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
  });

  if (!response.ok) {
    clearStoredSession();
    validatedSessionToken = null;
    resetStorage();
    throw new Error(AUTH_REQUIRED_MESSAGE);
  }

  validatedSessionToken = session.token;
}

export async function signInWithDevBootstrap(input: {
  username: string;
  password: string;
}): Promise<AuthSession> {
  const username = input.username.trim().toLowerCase();
  if (!username) {
    throw new Error('Username is required.');
  }

  saveBootstrapIdentity({
    username,
  });

  const response = await fetch('/v1/dev/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      username,
      password: input.password,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || 'Unable to sign in.');
  }

  const data = (await response.json()) as {
    sessionToken: string;
    sessionExpiresAt: string;
    user: { id: string; email: string; displayName: string | null };
    tenant: { id: string; slug: string; name: string };
    project: { id: string; name: string };
  };

  const session: DevSession = {
    token: data.sessionToken,
    expiresAt: data.sessionExpiresAt,
    projectId: data.project.id,
    projectName: data.project.name,
    userId: data.user.id,
    userEmail: data.user.email,
    userDisplayName: data.user.displayName,
    tenantId: data.tenant.id,
    tenantSlug: data.tenant.slug,
    tenantName: data.tenant.name,
    bootstrapConfigKey: buildBootstrapConfigKey({ username }),
  };

  localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
  sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
  validatedSessionToken = session.token;
  return session;
}

export async function restoreAuthSession(): Promise<AuthSession> {
  return ensureSession();
}

async function ensureSession(): Promise<DevSession> {
  const existing = getStoredSession();
  if (!existing) {
    throw new Error(AUTH_REQUIRED_MESSAGE);
  }
  await validateStoredSession(existing);
  return existing;
}

async function authedJson<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await ensureSession();
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// ── Prompt Preview ──

export async function fetchPromptPreview(
  input: RootPromptPreviewInput,
): Promise<RootPromptPreviewResult> {
  const session = await ensureSession();
  try {
    const preview = await authedJson<{ promptText: string }>('/v1/prompt-preview', {
      method: 'POST',
      body: JSON.stringify({
        projectId: session.projectId,
        jewelryType: input.type,
        metal: input.metal,
        gemstones: input.gemstones,
        style: input.style,
        complexity: input.complexity,
        pairStandardVersion: 'pair_v1',
        ...(input.userNotes ? { userNotes: input.userNotes } : {}),
      }),
    });
    return { promptText: preview.promptText, source: 'live' };
  } catch (error) {
    return {
      promptText: generateJewelryPrompt(input),
      source: 'fallback',
      errorMessage: error instanceof Error ? error.message : 'Preview unavailable',
    };
  }
}

// ── Generation ──

async function generateSingleConcept(
  input: RootCreateInput,
  variation: SelectedVariations,
  index: number,
): Promise<RootGeneratedDesign> {
  const session = await ensureSession();

  const gen = await authedJson<{
    generationId: string;
    designId: string;
  }>('/v1/generate-design', {
    method: 'POST',
    headers: { 'Idempotency-Key': `gen-${index}-${Date.now()}` },
    body: JSON.stringify({
      projectId: session.projectId,
      jewelryType: input.type,
      metal: input.metal,
      gemstones: input.gemstones,
      style: input.style,
      complexity: input.complexity,
      pairStandardVersion: 'pair_v1',
      variationOverrides: variation,
      ...(input.promptMode === 'override' ? { promptTextOverride: input.promptText } : {}),
    }),
  });

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((r) => setTimeout(r, 1500));
    const status = await authedJson<{
      status: string;
      pair: null | { render: { signedUrl: string } };
      design: { designId: string };
      error?: { message?: string } | null;
    }>(`/v1/generations/${gen.generationId}`);

    if (status.status === 'failed' || status.status === 'canceled') {
      throw new Error(status.error?.message ?? `Generation ${status.status}`);
    }
    if (status.status === 'succeeded' && status.pair?.render?.signedUrl) {
      return {
        generationId: gen.generationId,
        designId: status.design.designId,
        prompt: input.promptText,
        imageUrl: status.pair.render.signedUrl,
        features: {
          type: input.type,
          metal: input.metal,
          gemstones: input.gemstones,
          style: input.style,
          complexity: input.complexity,
          variation,
        },
      };
    }
  }
  throw new Error('Generation timed out');
}

export async function generateConceptSet(input: RootCreateInput): Promise<RootGeneratedDesign[]> {
  const count = Math.max(1, Math.min(input.variations || 4, 6));
  const variations = generateMultipleVariations(input.type, count);
  return Promise.all(
    variations.map((v, i) => generateSingleConcept(input, v, i)),
  );
}

// ── Design Operations ──

export async function fetchBackendDesign(designId: string) {
  return authedJson<any>(`/v1/designs/${designId}`);
}

export async function selectBackendDesign(designId: string) {
  return authedJson<any>(`/v1/designs/${designId}/select`, { method: 'POST' });
}

export async function refineBackendDesign(designId: string, instruction: string) {
  return authedJson<any>(`/v1/designs/${designId}/refine`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `refine-${designId}-${Date.now()}` },
    body: JSON.stringify({ instruction, preserve: [], pairStandardVersion: 'pair_v1' }),
  });
}

export async function generateBackendSpec(designId: string) {
  return authedJson<any>(`/v1/designs/${designId}/spec`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `spec-${designId}-${Date.now()}` },
    body: JSON.stringify({ manufacturingIntent: 'prototype', forceRegenerate: true }),
  });
}

export async function postCopilotMessage(designId: string, message: string) {
  return authedJson<{ intent: string; response: string; suggestedAction?: any; designContext: string }>(
    `/v1/designs/${designId}/copilot`,
    { method: 'POST', body: JSON.stringify({ message }) },
  );
}

// ── Listing ──

function mapBackendDesign(design: any): DesignMetadata {
  const existing = getDesign(design.designId);
  const metadata: DesignMetadata = {
    id: design.designId,
    prompt: design.promptSummary ?? '',
    imageUrl: design.pair?.render?.signedUrl || existing?.imageUrl || '',
    createdByUserId: design.createdByUserId ?? existing?.createdByUserId,
    ownedByCurrentUser: design.ownedByCurrentUser ?? existing?.ownedByCurrentUser,
    features: {
      type: design.designDna?.jewelryType ?? 'ring',
      metal: design.designDna?.metal ?? 'gold',
      gemstones: design.designDna?.gemstones ?? [],
      style: design.designDna?.style ?? 'contemporary',
      complexity: design.designDna?.complexity ?? 50,
      variation: {
        bandStyle: design.designDna?.bandStyle ?? '',
        settingType: design.designDna?.settingType ?? '',
        stonePosition: design.designDna?.stonePosition ?? '',
        profile: design.designDna?.profile ?? '',
        motif: design.designDna?.motif ?? '',
      },
    },
    liked: existing?.liked ?? false,
    createdAt: new Date(design.createdAt).getTime(),
    updatedAt: new Date(design.updatedAt).getTime(),
    tags: existing?.tags ?? [],
    notes: existing?.notes ?? '',
  };
  upsertDesignMetadata(metadata);
  return metadata;
}

export async function listBackendDesigns(ownerScope: DesignOwnerScope = 'mine'): Promise<DesignMetadata[]> {
  const session = await ensureSession();
  const params = new URLSearchParams({ ownerScope });
  const payload = await authedJson<{ items: any[] }>(`/v1/projects/${session.projectId}/designs?${params.toString()}`);
  return payload.items.map(mapBackendDesign);
}

export async function searchBackendGallery(
  query: string,
  ownerScope: DesignOwnerScope = 'mine',
): Promise<DesignMetadata[]> {
  const payload = await authedJson<{ items: any[] }>('/v1/gallery/search', {
    method: 'POST',
    body: JSON.stringify({ ownerScope, query, filters: {}, page: 1, pageSize: 50, sort: 'newest' }),
  });
  return payload.items.map(mapBackendDesign);
}
