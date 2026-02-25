import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// ── Community Content Generator ──
export const generateCommunityContent = async () => {
  const prompt = `
    Generate the following content for "The Farmers Table Hub CIC", a community interest company in Farnham that connects local food producers with consumers and runs a community radio station. 
    The founder is a stroke survivor, so the tone should be warm, inclusive, and clear.
    
    1. Three sample event descriptions (e.g., Farmers Market, Radio Workshop, Cooking Demo).
    2. A welcome message template for new community members.
    3. Five blog post ideas related to community engagement and local events.
    
    Return the result in a structured JSON format with the following keys:
    - events: Array of { title: string, description: string, date: string }
    - welcomeMessage: string
    - blogIdeas: Array of { title: string, summary: string }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating content:", error);
    return null;
  }
};

// ── DISCOVERY AGENT ──
// Finds potential artisan makers from public information
export const runDiscoverySearch = async (
  location: string,
  craftCategory: string
): Promise<{ displayName: string; bioText: string; locationHint: string; categoryHint: string; sourcePlatform: string; profileUrl: string; discoveryReason: string }[]> => {
  const prompt = `You are an Artisan Discovery Agent for The Farmers Table Hub CIC in Farnham, Surrey.

Your task is to suggest potential local artisans and makers who might be a good fit for a community craft directory.

Search parameters:
- Location: "${location}"
- Craft category: "${craftCategory}"

RULES:
- Only suggest fictional but realistic example profiles (do NOT return real people's data)
- Each profile should feel like a real artisan maker with evidence of handmade process
- Include a short "discoveryReason" explaining WHY they appear genuine
- Exclude: dropshippers, mass-produced brands, courses-only creators, resellers
- Use "Example" somewhere in the display name to make it clear these are illustrative

Return exactly 5 profiles as a JSON array with these fields:
[{
  "displayName": string,
  "bioText": string (2-3 sentences about their craft),
  "locationHint": string (town, county),
  "categoryHint": string,
  "sourcePlatform": "Instagram" | "YouTube" | "Website" | "Market" | "Referral",
  "profileUrl": string (plausible example URL),
  "discoveryReason": string (one sentence: why they look like a genuine maker)
}]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Discovery Agent error:", error);
    return [];
  }
};

// ── QUALIFICATION AGENT ──
// Scores a lead 1-5 on artisan authenticity
export const qualifyArtisan = async (
  name: string,
  bio: string,
  platform: string
): Promise<{ artisanScore: number; qualificationNotes: string; qualified: boolean }> => {
  const prompt = `You are an Artisan Qualification Agent.

Review this profile and decide whether this person is a genuine craft maker.

Profile:
- Name: "${name}"
- Bio: "${bio}"
- Platform: "${platform}"

Score from 1–5 based on:
1 = Not a maker (reseller, dropshipper, mass producer)
2 = Unlikely maker (unclear evidence)
3 = Possible artisan (some indicators)
4 = Likely artisan (strong indicators)
5 = Clearly demonstrated craft practice (tools, process, workshop visible)

Indicators of a genuine maker:
- Mentions of making, forging, weaving, sewing, turning, firing
- Workshop or studio context
- Tools and materials referenced
- Process content / making videos
- Small batch language
- Attends markets or fairs

Return JSON: { "artisanScore": number, "qualificationNotes": string (2-3 sentences), "qualified": boolean }
If uncertain, score conservatively. qualified = true only if score >= 3.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || '{"artisanScore":1,"qualificationNotes":"Unable to assess","qualified":false}');
  } catch (error) {
    console.error("Qualification Agent error:", error);
    return { artisanScore: 1, qualificationNotes: "Error during qualification", qualified: false };
  }
};

// ── ENRICHMENT AGENT ──
// Creates a draft directory listing from raw profile info
export const enrichArtisanProfile = async (rawBio: string, name: string): Promise<string> => {
  const prompt = `You are a copywriter for The Farmers Table Hub CIC.
Write a warm, respectful draft directory listing bio based on this information:

Name: ${name}
Bio: ${rawBio}

RULES:
- Business info only, no private personal data
- Keep under 80 words
- Focus on their craft and community connection
- Mark as DRAFT quality (can be improved later)
- Do not claim endorsements or exaggerate experience
- Tone: human, non-salesy, craft-respecting

Return plain text only.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text?.trim() || rawBio;
  } catch (error) {
    console.error("Enrichment Agent error:", error);
    return rawBio;
  }
};

// ── OUTREACH AGENT ──
// Drafts a friendly opt-in invitation message (NEVER auto-sends)
export const draftOutreachMessage = async (
  vendorName: string,
  craftCategory: string,
  location: string
): Promise<string> => {
  const prompt = `You are an Artisan Outreach Drafting Agent for The Farmers Table Hub CIC.

Write a short, respectful invitation message for a maker to join the community craft directory.

Maker details:
- Name: "${vendorName}"
- Craft: "${craftCategory}"
- Area: "${location}"

RULES:
- Opt-in only, no pressure
- No marketing claims or urgency language
- Mention they were found via publicly shared work
- Clear that the listing is free and optional
- Community-led tone
- Include a placeholder {{CLAIM_LINK}} where the claim URL would go
- Keep under 120 words

Return the message text only. No subject line.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text?.trim() || `Hello ${vendorName}, we'd love to invite you to join The Farmers Table Hub CIC directory. It's free, optional, and celebrates local makers. Visit {{CLAIM_LINK}} to learn more.`;
  } catch (error) {
    console.error("Outreach Agent error:", error);
    return `Hello ${vendorName}, we'd love to invite you to join The Farmers Table Hub CIC directory. It's free, optional, and celebrates local makers. Visit {{CLAIM_LINK}} to learn more.`;
  }
};
