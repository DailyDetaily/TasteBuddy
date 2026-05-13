/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_PUBLIC_MEDIA_BASE_URL?: string;
    readonly VITE_R2_PUBLIC_MEDIA_BASE_URL?: string;
    readonly VITE_SUPABASE_PUBLIC_ASSET_BUCKET?: string;
    readonly VITE_SUPABASE_USE_ANONYMOUS_AUTH?: 'true' | 'false';
    readonly VITE_GA_MEASUREMENT_ID?: string;
    readonly VITE_GA_MEASUREMENT_ID_LOCAL?: string;
    readonly VITE_CLARITY_PROJECT_ID?: string;
    readonly VITE_CLARITY_PROJECT_ID_LOCAL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.png" {
    const value: string;
    export default value;
}
