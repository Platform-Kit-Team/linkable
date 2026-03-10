declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// ── PlatformKit build-time constants (injected via Vite `define`) ────
declare const __PK_EXTERNAL_COLLECTIONS__: string[] | undefined;
declare const __PK_CONTENT_COLLECTIONS__: import("./lib/layout-manifest").ContentCollectionDef[] | undefined;
declare const __PK_CMS_DATA_ENDPOINT__: string | undefined;
declare const __PK_CMS_PUSH_ENDPOINT__: string | undefined;
declare const __PK_CMS_UPLOAD_ENDPOINT__: string | undefined;
