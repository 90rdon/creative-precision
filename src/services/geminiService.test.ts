import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSocket, generateSpeech } from './geminiService';

vi.mock('socket.io-client', () => {
    const mSocket = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
    };
    return {
        io: vi.fn(() => mSocket)
    };
});

// Mock fetch for speech
global.fetch = vi.fn();

describe('Gemini Service (Refactored)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize socket correctly', () => {
        const socket = getSocket();
        expect(socket).toBeDefined();
        expect(socket.emit).toBeDefined();
    });

    describe('generateSpeech', () => {
        it('should call the proxy API for speech', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ audio: 'base64-audio' })
            });

            const result = await generateSpeech('test text');
            expect(global.fetch).toHaveBeenCalledWith('/api/speech', expect.any(Object));
            expect(result).toBe('base64-audio');
        });

        it('should handle rate limits with retries', async () => {
            (global.fetch as any)
                .mockResolvedValueOnce({ ok: false, status: 429 })
                .mockResolvedValueOnce({ ok: true, json: async () => ({ audio: 'success' }) });

            const result = await generateSpeech('retry text', 1, 10);
            expect(result).toBe('success');
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
});
