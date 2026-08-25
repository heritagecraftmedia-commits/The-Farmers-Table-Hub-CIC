// Vite client type declarations for import.meta.env
interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_DEV_AUTO_LOGIN: string;
    readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
    readonly VITE_STRIPE_PRICE_SUPPORTER: string;
    readonly VITE_STRIPE_PRICE_FEATURED: string;
    readonly VITE_DISCORD_SERVER_ID: string;
    readonly VITE_LIVE365_PLAYER_URL: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    [key: string]: string | boolean | undefined;
}
