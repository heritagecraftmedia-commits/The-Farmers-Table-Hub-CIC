// Vite client type declarations for import.meta.env
interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_GEMINI_API_KEY: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    [key: string]: string | boolean | undefined;
}
