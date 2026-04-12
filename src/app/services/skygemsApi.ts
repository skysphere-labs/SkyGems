/**
 * SkyGems Backend API integration.
 * Connects the UI to the real backend (apps/api) running on the Cloudflare Worker.
 * All calls go through /v1/* which Vite proxies to localhost:8787.
 */

import { generateMultipleVariations, type SelectedVariations } from './variationEngine';
import { resolveView, type JewelryType } from '@skygems/shared';
import type { DesignMetadata } from './storageService';
import {
  clearGalleryCacheState,
  getCachedDesigns,
  getDesign,
  readGalleryCacheState,
  resetStorage,
  upsertDesignMetadata,
  writeGalleryCacheState,
} from './storageService';
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

export interface RootPromptEnhanceResult {
  originalText: string;
  enhancedText: string;
  source: 'live' | 'fallback';
  errorMessage?: string;
}

export interface RootGeneratedDesign {
  generationId: string;
  designId: string;
  prompt: string;
  imageUrl: string;
  viewLabel?: string;
  features: {
    type: string;
    metal: string;
    gemstones: string[];
    style: string;
    complexity: number;
    variation: SelectedVariations;
  };
}

export interface GenerateConceptSetProgressCallbacks {
  onItemComplete?: (index: number, result: RootGeneratedDesign) => void;
  onItemError?: (index: number, error: Error) => void;
}

export type DesignOwnerScope = 'all' | 'mine';
export const DESIGNS_UPDATED_EVENT = 'skygems:designs-updated';
const GALLERY_CACHE_TTL_MS = 60_000;
const GALLERY_SYNC_PAGE_SIZE = 100;
const gallerySyncInFlight = new Map<string, Promise<DesignMetadata[]>>();

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

const DEV_SESSION_KEY = 'skygems.session.v2';
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

function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isFixtureDevAccount(username: string): boolean {
  return username === 'gemsdev' || username === 'acegems';
}

function resolveBootstrapIdentity(username: string) {
  const normalized = username.trim().toLowerCase();
  const isEmail = normalized.includes('@');
  const email = isEmail ? normalized : `${slugifySegment(normalized)}@skygems.local`;
  const localPart = email.split('@')[0] ?? normalized;
  const displayName = titleizeSegment(localPart) || 'SkyGems User';
  const tenantSlug = slugifySegment(isEmail ? email.replace('@', '-') : normalized) || 'skygems-user';

  return {
    email,
    displayName,
    tenantSlug,
    tenantName: `${displayName} Studio`,
    projectName: `${displayName} Workspace`,
    projectDescription: `Remote Cloudflare workspace for ${email}.`,
  };
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

function persistSession(session: DevSession) {
  localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
  sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
}

function syncStoredSessionProject(project: {
  id: string;
  name?: string | null;
}) {
  const session = getStoredSession();
  if (!session) {
    return;
  }

  const nextProjectName = project.name?.trim() ? project.name.trim() : session.projectName;
  if (session.projectId === project.id && session.projectName === nextProjectName) {
    return;
  }

  persistSession({
    ...session,
    projectId: project.id,
    projectName: nextProjectName,
  });
}

export function notifyDesignsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DESIGNS_UPDATED_EVENT));
  }
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
  const fallbackUsername = config.username ?? '';
  const fallbackDisplayName =
    fallbackUsername.trim().length > 0
      ? titleizeSegment(fallbackUsername.trim())
      : 'Personal Workspace';

  return {
    username: fallbackUsername,
    displayName: session?.userDisplayName ?? fallbackDisplayName,
    userId: session?.userId,
    projectId: session?.projectId,
    hasCustomConfig: Object.keys(config).length > 0,
  };
}

export function clearAuthSession() {
  storeBootstrapConfig({});
  clearStoredSession();
  validatedSessionToken = null;
  clearGalleryCacheState();
  resetStorage();
}

