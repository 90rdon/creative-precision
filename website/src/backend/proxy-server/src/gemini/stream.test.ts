import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as stream from './stream';
import { APP_CONFIG } from './prompts';

const mockSocket = {
    emit: vi.fn(),
};

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            chats = {
                create: vi.fn().mockReturnValue({
                    sendMessageStream: vi.fn().mockResolvedValue({
                        stream: (async function* () {
                            yield { text: () => 'Hello' };
                            yield { text: () => ' world' };
                        })()
                    })
                })
            };
            models = {
                generateContent: vi.fn().mockResolvedValue({
                    // Mock for GenerateContentResult that works with my robustness check
                    response: {
                        text: () => JSON.stringify({ heres_what_im_hearing: "I hear you" })
                    }
                })
            };
        }
    };
});

describe('Gemini Stream Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should stream chunks to the client', async () => {
        const messages = [
            { role: 'user', text: 'hi' }
        ];

        await stream.handleChatStream(mockSocket as any, messages);

        expect(mockSocket.emit).toHaveBeenCalledWith('state-update', { type: 'thinking', payload: {} });
        expect(mockSocket.emit).toHaveBeenCalledWith('state-update', { type: 'generating', payload: {} });
        expect(mockSocket.emit).toHaveBeenCalledWith('chat-chunk', { chunk: 'Hello', done: false });
        expect(mockSocket.emit).toHaveBeenCalledWith('chat-chunk', { chunk: ' world', done: false });
        expect(mockSocket.emit).toHaveBeenCalledWith('chat-chunk', { chunk: '', done: true });
        expect(mockSocket.emit).toHaveBeenCalledWith('state-update', { type: 'idle', payload: {} });
    });

    it('should detect close signal and emit synthesis-trigger', async () => {
        const messages = [
            { role: 'user', text: 'hi' }
        ];

        const mockChat = {
            sendMessageStream: vi.fn().mockResolvedValue({
                stream: (async function* () {
                    yield { text: () => 'Let me synthesize' };
                })()
            })
        };

        const ai = stream.getGeminiClient();
        vi.spyOn(ai.chats, 'create').mockReturnValue(mockChat as any);

        await stream.handleChatStream(mockSocket as any, messages);

        expect(mockSocket.emit).toHaveBeenCalledWith('state-update', { type: 'synthesis-trigger', payload: {} });
    });
});
