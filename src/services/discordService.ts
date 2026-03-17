/**
 * Discord service — The Farmers Table Hub CIC
 *
 * Security note: DISCORD_BOT_TOKEN is intentionally NOT prefixed with VITE_
 * and is therefore server-side only (Vercel env). It is never used here.
 *
 * Public server stats are fetched via the Discord Widget API, which requires:
 *  1. VITE_DISCORD_SERVER_ID set in env
 *  2. Widget enabled: Server Settings → Widget → Enable Server Widget
 *
 * The widget returns: server name, online member count, and an instant invite URL.
 */

const SERVER_ID = import.meta.env.VITE_DISCORD_SERVER_ID as string | undefined;
const WIDGET_URL = SERVER_ID && SERVER_ID !== 'placeholder'
  ? `https://discord.com/api/guilds/${SERVER_ID}/widget.json`
  : null;

export interface DiscordServerInfo {
  id: string;
  name: string;
  presenceCount: number;
  inviteUrl: string | null;
}

export interface DiscordChannel {
  name: string;
  description: string;
}

/**
 * Fetches live server stats via the public Discord Widget API.
 * Returns null if the server ID is not configured or the widget is disabled.
 */
export async function getServerInfo(): Promise<DiscordServerInfo | null> {
  if (!WIDGET_URL) return null;
  try {
    const res = await fetch(WIDGET_URL);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      presenceCount: data.presence_count ?? 0,
      inviteUrl: data.instant_invite ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the instant invite URL from the widget, or null if unavailable.
 * Also logs the invite to console — useful for wiring into a signup flow
 * until a transactional email service is configured.
 */
export async function getInviteLink(): Promise<string | null> {
  const info = await getServerInfo();
  if (info?.inviteUrl) {
    console.log('[FTH Discord] Invite link:', info.inviteUrl);
  }
  return info?.inviteUrl ?? null;
}

/**
 * Returns the static list of channels for the Farmers Table Network server.
 * Update this list if channels are added or renamed.
 */
export function getChannels(): DiscordChannel[] {
  return [
    { name: 'welcome',               description: 'Start here — introductions and community guidelines' },
    { name: 'growers-and-gardeners', description: 'Share tips, harvests, and growing stories' },
    { name: 'beekeepers',            description: 'All things bees — hive updates, honey talk, advice' },
    { name: 'makers-and-crafters',   description: 'Showcase your work and connect with fellow makers' },
    { name: 'general-chat',          description: 'Everything else — news, events, good vibes' },
  ];
}
