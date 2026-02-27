import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateResults, createChatSession, generateSpeech } from './geminiService';

const mocks = vi.hoisted(() => {
    return {
        mockCreateChatSession: vi.fn().mockReturnValue({}),
        mockGenerateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
                heres_what_im_hearing: 'Test hearing',
                pattern_worth_examining: 'Test pattern',
                question_to_sit_with: 'Test question',
                the_close: {
                    sit_with_it: 'A',
                    keep_thinking: 'B',
                    real_conversation: 'C'
                }
            }),
            candidates: [{
                content: {
                    parts: [{
                        inlineData: {
                            data: 'test-audio-base64'
                        }
                    }]
                }
            }]
        })
    }
});

vi.mock('@google/genai', () => {
    return {
        Modality: { AUDIO: 'AUDIO' },
        Type: { STRING: 'STRING', OBJECT: 'OBJECT' },
        GoogleGenAI: class {
            chats: any;
            models: any;
            constructor() {
                this.chats = { create: mocks.mockCreateChatSession };
                this.models = { generateContent: mocks.mockGenerateContent };
            }
        }
    };
});

describe('Gemini Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (import.meta as any).env = { GEMINI_API_KEY: 'test-key' };
    });

    describe('createChatSession', () => {
        it('creates a chat session successfully', () => {
            const config = { modelName: 'test-model', systemInstruction: 'test inst', initialGreeting: '' };
            const chat = createChatSession(config);
            expect(chat).toBeDefined();
        });
    });

    describe('generateResults', () => {
        it('generates structured JSON results', async () => {
            const history = [{ role: 'user' as const, text: 'Hello' }];
            const result = await generateResults(history);
            const parsed = JSON.parse(result);

            expect(parsed).toHaveProperty('heres_what_im_hearing');
            expect(parsed).toHaveProperty('pattern_worth_examining');
            expect(parsed).toHaveProperty('question_to_sit_with');
            expect(parsed.the_close).toHaveProperty('sit_with_it');
        });

        it('handles empty history gracefully', async () => {
            const result = await generateResults([]);
            expect(typeof result).toBe('string');
            expect(JSON.parse(result)).toHaveProperty('heres_what_im_hearing');
        });
    });

    describe('generateSpeech', () => {
        it('generates speech and returns base64 string', async () => {
            const result = await generateSpeech('test text');
            expect(result).toBe('test-audio-base64');
        });

        it('handles errors during generation', async () => {
            mocks.mockGenerateContent.mockRejectedValueOnce(new Error('Test error'));
            const result = await generateSpeech('error text');
            expect(result).toBe('');
        });
    });
});