function saveBootstrapIdentity(config: DevBootstrapConfig) {
  storeBootstrapConfig(config);
  clearStoredSession();
  validatedSessionToken = null;
  clearGalleryCacheState();
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

  let response: Response;
  try {
    const endpoint = isFixtureDevAccount(username) ? '/v1/dev/login' : '/v1/dev/bootstrap';
    const body = isFixtureDevAccount(username)
      ? {
          username,
          password: input.password,
        }
      : resolveBootstrapIdentity(username);

    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error && /fetch/i.test(error.message)
        ? 'SkyGems API is unreachable. Start the local backend worker and try again.'
        : 'Unable to reach the authentication service.',
    );
  }

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

  persistSession(session);
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
    const preview = await authedJson<{ projectId: string; promptText: string }>('/v1/prompt-preview', {
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
    syncStoredSessionProject({ id: preview.projectId });
    return { promptText: preview.promptText, source: 'live' };
  } catch (error) {
    return {
      promptText: generateJewelryPrompt(input),
      source: 'fallback',
      errorMessage: error instanceof Error ? error.message : 'Preview unavailable',
    };
  }
}

export async function enhancePrompt(freeText: string): Promise<RootPromptEnhanceResult> {
  const session = await ensureSession();
  try {
    const result = await authedJson<RootPromptEnhanceResult & { projectId: string }>('/v1/prompt-enhance', {
      method: 'POST',
      body: JSON.stringify({
        projectId: session.projectId,
        freeText,
      }),
    });
    syncStoredSessionProject({ id: result.projectId });
    return {
      originalText: result.originalText,
      enhancedText: result.enhancedText,
      source: result.source,
      errorMessage: result.errorMessage,
    };
  } catch (error) {
    return {
      originalText: freeText,
      enhancedText: freeText,
      source: 'fallback',
      errorMessage: error instanceof Error ? error.message : 'Enhancement unavailable',
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
    projectId: string;
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
  syncStoredSessionProject({ id: gen.projectId });

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
      const view = resolveView(input.type as JewelryType, variation.viewId);
      return {
        generationId: gen.generationId,
        designId: status.design.designId,
        prompt: input.promptText,
        imageUrl: status.pair.render.signedUrl,
        viewLabel: view.label,
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
  return generateConceptSetProgressively(input);
}

export async function generateConceptSetProgressively(
  input: RootCreateInput,
  callbacks: GenerateConceptSetProgressCallbacks = {},
): Promise<RootGeneratedDesign[]> {
  const count = Math.max(1, Math.min(input.variations || 4, 8));
  const variations = generateMultipleVariations(input.type, count);
  const session = await ensureSession();
  const successfulResults: RootGeneratedDesign[] = [];
  const errors: Error[] = [];

  await Promise.all(
    variations.map(async (variation, index) => {
      try {
        const result = await generateSingleConcept(input, variation, index);
        successfulResults.push(result);
        mapGeneratedDesign(result, session.userId);
        notifyDesignsUpdated();
        callbacks.onItemComplete?.(index, result);
      } catch (error) {
        const normalized =
          error instanceof Error ? error : new Error('Unknown generation error');
        errors.push(normalized);
        callbacks.onItemError?.(index, normalized);
      }
    }),
  );

  if (successfulResults.length > 0) {
    return successfulResults;
  }

  throw errors[0] ?? new Error('Generation failed');
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

export async function generateBackendTechSheet(designId: string) {
  return authedJson<any>(`/v1/designs/${designId}/technical-sheet`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `tech-sheet-${designId}-${Date.now()}` },
    body: JSON.stringify({ includePdf: true, forceRegenerate: true }),
  });
}

export async function generateBackendSvg(designId: string) {
  return authedJson<any>(`/v1/designs/${designId}/svg`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `svg-${designId}-${Date.now()}` },
    body: JSON.stringify({ views: ['front', 'side', 'top'], includeAnnotations: true, forceRegenerate: true }),
  });
}

