import test from "node:test";
import assert from "node:assert/strict";

import {
  DesignSummarySchema,
  DesignDetailResponseSchema,
  DesignSelectResponseSchema,
  AuthSessionResponseSchema,
  DevBootstrapResponseSchema,
  GallerySearchRequestSchema,
  type GenerateDesignRequest,
  GenerateDesignResponseSchema,
  GenerateDesignRequestSchema,
  GenerationStatusResponseSchema,
  PromptPreviewResponseSchema,
  ProjectDesignsQuerySchema,
  ProjectDesignsResponseSchema,
} from "./api.ts";
import {
  buildPromptBundle,
  buildPromptPreview,
  buildPromptPreviewWithOptions,
  buildDesignDna,
  formatPromptBundlePreviewText,
  parsePromptBundleText,
} from "../domain/design-dna.ts";
import { buildArtifactR2Key } from "../domain/artifacts.ts";

const baseCreateInput = {
  projectId: "prj_01J0F8M0G7J0F8M0G7J0F8M0G7",
  jewelryType: "ring",
  metal: "gold",
  gemstones: ["diamond", "ruby"],
  style: "contemporary",
  complexity: 68,
  pairStandardVersion: "pair_v1" as const,
} satisfies GenerateDesignRequest;

test("generate design request schema accepts the locked create contract", () => {
  const parsed = GenerateDesignRequestSchema.parse(baseCreateInput);
  assert.equal(parsed.pairStandardVersion, "pair_v1");
  assert.deepEqual(parsed.gemstones, ["diamond", "ruby"]);
});

test("owner scope defaults keep list and gallery requests backward compatible", () => {
  assert.equal(ProjectDesignsQuerySchema.parse({}).ownerScope, "all");
  assert.equal(GallerySearchRequestSchema.parse({}).ownerScope, "all");
});

test("design dna generation is deterministic for the same normalized input", async () => {
  const first = await buildDesignDna(baseCreateInput);
  const second = await buildDesignDna({
    ...baseCreateInput,
    gemstones: ["ruby", "diamond"],
  });

  assert.equal(first.fingerprintSha256, second.fingerprintSha256);
  assert.deepEqual(first, second);
});

test("prompt preview stays within the locked response contract", async () => {
  const preview = await buildPromptPreview({
    ...baseCreateInput,
    userNotes: "Focus on high-end craftsmanship",
  });

  const parsed = PromptPreviewResponseSchema.parse({
    projectId: baseCreateInput.projectId,
    promptPreviewVersion: "prompt_preview.v1",
    pairStandardVersion: "pair_v1",
    ...preview,
  });

  assert.equal(parsed.designDnaPreview.jewelryType, "ring");
  assert.match(parsed.promptText, /Sketch prompt:/);
});

test("generate design response exposes execution dispatch metadata", () => {
  const parsed = GenerateDesignResponseSchema.parse({
    generationId: "gen_01J0F8M0G7J0F8M0G7J0F8M0G7",
    designId: "dsn_01J0F8M0G7J0F8M0G7J0F8M0G7",
    projectId: baseCreateInput.projectId,
    status: "queued",
    executionMode: "local",
    executionSource: "local_development",
    pairStandardVersion: "pair_v1",
    createdAt: "2026-04-06T06:00:00.000Z",
  });

  assert.equal(parsed.executionMode, "local");
  assert.equal(parsed.executionSource, "local_development");
});

test("prompt preview can compile provider-aware prompt text without changing the public schema", async () => {
  const preview = await buildPromptPreviewWithOptions(baseCreateInput, {
    provider: "google",
  });

  assert.match(preview.promptText, /Provider targeting:/);
  assert.match(preview.promptText, /Google image prompting/);
});

test("prompt bundle preview text round-trips into an override bundle", async () => {
  const designDna = await buildDesignDna(baseCreateInput);
  const promptBundle = buildPromptBundle(designDna, "Focus on high-end craftsmanship", {
    provider: "xai",
  });

  assert.deepEqual(
    parsePromptBundleText(formatPromptBundlePreviewText(promptBundle)),
    promptBundle,
  );
});

test("prompt override text without preview labels applies to both prompt lanes", () => {
  const override = parsePromptBundleText("single override prompt", {
    fallbackNegativePrompt: "avoid clutter",
  });

  assert.equal(override.sketchPrompt, "single override prompt");
  assert.equal(override.renderPrompt, "single override prompt");
  assert.equal(override.negativePrompt, "avoid clutter");
});

