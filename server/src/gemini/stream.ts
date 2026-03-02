import { GoogleGenAI, Type } from '@google/genai';
import { Socket } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { APP_CONFIG, getSynthesisPrompt } from './prompts';

let aiClient: GoogleGenAI | null = null;

export const getGeminiClient = () => {
    if (!aiClient) {
        // Explicitly prioritize GEMINI_API_KEY as per .env configuration
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY missing in server environment");

        console.log(`[Gemini] Initializing client with key: ${apiKey.substring(0, 10)}...`);
        aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
};

export const handleChatStream = async (socket: Socket, messages: any[]) => {
    try {
        const ai = getGeminiClient();

        const formattedHistory = messages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));
        const lastMessage = messages[messages.length - 1].text;

        const apiKey = process.env.GEMINI_API_KEY || '';
        console.log(`[Stream] Starting stream for model: ${APP_CONFIG.modelName} (from config) using key: ${apiKey.substring(0, 10)}...`);
        socket.emit('state-update', { type: 'thinking', payload: {} });

        const chat = ai.chats.create({
            model: APP_CONFIG.modelName,
            config: {
                systemInstruction: APP_CONFIG.systemInstruction,
                temperature: 0.7,
            },
            history: formattedHistory
        });

        const responseStreamResult = await chat.sendMessageStream({
            message: lastMessage
        });

        socket.emit('state-update', { type: 'generating', payload: {} });

        let fullResponse = '';
        const iterator = (responseStreamResult as any).stream || responseStreamResult;

        for await (const chunk of iterator) {
            try {
                let chunkText = typeof chunk.text === 'function' ? chunk.text() : chunk.text;
                if (chunkText) {
                    if (fullResponse.length === 0) {
                        chunkText = chunkText.replace(/^(So |So, |So\.|So)/i, '');
                    }
                    console.log(`[Stream] Chunk received: ${chunkText.substring(0, 10)}...`);
                    fullResponse += chunkText;
                    socket.emit('chat-chunk', { chunk: chunkText, done: false });
                }
            } catch (chunkErr) {
                console.warn("[Stream] Failed to get text from chunk (possible safety filter):", chunkErr);
                // If safety block occurs, the stream might still continue or end
            }
        }

        console.log("[Stream] Finished streaming.");
        socket.emit('chat-chunk', { chunk: '', done: true });
        socket.emit('state-update', { type: 'idle', payload: {} });

        if (fullResponse) {
            const lowerResponse = fullResponse.toLowerCase();
            const APP_CLOSE_PHRASES = [
                'let me synthesize',
                'give me a moment to synthesize',
                'let me pull this together',
                'let me step back to see forward',
            ];
            const shouldClose = APP_CLOSE_PHRASES.some(phrase => lowerResponse.includes(phrase));
            if (shouldClose) {
                console.log("[Stream] Detected synthesis signal.");
                socket.emit('state-update', { type: 'synthesis-trigger', payload: {} });
            }
        }

    } catch (error) {
        console.error("Gemini stream error", error);
        socket.emit('chat-chunk', { chunk: '', done: true });
        socket.emit('state-update', { type: 'error', payload: { message: 'Failed to generate response' } });
    }
};

export const handleSynthesisRequest = async (socket: Socket, history: any[], sessionId?: string) => {
    try {
        const ai = getGeminiClient();
        console.log("[Synthesis] Starting synthesis request...");
        socket.emit('state-update', { type: 'synthesizing', payload: {} });

        const transcript = history.map(m => `${m.role === 'user' ? 'EXECUTIVE' : 'REFLECT'}: ${m.text}`).join('\n');

        // Log conversation transcript locally
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        const logFileName = `transcript-${Date.now()}.txt`;
        const logFilePath = path.join(logsDir, logFileName);
        fs.writeFileSync(logFilePath, transcript, 'utf-8');
        console.log(`\n=================== NEW SESSION ===================\n`);
        console.log(`[Synthesis] Transcript locally saved to: ${logFilePath}\n`);
        console.log(transcript);
        console.log(`\n===================================================\n`);

        const prompt = getSynthesisPrompt(transcript);

        const synthesisResult = await ai.models.generateContent({
            model: APP_CONFIG.modelName,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
            }
        });

        const resultText = typeof (synthesisResult as any).text === 'function' ? (synthesisResult as any).text() : ((synthesisResult as any).text || "{}");
        console.log("[Synthesis] Response received.");
        const resultObj = JSON.parse(resultText);
        socket.emit('results-synthesis', resultObj);
        socket.emit('state-update', { type: 'synthesis-complete', payload: {} });

        if (sessionId) {
            import('../services/sessionService').then(({ archiveQuietSession }) => {
                archiveQuietSession(sessionId).catch(err => console.error("Archive error", err));
            });
        }

    } catch (error) {
        console.error("Synthesis error", error);
        socket.emit('results-synthesis', null); // Trigger fallback result
        socket.emit('state-update', { type: 'error', payload: { message: 'Failed to synthesize results' } });
    }
};
