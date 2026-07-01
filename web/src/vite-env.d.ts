/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_TEST_ROUTES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_GIT_COMMIT__: string