test("dev bootstrap response schema locks the signed local bootstrap contract", () => {
  const parsed = DevBootstrapResponseSchema.parse({
    mode: "dev_bootstrap",
    sessionToken: "signed.jwt.payload",
    sessionExpiresAt: "2026-04-06T06:00:00.000Z",
    tenant: {
      id: "ten_01J0F8M0G7J0F8M0G7J0F8M0G7",
      slug: "skygems-dev",
      name: "SkyGems Dev Tenant",
    },
    user: {
      id: "usr_01J0F8M0G7J0F8M0G7J0F8M0G7",
      email: "dev@skygems.local",
      displayName: "SkyGems Dev User",
      authSubject: "dev:skygems-dev:dev@skygems.local",
    },
    project: {
      id: "prj_01J0F8M0G7J0F8M0G7J0F8M0G7",
      name: "SkyGems Sandbox",
      description: "Local bootstrap project.",
      status: "active",
      createdAt: "2026-04-06T02:30:00.000Z",
      updatedAt: "2026-04-06T02:30:00.000Z",
    },
    created: {
      tenant: true,
      user: true,
      project: true,
      membership: true,
    },
  });

  assert.equal(parsed.project.name, "SkyGems Sandbox");
});

test("auth session response schema captures tenant-scoped access counts", () => {
  const parsed = AuthSessionResponseSchema.parse({
    authMode: "dev_bootstrap",
    tenant: {
      id: "ten_01J0F8M0G7J0F8M0G7J0F8M0G7",
      slug: "skygems-dev",
      name: "SkyGems Dev Tenant",
    },
    user: {
      id: "usr_01J0F8M0G7J0F8M0G7J0F8M0G7",
      email: "dev@skygems.local",
      displayName: "SkyGems Dev User",
      authSubject: "dev:skygems-dev:dev@skygems.local",
      role: "owner",
      permissions: ["project:read", "design:create"],
    },
    access: {
      memberships: [
        {
          projectId: "prj_01J0F8M0G7J0F8M0G7J0F8M0G7",
          role: "owner",
        },
      ],
      accessibleProjectCount: 1,
      ownedProjectCount: 1,
      accessibleDesignCount: 4,
      ownedDesignCount: 4,
      accessibleArtifactCount: 8,
    },
  });

  assert.equal(parsed.access.memberships[0]?.role, "owner");
  assert.equal(parsed.access.accessibleArtifactCount, 8);
});

test("design summary and generation status schemas carry backend-owned selection truth", async () => {
  const designDna = await buildDesignDna(baseCreateInput);
  const design = DesignSummarySchema.parse({
    designId: "dsn_01J0F8M0G7J0F8M0G7J0F8M0G7",
    projectId: baseCreateInput.projectId,
    createdByUserId: "usr_01J0F8M0G7J0F8M0G7J0F8M0G7",
    ownedByCurrentUser: true,
    parentDesignId: null,
    sourceKind: "create",
    sourceGenerationId: "gen_01J0F8M0G7J0F8M0G7J0F8M0G7",
    displayName: "Contemporary Ring",
    promptSummary: "ring in yellow gold with round diamond",
    designDna,
    selectionState: "selected",
    latestPairId: "pair_01J0F8M0G7J0F8M0G7J0F8M0G7",
    pair: {
      pairId: "pair_01J0F8M0G7J0F8M0G7J0F8M0G7",
      selectionState: "selected",
      sketch: {
        artifactId: "art_01J0F8M0G7J0F8M0G7J0F8M0G7",
        kind: "pair_sketch_png",
        contentType: "image/svg+xml",
        byteSize: 1024,
        sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        signedUrl: "data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C/svg%3E",
      },
      render: {
        artifactId: "art_01J0F8M0G7J0F8M0G7J0F8M0G8",
        kind: "pair_render_png",
        contentType: "image/svg+xml",
        byteSize: 1024,
        sha256: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
        signedUrl: "data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C/svg%3E",
      },
    },
    latestSpecId: null,
    latestTechnicalSheetId: null,
    latestSvgAssetId: null,
    latestCadJobId: null,
    stageStatuses: {
      spec: "not_requested",
      technicalSheet: "not_requested",
      svg: "not_requested",
      cad: "not_requested",
    },
    createdAt: "2026-04-06T06:00:00.000Z",
    selectedAt: "2026-04-06T06:05:00.000Z",
    updatedAt: "2026-04-06T06:05:00.000Z",
    archivedAt: null,
  });

  const parsed = GenerationStatusResponseSchema.parse({
    generationId: "gen_01J0F8M0G7J0F8M0G7J0F8M0G7",
    designId: design.designId,
    projectId: baseCreateInput.projectId,
    requestKind: "create",
    status: "succeeded",
    executionMode: "local",
    executionSource: "local_development",
    pairStandardVersion: "pair_v1",
    createdAt: "2026-04-06T06:00:00.000Z",
    startedAt: "2026-04-06T06:00:05.000Z",
    completedAt: "2026-04-06T06:05:00.000Z",
    error: null,
    pair: design.pair,
    projectSelectedDesignId: design.designId,
    canSelect: true,
    design,
  });

  assert.equal(parsed.design.selectionState, "selected");
  assert.equal(parsed.design.pair?.render.kind, "pair_render_png");
});

