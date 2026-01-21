import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Note: In a real production app, you should proxy requests through a backend
// to avoid exposing the API key if it's not strictly restricted.
// Here we assume a valid key is present in process.env.API_KEY.
const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const suggestEmoji = async (text: string): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API Key not found. Returning default emoji.");
    return "🔗";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest exactly one single emoji that best represents this link title or concept: "${text}". 
      Do not include any text, explanation, or punctuation. Just the emoji. 
      If unsure, return 🔗.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for speed
        temperature: 0.8,
        maxOutputTokens: 5,
      }
    });

    const emoji = response.text?.trim();
    return emoji || "🔗";
  } catch (error) {
    console.error("Error generating emoji with Gemini:", error);
    return "✨";
  }
};