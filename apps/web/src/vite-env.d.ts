/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_API_MODE?: "live" | "stub";
  readonly VITE_DEV_PROJECT_ID?: string;
  readonly VITE_SKYGEMS_TENANT_ID?: string;
  readonly VITE_SKYGEMS_USER_ID?: string;
  readonly VITE_SKYGEMS_AUTH_SUBJECT?: string;
  readonly VITE_SKYGEMS_USER_EMAIL?: string;
  readonly VITE_SKYGEMS_TENANT_NAME?: string;
  readonly VITE_SKYGEMS_TENANT_SLUG?: string;
  readonly VITE_SKYGEMS_USER_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
