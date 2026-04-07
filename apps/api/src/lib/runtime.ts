import {
  SKYGEMS_PROMPT_PACK_VERSION,
  type GenerateExecutionMode,
  type GenerateExecutionSource,
  type PromptPreviewProvider,
} from "@skygems/shared";

export type ApiEnv = Env & {
  SKYGEMS_DEV_BOOTSTRAP_TENANT_SLUG?: string;
  SKYGEMS_DEV_BOOTSTRAP_TENANT_NAME?: string;
  SKYGEMS_DEV_BOOTSTRAP_EMAIL?: string;
  SKYGEMS_DEV_BOOTSTRAP_DISPLAY_NAME?: string;
  SKYGEMS_DEV_BOOTSTRAP_PROJECT_NAME?: string;
  SKYGEMS_DEV_BOOTSTRAP_PROJECT_DESCRIPTION?: string;
  SKYGEMS_GENERATE_EXECUTION_MODE?: string;
  XAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  DEV_BOOTSTRAP_SECRET?: string;
};

const promptProviders: PromptPreviewProvider[] = ["xai", "google"];

function parsePromptProvider(
  value: string | undefined,
  fallback: PromptPreviewProvider,
): PromptPreviewProvider {
  if (!value) {
    return fallback;
  }

  return promptProviders.includes(value as PromptPreviewProvider)
    ? (value as PromptPreviewProvider)
    : fallback;
}

export function isTruthyEnv(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function isLocalDevelopmentRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "127.0.0.1" || hostname === "localhost";
}

export function isDevBootstrapEnabled(request: Request, env: ApiEnv): boolean {
  return isLocalDevelopmentRequest(request) || isTruthyEnv(env.SKYGEMS_ENABLE_DEV_BOOTSTRAP);
}

export function resolveGenerateExecutionMode(
  request: Request,
  env: ApiEnv,
): {
  mode: GenerateExecutionMode;
  source: Exclude<GenerateExecutionSource, "queue_send_failed_fallback">;
} {
  const configured = env.SKYGEMS_GENERATE_EXECUTION_MODE?.trim().toLowerCase();

  if (configured === "local") {
    return {
      mode: "local",
      source: "configured_local",
    };
  }

  if (configured === "queue") {
    return {
      mode: "queue",
      source: "configured_queue",
    };
  }

  if (isLocalDevelopmentRequest(request)) {
    return {
      mode: "local",
      source: "local_development",
    };
  }

  return {
    mode: "queue",
    source: "default_auto",
  };
}

export function resolveAuth0Issuer(env: ApiEnv): string | null {
  const issuer = env.SKYGEMS_AUTH0_ISSUER?.trim();
  if (!issuer) {
    return null;
  }

  return issuer.endsWith("/") ? issuer : `${issuer}/`;
}

export function resolveClaimsNamespace(env: ApiEnv): string {
  const namespace = env.SKYGEMS_AUTH0_CLAIMS_NAMESPACE?.trim() || "https://gemstudio.ai/";
  return namespace.endsWith("/") ? namespace : `${namespace}/`;
}

export function resolvePromptProviderSelection(env: ApiEnv): {
  primary: PromptPreviewProvider;
  secondary: PromptPreviewProvider;
  active: PromptPreviewProvider;
  available: PromptPreviewProvider[];
  source: "configured_primary" | "configured_secondary" | "fallback_default";
  promptPackVersion: typeof SKYGEMS_PROMPT_PACK_VERSION;
} {
  const primary = parsePromptProvider(env.SKYGEMS_PROVIDER_PRIMARY, "xai");
  const secondary = parsePromptProvider(
    env.SKYGEMS_PROVIDER_SECONDARY,
    primary === "xai" ? "google" : "xai",
  );
  const available = promptProviders.filter((provider) =>
    provider === "xai" ? Boolean(env.XAI_API_KEY) : Boolean(env.GOOGLE_API_KEY),
  );

  if (available.includes(primary)) {
    return {
      primary,
      secondary,
      active: primary,
      available,
      source: "configured_primary",
      promptPackVersion: SKYGEMS_PROMPT_PACK_VERSION,
    };
  }

  if (available.includes(secondary)) {
    return {
      primary,
      secondary,
      active: secondary,
      available,
      source: "configured_secondary",
      promptPackVersion: SKYGEMS_PROMPT_PACK_VERSION,
    };
  }

  return {
    primary,
    secondary,
    active: primary,
    available,
    source: "fallback_default",
    promptPackVersion: SKYGEMS_PROMPT_PACK_VERSION,
  };
}
