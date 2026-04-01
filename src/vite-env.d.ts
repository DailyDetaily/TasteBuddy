/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_SUPABASE_USE_ANONYMOUS_AUTH?: 'true' | 'false';
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.png" {
    const value: string;
    export default value;
}