test("artifact keys follow the locked D1 and R2 naming rules", () => {
  const key = buildArtifactR2Key("pair_render_png", {
    tenantId: "ten_01J0F8M0G7J0F8M0G7J0F8M0G7",
    projectId: "prj_01J0F8M0G7J0F8M0G7J0F8M0G7",
    designId: "dsn_01J0F8M0G7J0F8M0G7J0F8M0G7",
    pairId: "pair_01J0F8M0G7J0F8M0G7J0F8M0G7",
  });

  assert.equal(
    key,
    "tenants/ten_01J0F8M0G7J0F8M0G7J0F8M0G7/projects/prj_01J0F8M0G7J0F8M0G7J0F8M0G7/designs/dsn_01J0F8M0G7J0F8M0G7J0F8M0G7/pairs/pair_01J0F8M0G7J0F8M0G7J0F8M0G7/render.png",
  );
});

test("design detail, project designs, and selection responses lock the explicit backend truth slice", async () => {
  const designDna = await buildDesignDna(baseCreateInput);
  const design = {
    designId: "dsn_01J0F8M0G7J0F8M0G7J0F8M0G7",
    projectId: baseCreateInput.projectId,
    createdByUserId: "usr_01J0F8M0G7J0F8M0G7J0F8M0G7",
    ownedByCurrentUser: true,
    parentDesignId: null,
    sourceKind: "create" as const,
    sourceGenerationId: "gen_01J0F8M0G7J0F8M0G7J0F8M0G7",
    displayName: "Contemporary Ring",
    promptSummary: "ring in yellow gold with round diamond",
    designDna,
    selectionState: "candidate" as const,
    latestPairId: "pair_01J0F8M0G7J0F8M0G7J0F8M0G7",
    pair: {
      pairId: "pair_01J0F8M0G7J0F8M0G7J0F8M0G7",
      selectionState: "candidate" as const,
      sketch: {
        artifactId: "art_01J0F8M0G7J0F8M0G7J0F8M0G7",
        kind: "pair_sketch_png" as const,
        contentType: "image/svg+xml",
        byteSize: 1024,
        sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        signedUrl: "data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C/svg%3E",
      },
      render: {
        artifactId: "art_01J0F8M0G7J0F8M0G7J0F8M0G8",
        kind: "pair_render_png" as const,
        contentType: "image/svg+xml",
        byteSize: 1024,
        sha256: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
        signedUrl: "data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C/svg%3E",
      },
    },
    latestSpecId: null,
    latestTechnicalSheetId: null,
    latestSvgAssetId: null,
    latestCadJobId: null,
    stageStatuses: {
      spec: "not_requested" as const,
      technicalSheet: "not_requested" as const,
      svg: "not_requested" as const,
      cad: "not_requested" as const,
    },
    createdAt: "2026-04-06T06:00:00.000Z",
    selectedAt: null,
    updatedAt: "2026-04-06T06:04:00.000Z",
    archivedAt: null,
  };

  const detail = DesignDetailResponseSchema.parse({
    projectId: baseCreateInput.projectId,
    selectedDesignId: "dsn_01J0F8M0G7J0F8M0G7J0F8M0G8",
    canSelect: true,
    design,
    latestSpec: null,
    latestTechSheet: null,
    recentGenerations: [
      {
        generationId: "gen_01J0F8M0G7J0F8M0G7J0F8M0G7",
        requestKind: "create",
        status: "succeeded",
        executionMode: "queue",
        executionSource: "configured_queue",
        pairStandardVersion: "pair_v1",
        createdAt: "2026-04-06T06:00:00.000Z",
        startedAt: "2026-04-06T06:00:05.000Z",
        completedAt: "2026-04-06T06:04:00.000Z",
        error: null,
      },
    ],
  });

  const list = ProjectDesignsResponseSchema.parse({
    projectId: baseCreateInput.projectId,
    selectedDesignId: "dsn_01J0F8M0G7J0F8M0G7J0F8M0G8",
    total: 1,
    items: [design],
  });

  const selection = DesignSelectResponseSchema.parse({
    ...detail,
    previousSelectedDesignId: "dsn_01J0F8M0G7J0F8M0G7J0F8M0G8",
    selectionChanged: true,
    latestSpec: null,
  });

  assert.equal(detail.design.sourceGenerationId, "gen_01J0F8M0G7J0F8M0G7J0F8M0G7");
  assert.equal(detail.design.ownedByCurrentUser, true);
  assert.equal(list.items[0].projectId, baseCreateInput.projectId);
  assert.equal(selection.previousSelectedDesignId, "dsn_01J0F8M0G7J0F8M0G7J0F8M0G8");
});
