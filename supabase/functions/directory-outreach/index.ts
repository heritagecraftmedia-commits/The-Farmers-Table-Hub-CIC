/**
 * Supabase Edge Function: directory-outreach
 *
 * Triggered manually from the founder dashboard (or via POST webhook).
 * For each directory_listings row with a valid email and outreach_status = 'not_contacted':
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

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer';

const APP_URL = 'https://the-farmers-table-hub-cic.vercel.app';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
${APP_URL}`;
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
</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    // Verify caller is a founder via their session token
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user || user.user_metadata?.role !== 'founder') {
      return json({ error: 'Forbidden — founder role required' }, 403);
    }

    // Admin client for DB writes
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch eligible listings
    const { data: rows, error: dbError } = await admin
      .from('directory_listings')
      .select('id, vendor_name, email, craft_category, location')
      .not('email', 'is', null)
      .neq('email', '')
      .eq('outreach_status', 'not_contacted');

    if (dbError) throw new Error(`DB query failed: ${dbError.message}`);

    const eligible = (rows ?? []).filter(r => EMAIL_REGEX.test(r.email));
    if (eligible.length === 0) {
      return json({ sent: 0, skipped: 0, errors: [], message: 'No eligible listings found.' });
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
    const results = { sent: 0, skipped: 0, errors: [] as string[] };

    for (const listing of eligible) {
      const claimUrl = `${APP_URL}/claim/${listing.id}`;

      try {
        // 1. Send email
        await transporter.sendMail({
          from: `"Scott Andrew — Farmers Table Hub" <${Deno.env.get('GMAIL_USER')}>`,
          to: listing.email,
          subject: 'Your free listing on The Farmers Table Hub directory',
          text: emailText(listing.vendor_name, claimUrl),
          html: emailHtml(listing.vendor_name, claimUrl),
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
                email: listing.email,
                company: listing.vendor_name,
                lifecyclestage: 'lead',
                hs_lead_source: 'FTH Directory Outreach',
              },
            }),
          });
          if (!hsRes.ok && hsRes.status !== 409) {
            // 409 = contact already exists — not an error
            console.warn(`HubSpot: ${listing.vendor_name} — ${hsRes.status}`);
          }
        }

        results.sent++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`${listing.vendor_name}: ${msg}`);
        results.skipped++;
      }
    }

    return json(results);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});
