/**
 * Supabase Edge Function: directory-outreach
 *
 * HUMAN-IN-THE-LOOP: this function never decides who to email.
 *
 * It sends only when ALL of these hold:
 *   0. system_controls.outreach_enabled is true and maintenance_mode is false
 *      (the global kill switch, re-checked server-side so it cannot be
 *      bypassed by calling the function directly),
 *   1. the caller passed the listing id explicitly in `listingIds`, and
 *   2. an admin has already set outreach_approved = true on that row
 *      (recorded with outreach_approved_by / outreach_approved_at).
 *
 * Rows that are opted out, already contacted, or not approved are skipped and
 * reported back, never silently emailed. MAX_BATCH caps a single run.
 *
 * This replaces the previous behaviour, where one POST emailed every row with
 * outreach_status = 'not_contacted' — 146+ real UK businesses seeded by
 * 20260317_seed_directory_listings.sql — with no per-recipient approval.
 *
 * For each eligible listing:
 *   1. Sends personalised outreach email via Gmail SMTP
 *   2. Updates outreach_status = 'contacted' and outreach_date = NOW()
 *   3. Creates a HubSpot contact record
 *
 * Required Supabase secrets (set via: supabase secrets set KEY=value):
 *   GMAIL_USER          – sender address, e.g. heritagecraftmedia@gmail.com
 *   GMAIL_APP_PASSWORD  – Google App Password (not your regular Gmail password)
 *   HUBSPOT_API_KEY     – HubSpot Private App token (optional — skipped if absent)
 *
 * Supabase injects automatically (no setup needed):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer';

const APP_URL = 'https://the-farmers-table-hub-cic.vercel.app';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Largest number of emails one invocation will send. Keeps a mistake small and
// stays well inside Gmail SMTP's sending limits.
const MAX_BATCH = 25;

const CORS = {
  'Access-Control-Allow-Origin': APP_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

// ── Email template ─────────────────────────────────────────────────────────

function emailText(businessName: string, claimUrl: string): string {
  return `Hi — Team at ${businessName},

I hope this finds you well.

I'm Scott Andrew, founder of The Farmers Table Hub CIC — a community directory connecting food producers, growers, and makers across the UK with local buyers, restaurants, and food lovers.

I've added ${businessName} to our free directory at ${APP_URL}/directory

Your listing currently shows your business name, category, and location. It's completely free and there's no catch.

I'm getting in touch for three reasons:

1. To let you know your listing exists
2. To invite you to claim it and add your full details — description, website, photos, contact info
3. To give you the option to remove it if you'd prefer not to be listed

To claim your listing or request removal, visit:
${claimUrl}

Or simply reply to this email.

If you'd like more visibility, we also offer a Featured listing (£15/month) which puts your business at the top of the directory with a highlighted profile, a link to your website, and inclusion in our weekly community newsletter.

Either way, no pressure at all — this is a community project and we only want businesses here that want to be here.

Warm regards,
Scott Andrew
Founder, The Farmers Table Hub CIC
heritagecraftmedia@gmail.com
${APP_URL}

---
You are receiving this once because ${businessName} is listed in our free
public directory. To have the listing removed and receive no further email,
visit ${claimUrl} or reply with "remove".`;
}

function emailHtml(businessName: string, claimUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;background:#faf9f6;">
  <div style="margin-bottom:32px;">
    <p style="color:#6b7c4a;font-weight:bold;letter-spacing:0.1em;font-size:12px;text-transform:uppercase;margin:0;">The Farmers Table Hub CIC</p>
  </div>
  <p>Hi — Team at <strong>${businessName}</strong>,</p>
  <p>I hope this finds you well.</p>
  <p>I'm Scott Andrew, founder of The Farmers Table Hub CIC — a community directory connecting food producers, growers, and makers across the UK with local buyers, restaurants, and food lovers.</p>
  <p>I've added <strong>${businessName}</strong> to our free directory at <a href="${APP_URL}/directory" style="color:#6b7c4a;">${APP_URL}/directory</a></p>
  <p>Your listing currently shows your business name, category, and location. It's completely free and there's no catch.</p>
  <p>I'm getting in touch for three reasons:</p>
  <ol>
    <li>To let you know your listing exists</li>
    <li>To invite you to claim it and add your full details — description, website, photos, contact info</li>
    <li>To give you the option to remove it if you'd prefer not to be listed</li>
  </ol>
  <div style="margin:32px 0;">
    <a href="${claimUrl}" style="background:#6b7c4a;color:white;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block;">
      Claim your listing
    </a>
  </div>
  <p style="color:#666;font-size:14px;">Or simply reply to this email.</p>
  <p>If you'd like more visibility, we also offer a Featured listing (£15/month) which puts your business at the top of the directory with a highlighted profile, a link to your website, and inclusion in our weekly community newsletter.</p>
  <p>Either way, no pressure at all — this is a community project and we only want businesses here that want to be here.</p>
  <hr style="border:none;border-top:1px solid #e5e0d8;margin:32px 0;" />
  <p style="font-size:13px;color:#888;">
    <strong>Scott Andrew</strong><br/>
    Founder, The Farmers Table Hub CIC<br/>
    heritagecraftmedia@gmail.com<br/>
    <a href="${APP_URL}" style="color:#6b7c4a;">${APP_URL}</a>
  </p>
  <p style="font-size:12px;color:#999;">
    You are receiving this once because <strong>${businessName}</strong> is listed in our free public
    directory. To have the listing removed and receive no further email,
    <a href="${claimUrl}" style="color:#999;">use this link</a> or reply with &quot;remove&quot;.
  </p>
</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    // Identify the caller from their own session token.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    // Admin client for DB reads/writes.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Authorise against the profiles table, NOT user_metadata. user_metadata
    // is client-writable — any signed-up user could previously set
    // { role: 'founder' } on themselves and invoke this function, sending mail
    // from the founder's own Gmail account to every seeded business.
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !(profile.is_admin || profile.role === 'founder')) {
      return json({ error: 'Forbidden — admin role required' }, 403);
    }

    // GATE 0 — the global kill switch. The dashboard toggle writes
    // system_controls.outreach_enabled; checking it only in the browser would
    // make it advisory, so it is re-checked here where it cannot be bypassed.
    // maintenance_mode disables outreach regardless.
    const { data: controls } = await admin
      .from('system_controls')
      .select('key, value')
      .in('key', ['outreach_enabled', 'maintenance_mode']);

    const control = new Map((controls ?? []).map(r => [r.key, Boolean(r.value)]));
    // A missing row fails closed: absent config must not mean "allowed to send".
    if (control.get('outreach_enabled') !== true) {
      return json({ error: 'Outreach is switched off in Settings (outreach_enabled).' }, 409);
    }
    if (control.get('maintenance_mode') === true) {
      return json({ error: 'Maintenance mode is on. Outreach is disabled.' }, 409);
    }

    // GATE 1 — the caller must name the recipients explicitly. There is no
    // "send to everyone" path.
    let body: { listingIds?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Expected a JSON body: { "listingIds": ["uuid", ...] }' }, 400);
    }

    const listingIds = Array.isArray(body.listingIds)
      ? body.listingIds.filter((v): v is string => typeof v === 'string')
      : [];

    if (listingIds.length === 0) {
      return json({
        error: 'listingIds is required. This function will not send to an unnamed set of recipients.',
      }, 400);
    }
    if (listingIds.length > MAX_BATCH) {
      return json({ error: `Too many recipients in one run (max ${MAX_BATCH}).` }, 400);
    }

    // GATE 2 — every named row must already carry a human approval, must not
    // have been contacted, and must not have opted out.
    const { data: rows, error: dbError } = await admin
      .from('directory_listings')
      .select('id, name, contact_email, category, location, outreach_status, outreach_approved, outreach_opted_out')
      .in('id', listingIds);

    if (dbError) throw new Error(`DB query failed: ${dbError.message}`);

    const skippedReasons: Record<string, string> = {};
    const eligible = (rows ?? []).filter(r => {
      if (r.outreach_opted_out) { skippedReasons[r.id] = 'opted out'; return false; }
      if (!r.outreach_approved) { skippedReasons[r.id] = 'not approved by an admin'; return false; }
      if (r.outreach_status !== 'not_contacted') { skippedReasons[r.id] = `already ${r.outreach_status}`; return false; }
      if (!r.contact_email || !EMAIL_REGEX.test(r.contact_email)) { skippedReasons[r.id] = 'no valid email'; return false; }
      return true;
    });

    for (const id of listingIds) {
      if (!(rows ?? []).some(r => r.id === id)) skippedReasons[id] = 'not found';
    }

    if (eligible.length === 0) {
      return json({
        sent: 0,
        skipped: Object.keys(skippedReasons).length,
        skippedReasons,
        errors: [],
        message: 'Nothing to send. Approve listings for outreach first.',
      });
    }

    // Gmail transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: Deno.env.get('GMAIL_USER'),
        pass: Deno.env.get('GMAIL_APP_PASSWORD'),
      },
    });

    const hubspotToken = Deno.env.get('HUBSPOT_API_KEY');
    const results = {
      sent: 0,
      skipped: Object.keys(skippedReasons).length,
      skippedReasons,
      errors: [] as string[],
    };

    for (const listing of eligible) {
      const claimUrl = `${APP_URL}/claim/${listing.id}`;

      try {
        // 1. Send email
        await transporter.sendMail({
          from: `"Scott Andrew — Farmers Table Hub" <${Deno.env.get('GMAIL_USER')}>`,
          to: listing.contact_email,
          subject: 'Your free listing on The Farmers Table Hub directory',
          text: emailText(listing.name, claimUrl),
          html: emailHtml(listing.name, claimUrl),
        });

        // 2. Mark as contacted
        await admin
          .from('directory_listings')
          .update({ outreach_status: 'contacted', outreach_date: new Date().toISOString() })
          .eq('id', listing.id);

        // 3. Create HubSpot contact (optional)
        if (hubspotToken) {
          const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${hubspotToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              properties: {
                email: listing.contact_email,
                company: listing.name,
                lifecyclestage: 'lead',
                hs_lead_source: 'FTH Directory Outreach',
              },
            }),
          });
          if (!hsRes.ok && hsRes.status !== 409) {
            // 409 = contact already exists — not an error
            console.warn(`HubSpot: ${listing.name} — ${hsRes.status}`);
          }
        }

        results.sent++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`${listing.name}: ${msg}`);
        results.skipped++;
      }
    }

    return json(results);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});