export async function generateBackendCad(designId: string, formats: string[] = ['step', 'dxf', 'stl']) {
  return authedJson<any>(`/v1/designs/${designId}/cad`, {
    method: 'POST',
    headers: { 'Idempotency-Key': `cad-${designId}-${Date.now()}` },
    body: JSON.stringify({ formats, includeQaReport: true, forceRegenerate: true }),
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
  const imageUrl =
    design.pair?.render?.signedUrl ??
    design.coverImage?.signedUrl ??
    existing?.imageUrl ??
    '';
  const createdAt = design.createdAt
    ? new Date(design.createdAt).getTime()
    : existing?.createdAt ?? Date.now();
  const updatedAt = design.updatedAt
    ? new Date(design.updatedAt).getTime()
    : existing?.updatedAt ?? createdAt;
  const metadata: DesignMetadata = {
    id: design.designId,
    prompt: design.promptSummary ?? existing?.prompt ?? '',
    imageUrl,
    createdByUserId: design.createdByUserId ?? existing?.createdByUserId,
    ownedByCurrentUser: design.ownedByCurrentUser ?? existing?.ownedByCurrentUser,
    features: {
      type: design.designDna?.jewelryType ?? existing?.features.type ?? 'ring',
      metal: design.designDna?.metal ?? existing?.features.metal ?? 'gold',
      gemstones: design.designDna?.gemstones ?? existing?.features.gemstones ?? [],
      style: design.designDna?.style ?? existing?.features.style ?? 'contemporary',
      complexity: design.designDna?.complexity ?? existing?.features.complexity ?? 50,
      variation: {
        bandStyle: design.designDna?.bandStyle ?? existing?.features.variation.bandStyle ?? '',
        settingType: design.designDna?.settingType ?? existing?.features.variation.settingType ?? '',
        stonePosition: design.designDna?.stonePosition ?? existing?.features.variation.stonePosition ?? '',
        profile: design.designDna?.profile ?? existing?.features.variation.profile ?? '',
        motif: design.designDna?.motif ?? existing?.features.variation.motif ?? '',
      },
    },
    liked: existing?.liked ?? false,
    createdAt,
    updatedAt,
    tags: existing?.tags ?? [],
    notes: existing?.notes ?? '',
  };
  upsertDesignMetadata(metadata);
  return metadata;
}

function matchesGalleryQuery(design: DesignMetadata, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    design.prompt,
    design.features.type,
    design.features.metal,
    design.features.style,
    ...design.features.gemstones,
    ...(design.tags ?? []),
    design.id,
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
}

function getLatestUpdatedIso(designs: DesignMetadata[]): string | undefined {
  if (designs.length === 0) {
    return undefined;
  }

  const latest = designs.reduce((max, design) => Math.max(max, design.updatedAt), 0);
  return latest > 0 ? new Date(latest).toISOString() : undefined;
}

function getGallerySyncKey(ownerScope: DesignOwnerScope) {
  const session = readStoredSession();
  return `${session?.tenantId ?? 'anonymous-tenant'}:${session?.userId ?? 'anonymous'}:${ownerScope}`;
}

async function syncBackendGalleryCache(
  ownerScope: DesignOwnerScope = 'mine',
  options: {
    forceFull?: boolean;
    emitUpdateEvent?: boolean;
  } = {},
): Promise<DesignMetadata[]> {
  const syncKey = getGallerySyncKey(ownerScope);
  const inFlight = gallerySyncInFlight.get(syncKey);
  if (inFlight) {
    return inFlight;
  }

  const syncPromise = (async () => {
    const cachedBefore = getCachedDesigns(ownerScope);
    const cacheState = readGalleryCacheState(ownerScope);
    const updatedAfter =
      options.forceFull || !cacheState?.complete
        ? undefined
        : cacheState.lastServerUpdatedAt ?? getLatestUpdatedIso(cachedBefore);

    let page = 1;
    let fetchedCount = 0;
    let latestServerUpdatedAt = cacheState?.lastServerUpdatedAt ?? getLatestUpdatedIso(cachedBefore);

    while (true) {
      const payload = await authedJson<{ items: any[] }>('/v1/gallery/search', {
        method: 'POST',
        body: JSON.stringify({
          ownerScope,
          query: '',
          updatedAfter,
          filters: {},
          page,
          pageSize: GALLERY_SYNC_PAGE_SIZE,
          sort: updatedAfter ? 'updated' : 'newest',
        }),
      });

      const mapped = payload.items.map(mapBackendDesign);
      fetchedCount += mapped.length;

      for (const design of mapped) {
        const updatedAtIso = new Date(design.updatedAt).toISOString();
        if (!latestServerUpdatedAt || updatedAtIso > latestServerUpdatedAt) {
          latestServerUpdatedAt = updatedAtIso;
        }
      }

      if (mapped.length < GALLERY_SYNC_PAGE_SIZE) {
        break;
      }

      page += 1;
    }

    const cachedAfter = getCachedDesigns(ownerScope);
    writeGalleryCacheState(ownerScope, {
      ownerScope,
      lastSyncedAt: Date.now(),
      lastServerUpdatedAt: latestServerUpdatedAt ?? getLatestUpdatedIso(cachedAfter),
      complete: true,
      cachedCount: cachedAfter.length,
    });

    const changed =
      fetchedCount > 0 ||
      cachedAfter.length !== cachedBefore.length ||
      (getLatestUpdatedIso(cachedAfter) ?? '') !== (getLatestUpdatedIso(cachedBefore) ?? '');

    if (options.emitUpdateEvent && changed) {
      notifyDesignsUpdated();
    }

    return cachedAfter;
  })().finally(() => {
    gallerySyncInFlight.delete(syncKey);
  });

  gallerySyncInFlight.set(syncKey, syncPromise);
  return syncPromise;
}

function mapGeneratedDesign(result: RootGeneratedDesign, userId?: string): DesignMetadata {
  const existing = getDesign(result.designId);
  const metadata: DesignMetadata = {
    id: result.designId,
    prompt: result.prompt,
    imageUrl: result.imageUrl,
    createdByUserId: userId ?? existing?.createdByUserId,
    ownedByCurrentUser: true,
    features: result.features,
    liked: existing?.liked ?? false,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    tags: existing?.tags ?? [],
    notes: existing?.notes ?? '',
  };
  upsertDesignMetadata(metadata);
  return metadata;
}

export async function listBackendDesigns(ownerScope: DesignOwnerScope = 'mine'): Promise<DesignMetadata[]> {
  const cached = getCachedDesigns(ownerScope);
  const cacheState = readGalleryCacheState(ownerScope);
  const shouldRefresh =
    !cacheState ||
    !cacheState.complete ||
    Date.now() - cacheState.lastSyncedAt > GALLERY_CACHE_TTL_MS;

  if (cached.length > 0) {
    if (shouldRefresh) {
      void syncBackendGalleryCache(ownerScope, { emitUpdateEvent: true });
    }
    return cached;
  }

  try {
    return await syncBackendGalleryCache(ownerScope);
  } catch {
    return cached;
  }
}

export async function searchBackendGallery(
  query: string,
  ownerScope: DesignOwnerScope = 'mine',
): Promise<DesignMetadata[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0) {
    return listBackendDesigns(ownerScope);
  }

  const cacheState = readGalleryCacheState(ownerScope);
  if (!cacheState?.complete && getCachedDesigns(ownerScope).length === 0) {
    try {
      await syncBackendGalleryCache(ownerScope);
    } catch {
      return getCachedDesigns(ownerScope).filter((design) => matchesGalleryQuery(design, normalizedQuery));
    }
  }

  return getCachedDesigns(ownerScope).filter((design) => matchesGalleryQuery(design, normalizedQuery));
}
