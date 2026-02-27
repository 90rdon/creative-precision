import { GoogleGenAI, GenerateContentResponse, Chat, Modality, Type } from "@google/genai";
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
      temperature: 0.7,
    },
  });
};

export const generateResults = async (history: Message[]): Promise<string> => {
  const ai = getClient();

  const transcript = history.map(m => `${m.role === 'user' ? 'EXECUTIVE' : 'REFLECT'}: ${m.text}`).join('\n');

  const prompt = `
You are synthesizing the results of a strategic AI assessment conversation with a senior executive.

TRANSCRIPT:
${transcript}

INSTRUCTIONS:
Produce a JSON object with exactly these sections. This is the executive's strategic reflection — it must feel like a $50,000 insight, not a template.

1. "heres_what_im_hearing" — A personalized synthesis using THEIR exact words and phrases. Mirror their language back to them. This should feel like someone who truly listened. 2-3 paragraphs. Start with what they care about most, not what's easiest to summarize.

2. "pattern_worth_examining" — Name the structural pattern you see (give it a name — e.g., "The Proof-of-Concept Death Spiral" or "The Silent Middle Management Opt-Out"). Describe the pattern in 2-3 sentences. Do NOT explain the mechanism or prescribe a fix. Create curiosity — they should want to understand it deeper.

3. "question_to_sit_with" — Synthesize ONE provocative question from their specific answers. This is the highest-value deliverable. It should be the question they haven't asked themselves but need to. It should be uncomfortable in a productive way. Frame it so they'd want to share it with their leadership team. This must be specific to THEIR situation, not generic.

4. "the_close" — Three pathways, each 1-2 sentences:
   - "sit_with_it": Encourage them to take this reflection to their team. No urgency, no pitch.
   - "keep_thinking": Suggest following Creative Precision's thinking on LinkedIn for ongoing strategic perspective.
   - "real_conversation": Offer a peer conversation (not a sales call, not a demo). Frame: "If this reflection surfaced something worth exploring, we're happy to think alongside you." Include that the calendar link is below.

5. "template_recommendation" (optional) — Only return this if the conversation strongly matches one of these three specific frameworks. Do not invent new names.
   - Match name: "Governance Fabric" (tier: "governance") IF friction is structural or regulatory.
   - Match name: "Strategic Review" (tier: "strategy") IF ambition and vision are misaligned with baseline reality.
   - Match name: "Experimental Framework" (tier: "measurement") IF stuck in "pilot purgatory" without valid data loops.
   - Include "reason": one sentence on why this specific framework fits their situation.

TONE:
- Senior, sophisticated, direct. No corporate buzzwords.
- Write as a peer, not a vendor. No sales language anywhere.
- The "question_to_sit_with" should be the thing they screenshot and send to their CTO.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          heres_what_im_hearing: { type: Type.STRING },
          pattern_worth_examining: { type: Type.STRING },
          question_to_sit_with: { type: Type.STRING },
          the_close: {
            type: Type.OBJECT,
            properties: {
              sit_with_it: { type: Type.STRING },
              keep_thinking: { type: Type.STRING },
              real_conversation: { type: Type.STRING },
            },
            required: ['sit_with_it', 'keep_thinking', 'real_conversation'],
          },
          template_recommendation: {
            type: Type.OBJECT,
            properties: {
              tier: { type: Type.STRING },
              name: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ['tier', 'name', 'reason'],
          },
        },
        required: ['heres_what_im_hearing', 'pattern_worth_examining', 'question_to_sit_with', 'the_close'],
      },
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
            prebuiltVoiceConfig: { voiceName: 'Kore' },
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
