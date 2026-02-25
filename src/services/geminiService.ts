import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

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
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating content:", error);
    return null;
  }
};

export const discoverLocalArtisans = async (searchQuery: string): Promise<{ displayName: string; bioText: string; locationHint: string; categoryHint: string; sourcePlatform: string; profileUrl: string }[]> => {
  const prompt = `
    You are an ethical AI research assistant for The Farmers Table Hub CIC in Farnham, Surrey.
    Your job is to suggest potential local artisans and makers who might be a good fit for the directory.
    IMPORTANT: Only suggest fictional example profiles. Do NOT scrape or invent real people's data.
    
    Search query: "${searchQuery}"
    
    Return 3 example artisan profiles that match this query in JSON format:
    Array of { displayName: string, bioText: string, locationHint: string, categoryHint: string, sourcePlatform: string, profileUrl: string }
    
    Use "Example" as part of the display name to make it clear these are illustrative.
    Set profileUrl to a plausible but clearly example URL.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error discovering artisans:", error);
    return [];
  }
};

export const enrichArtisanProfile = async (rawBio: string, name: string): Promise<string> => {
  const prompt = `
    You are a copywriter for The Farmers Table Hub CIC. 
    Write a warm, 2-sentence maker profile summary for the directory based on this information:
    Name: ${name}
    Bio: ${rawBio}
    
    Keep it under 60 words. Focus on their craft and community connection.
    Return plain text only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text?.trim() || rawBio;
  } catch (error) {
    console.error("Error enriching profile:", error);
    return rawBio;
  }
};
