import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
      model: "gemini-3.1-pro-preview",
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
