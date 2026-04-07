import {
  buildArtifactR2Key,
  buildDesignDisplayName,
  buildPromptSummary,
  generatePrefixedId,
  sha256Hex,
  type DevBootstrapRequest,
  DevBootstrapRequestSchema,
  type DesignDna,
} from "@skygems/shared";

import { ensureTenantAndUser, issueDevBootstrapSession, type AuthContext } from "./auth.ts";
import { executeStatement, nowIso, queryFirst } from "./d1.ts";
import { type ApiEnv } from "./runtime.ts";

interface ProjectRow {
  id: string;
  tenant_id: string;
  created_by_user_id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

interface LocalDevAccountDefinition {
  username: string;
  password: string;
  tenantSlug: string;
  tenantName: string;
  email: string;
  displayName: string;
  projectName: string;
  projectDescription: string;
  prompts: Array<{
    promptSummary: string;
    designDna: DesignDna;
    selectionState: "candidate" | "selected";
    placeholderTitle: string;
    accent: string;
    background: string;
  }>;
}

const LOCAL_DEV_ACCOUNTS: Record<string, LocalDevAccountDefinition> = {
  gemsdev: {
    username: "gemsdev",
    password: "gemsdev123",
    tenantSlug: "gemsdev",
    tenantName: "GemsDev Studio",
    email: "gemsdev@skygems.local",
    displayName: "Gems Dev",
    projectName: "GemsDev Workspace",
    projectDescription: "Seeded local workspace for GemsDev authorization testing.",
    prompts: [
      {
        promptSummary: "oval diamond halo ring in polished yellow gold",
        designDna: {
          jewelryType: "ring",
          metal: "gold",
          gemstones: ["diamond"],
          style: "contemporary",
          complexity: 58,
          bandStyle: "split band",
          settingType: "halo setting",
          stonePosition: "centered",
          profile: "raised setting",
          motif: "geometric precision",
          fingerprintSha256: "1".repeat(64),
        },
        selectionState: "selected",
        placeholderTitle: "GemsDev Halo Ring",
        accent: "#D4AF37",
        background: "#140f09",
      },
      {
        promptSummary: "diamond drop earrings in white gold with pavé detail",
        designDna: {
          jewelryType: "earrings",
          metal: "platinum",
          gemstones: ["diamond"],
          style: "contemporary",
          complexity: 46,
          bandStyle: "drop earring",
          settingType: "pave",
          stonePosition: "graduated",
          profile: "statement profile",
          motif: "minimalist lines",
          fingerprintSha256: "2".repeat(64),
        },
        selectionState: "candidate",
        placeholderTitle: "GemsDev Drop Earrings",
        accent: "#F8E7A7",
        background: "#121212",
      },
    ],
  },
  acegems: {
    username: "acegems",
    password: "acegems123",
    tenantSlug: "acegems",
    tenantName: "AceGems Atelier",
    email: "acegems@skygems.local",
    displayName: "Ace Gems",
    projectName: "AceGems Workspace",
    projectDescription: "Seeded local workspace for AceGems authorization testing.",
    prompts: [
      {
        promptSummary: "emerald pendant in white gold with art deco framing",
        designDna: {
          jewelryType: "pendant",
          metal: "platinum",
          gemstones: ["emerald"],
          style: "geometric",
          complexity: 62,
          bandStyle: "geometric pendant",
          settingType: "bezel setting",
          stonePosition: "centered",
          profile: "angular profile",
          motif: "art deco influence",
          fingerprintSha256: "3".repeat(64),
        },
        selectionState: "selected",
        placeholderTitle: "AceGems Emerald Pendant",
        accent: "#62C6B3",
        background: "#081311",
      },
      {
        promptSummary: "sapphire bracelet in rose gold with sculptural links",
        designDna: {
          jewelryType: "bracelet",
          metal: "rose-gold",
          gemstones: ["sapphire"],
          style: "contemporary",
          complexity: 52,
          bandStyle: "link bracelet",
          settingType: "channel setting",
          stonePosition: "scattered",
          profile: "curved profile",
          motif: "organic flow",
          fingerprintSha256: "4".repeat(64),
        },
        selectionState: "candidate",
        placeholderTitle: "AceGems Sapphire Bracelet",
        accent: "#FFB7C7",
        background: "#170d13",
      },
    ],
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function resolveBootstrapDefaults(env: ApiEnv): Required<DevBootstrapRequest> {
  return {
    tenantSlug: env.SKYGEMS_DEV_BOOTSTRAP_TENANT_SLUG ?? "skygems-dev",
    tenantName: env.SKYGEMS_DEV_BOOTSTRAP_TENANT_NAME ?? "SkyGems Dev Tenant",
    email: env.SKYGEMS_DEV_BOOTSTRAP_EMAIL ?? "dev@skygems.local",
    displayName: env.SKYGEMS_DEV_BOOTSTRAP_DISPLAY_NAME ?? "SkyGems Dev User",
    projectName: env.SKYGEMS_DEV_BOOTSTRAP_PROJECT_NAME ?? "SkyGems Sandbox",
    projectDescription:
      env.SKYGEMS_DEV_BOOTSTRAP_PROJECT_DESCRIPTION ??
      "Local bootstrap project for prompt-preview and the first wired backend slice.",
  };
}

function buildSeedPromptInput(designDna: DesignDna, promptSummary: string) {
  return {
    projectId: "",
    jewelryType: designDna.jewelryType,
    metal: designDna.metal,
    gemstones: designDna.gemstones,
    style: designDna.style,
    complexity: designDna.complexity,
    pairStandardVersion: "pair_v1" as const,
    userNotes: promptSummary,
  };
}

function buildSeedPlaceholderSvg(options: {
  title: string;
  subtitle: string;
  accent: string;
  background: string;
}): string {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  return `
    <svg width="1200" height="900" viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="900" rx="40" fill="${options.background}" />
      <rect x="44" y="44" width="1112" height="812" rx="28" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
      <circle cx="600" cy="360" r="118" fill="none" stroke="${options.accent}" stroke-width="8"/>
      <path d="M470 540 C520 400, 680 400, 730 540" fill="none" stroke="${options.accent}" stroke-width="10" stroke-linecap="round"/>
      <path d="M520 315 C560 268, 640 268, 680 315" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="3" stroke-dasharray="8 10"/>
      <text x="88" y="132" fill="#F5F5F5" font-size="44" font-family="Inter, Arial, sans-serif" font-weight="700">${escape(options.title)}</text>
      <text x="88" y="178" fill="rgba(255,255,255,0.76)" font-size="24" font-family="Inter, Arial, sans-serif">${escape(options.subtitle)}</text>
      <text x="88" y="814" fill="rgba(255,255,255,0.56)" font-size="18" font-family="Inter, Arial, sans-serif">Seeded from backend auth fixture</text>
    </svg>
  `.trim();
}

async function ensureSeededWorkspace(
  env: ApiEnv,
  auth: AuthContext,
  project: ProjectRow,
  account: LocalDevAccountDefinition | null,
) {
  if (!account) {
    return;
  }

  const existingDesign = await queryFirst<{ id: string }>(
    env.SKYGEMS_DB,
    `SELECT id
     FROM designs
     WHERE tenant_id = ? AND project_id = ?
     LIMIT 1`,
    [auth.tenantId, project.id],
  );

  if (existingDesign) {
    return;
  }

  let selectedDesignId: string | null = null;

  for (const prompt of account.prompts) {
    const designId = generatePrefixedId("dsn");
    const generationId = generatePrefixedId("gen");
    const pairId = generatePrefixedId("pair");
    const sketchArtifactId = generatePrefixedId("art");
    const renderArtifactId = generatePrefixedId("art");
    const timestamp = nowIso();

    const sketchSvg = buildSeedPlaceholderSvg({
      title: `${prompt.placeholderTitle} Sketch`,
      subtitle: prompt.promptSummary,
      accent: prompt.accent,
      background: prompt.background,
    });
    const renderSvg = buildSeedPlaceholderSvg({
      title: `${prompt.placeholderTitle} Render`,
      subtitle: prompt.promptSummary,
      accent: prompt.accent,
      background: prompt.background,
    });

    const sketchBytes = new TextEncoder().encode(sketchSvg);
    const renderBytes = new TextEncoder().encode(renderSvg);

    const sketchR2Key = buildArtifactR2Key("pair_sketch_png", {
      tenantId: auth.tenantId,
      projectId: project.id,
      designId,
      pairId,
    });
    const renderR2Key = buildArtifactR2Key("pair_render_png", {
      tenantId: auth.tenantId,
      projectId: project.id,
      designId,
      pairId,
    });

    await env.SKYGEMS_ARTIFACTS.put(sketchR2Key, sketchBytes, {
      httpMetadata: { contentType: "image/svg+xml" },
      customMetadata: { tenantId: auth.tenantId, projectId: project.id, designId, artifactId: sketchArtifactId },
    });
    await env.SKYGEMS_ARTIFACTS.put(renderR2Key, renderBytes, {
      httpMetadata: { contentType: "image/svg+xml" },
      customMetadata: { tenantId: auth.tenantId, projectId: project.id, designId, artifactId: renderArtifactId },
    });

    await executeStatement(
      env.SKYGEMS_DB,
      `INSERT INTO designs (
         id, tenant_id, project_id, created_by_user_id, parent_design_id, source_kind, selection_state,
         display_name, prompt_summary, prompt_input_json, design_dna_json,
         latest_pair_id, latest_spec_id, latest_technical_sheet_id, latest_svg_asset_id, latest_cad_job_id,
         latest_workflow_run_id, search_text, created_at, selected_at, updated_at, archived_at
       ) VALUES (?, ?, ?, ?, NULL, 'create', ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, NULL)`,
      [
        designId,
        auth.tenantId,
        project.id,
        auth.userId,
        prompt.selectionState,
        buildDesignDisplayName(prompt.designDna),
        buildPromptSummary(buildSeedPromptInput(prompt.designDna, prompt.promptSummary)),
        JSON.stringify(buildSeedPromptInput(prompt.designDna, prompt.promptSummary)),
        JSON.stringify(prompt.designDna),
        [
          prompt.designDna.jewelryType,
          prompt.designDna.metal,
          prompt.designDna.style,
          ...prompt.designDna.gemstones,
          prompt.promptSummary,
        ].join(" ").toLowerCase(),
        timestamp,
        prompt.selectionState === "selected" ? timestamp : null,
        timestamp,
      ],
    );

    await executeStatement(
      env.SKYGEMS_DB,
      `INSERT INTO generations (
         id, tenant_id, project_id, design_id, requested_by_user_id, base_design_id, request_kind, status,
         pair_standard_version, request_json, request_hash, idempotency_key, prompt_agent_output_json,
         error_code, error_message, created_at, started_at, completed_at, updated_at, execution_mode, execution_source
       ) VALUES (?, ?, ?, ?, ?, NULL, 'create', 'succeeded', 'pair_v1', ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, 'local', 'local_development')`,
      [
        generationId,
        auth.tenantId,
        project.id,
        designId,
        auth.userId,
        JSON.stringify(buildSeedPromptInput(prompt.designDna, prompt.promptSummary)),
        await sha256Hex(new TextEncoder().encode(`${auth.userId}:${designId}:${prompt.promptSummary}`)),
        `seed-${account.username}-${designId}`,
        timestamp,
        timestamp,
        timestamp,
        timestamp,
      ],
    );

    await executeStatement(
      env.SKYGEMS_DB,
      `INSERT INTO artifacts (
         id, tenant_id, project_id, design_id, producer_type, artifact_kind, r2_key,
         file_name, content_type, byte_size, sha256, created_at
       ) VALUES (?, ?, ?, ?, 'generation_pair', 'pair_sketch_png', ?, ?, ?, ?, ?, ?)`,
      [
        sketchArtifactId,
        auth.tenantId,
        project.id,
        designId,
        sketchR2Key,
        `${account.username}-${designId}-sketch.svg`,
        "image/svg+xml",
        sketchBytes.byteLength,
        await sha256Hex(sketchBytes),
        timestamp,
      ],
    );

    await executeStatement(
      env.SKYGEMS_DB,
      `INSERT INTO artifacts (
         id, tenant_id, project_id, design_id, producer_type, artifact_kind, r2_key,
         file_name, content_type, byte_size, sha256, created_at
       ) VALUES (?, ?, ?, ?, 'generation_pair', 'pair_render_png', ?, ?, ?, ?, ?, ?)`,
      [
        renderArtifactId,
        auth.tenantId,
        project.id,
        designId,
        renderR2Key,
        `${account.username}-${designId}-render.svg`,
        "image/svg+xml",
        renderBytes.byteLength,
        await sha256Hex(renderBytes),
        timestamp,
      ],
    );

    await executeStatement(
      env.SKYGEMS_DB,
      `INSERT INTO generation_pairs (
         id, tenant_id, project_id, design_id, generation_id, pair_standard_version,
         sketch_artifact_id, render_artifact_id, pair_manifest_json, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'pair_v1', ?, ?, ?, ?, ?)`,
      [
        pairId,
        auth.tenantId,
        project.id,
        designId,
        generationId,
        sketchArtifactId,
        renderArtifactId,
        JSON.stringify({
          seeded: true,
          account: account.username,
          promptSummary: prompt.promptSummary,
        }),
        timestamp,
        timestamp,
      ],
    );

    await executeStatement(
      env.SKYGEMS_DB,
      `UPDATE designs
       SET latest_pair_id = ?, updated_at = ?, selected_at = CASE WHEN ? = 'selected' THEN ? ELSE selected_at END
       WHERE id = ? AND tenant_id = ?`,
      [pairId, timestamp, prompt.selectionState, timestamp, designId, auth.tenantId],
    );

    if (prompt.selectionState === "selected") {
      selectedDesignId = designId;
    }
  }

  if (selectedDesignId) {
    await executeStatement(
      env.SKYGEMS_DB,
      `UPDATE projects
       SET selected_design_id = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [selectedDesignId, nowIso(), project.id, auth.tenantId],
    );
  }
}

export function resolveLocalDevAccount(
  username: string,
  password: string,
): LocalDevAccountDefinition | null {
  const normalizedUsername = username.trim().toLowerCase();
  const account = LOCAL_DEV_ACCOUNTS[normalizedUsername];
  if (!account || account.password !== password) {
    return null;
  }

  return account;
}

export async function ensureDevBootstrap(
  env: ApiEnv,
  request: DevBootstrapRequest,
): Promise<{
  auth: AuthContext;
  sessionToken: string;
  sessionExpiresAt: string;
  project: ProjectRow;
  created: {
    tenant: boolean;
    user: boolean;
    project: boolean;
    membership: boolean;
  };
}> {
  const defaults = resolveBootstrapDefaults(env);
  const mergedRequest = {
    tenantSlug: request.tenantSlug ?? defaults.tenantSlug,
    tenantName: request.tenantName ?? defaults.tenantName,
    email: request.email ?? defaults.email,
    displayName: request.displayName ?? defaults.displayName,
    projectName: request.projectName ?? defaults.projectName,
    projectDescription:
      request.projectDescription ?? defaults.projectDescription,
  };
  const normalizedRequest = DevBootstrapRequestSchema.parse(mergedRequest);
  const tenantSlug = slugify(normalizedRequest.tenantSlug ?? defaults.tenantSlug);
  const bootstrapEmail = (normalizedRequest.email ?? defaults.email).toLowerCase();
  const authSubject = `dev:${tenantSlug}:${bootstrapEmail}`;

  const ensured = await ensureTenantAndUser(env.SKYGEMS_DB, {
    authMode: "dev_bootstrap",
    tenantSlug,
    tenantName: normalizedRequest.tenantName ?? defaults.tenantName,
    authSubject,
    email: bootstrapEmail,
    displayName: normalizedRequest.displayName ?? defaults.displayName ?? null,
    role: "owner",
    permissions: [
      "prompt-preview:create",
      "design:create",
      "project:bootstrap",
      "project:read",
    ],
  });

  const existingProject = await queryFirst<ProjectRow>(
    env.SKYGEMS_DB,
    `SELECT id, tenant_id, created_by_user_id, name, description, status, created_at, updated_at
     FROM projects
     WHERE tenant_id = ? AND created_by_user_id = ? AND name = ?
     ORDER BY created_at ASC
     LIMIT 1`,
    [ensured.auth.tenantId, ensured.auth.userId, normalizedRequest.projectName ?? defaults.projectName],
  );

  const timestamp = nowIso();
  const project =
    existingProject ??
    {
      id: generatePrefixedId("prj"),
      tenant_id: ensured.auth.tenantId,
      created_by_user_id: ensured.auth.userId,
      name: normalizedRequest.projectName ?? defaults.projectName,
      description: normalizedRequest.projectDescription ?? defaults.projectDescription ?? null,
      status: "active" as const,
      created_at: timestamp,
      updated_at: timestamp,
    };

  if (!existingProject) {
    await executeStatement(
      env.SKYGEMS_DB,
      `INSERT INTO projects (
         id, tenant_id, created_by_user_id, name, description, status, selected_design_id, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'active', NULL, ?, ?)`,
      [
        project.id,
        project.tenant_id,
        project.created_by_user_id,
        project.name,
        project.description,
        project.created_at,
        project.updated_at,
      ],
    );
  }

  const existingMembership = await queryFirst<{ role: string }>(
    env.SKYGEMS_DB,
    `SELECT role
     FROM project_memberships
     WHERE project_id = ? AND user_id = ?`,
    [project.id, ensured.auth.userId],
  );

  if (!existingMembership) {
    await executeStatement(
      env.SKYGEMS_DB,
      `INSERT INTO project_memberships (project_id, user_id, role, created_at)
       VALUES (?, ?, 'owner', ?)`,
      [project.id, ensured.auth.userId, timestamp],
    );
  }

  const session = await issueDevBootstrapSession(ensured.auth, env, {
    allowLocalFallback: true,
  });

  const localAccount = Object.values(LOCAL_DEV_ACCOUNTS).find((account) => account.email === bootstrapEmail) ?? null;
  await ensureSeededWorkspace(env, ensured.auth, project, localAccount);

  return {
    auth: ensured.auth,
    sessionToken: session.token,
    sessionExpiresAt: session.expiresAt,
    project,
    created: {
      tenant: ensured.createdTenant,
      user: ensured.createdUser,
      project: !existingProject,
      membership: !existingMembership,
    },
  };
}
