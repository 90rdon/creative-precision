import { GoogleGenAI, GenerateContentResponse, Chat, Modality } from "@google/genai";
import { AppConfig, Message } from "../types";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

export const createChatSession = (config: AppConfig): Chat => {
  const ai = getClient();
  return ai.chats.create({
    model: config.modelName,
    config: {
      systemInstruction: config.systemInstruction,
      temperature: 0.7, // Balanced for creativity and focus
    },
  });
};

export const generateResults = async (history: Message[]): Promise<string> => {
  const ai = getClient();

  // Compile history into a transcript string
  const transcript = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

  const prompt = `
    Analyze the following conversation transcript between an Executive and a Strategic Thought Partner.
    
    TRANSCRIPT:
    ${transcript}
    
    INSTRUCTIONS:
    Return a JSON object (and ONLY a JSON object) with the following keys:
    - summary: (string) A deep reflection of their situation.
    - pattern: (string) The structural pattern or circular dependency identified.
    - strategicQuestion: (string) A provocative question for their leadership.
    - recommendation: (string) A relevant resource suggestion.
    
    Ensure the tone is senior, sophisticated, and non-salesy.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  return response.text || "{}";
};

export const generateSpeech = async (text: string, retries = 3, delay = 1000): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' offers a warm, natural tone
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error: any) {
    const errorString = JSON.stringify(error);
    const isRateLimit = errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED");

    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit for TTS. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateSpeech(text, retries - 1, delay * 2);
    }

    console.error("Error generating speech:", error);
    return "";
  }
};
