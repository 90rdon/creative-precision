import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInterface } from './ChatInterface';
import { DEFAULT_CONFIG } from '../constants';

const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
};

vi.mock('../services/geminiService', () => ({
    getSocket: () => mockSocket,
    generateSpeech: vi.fn().mockResolvedValue('test-base64')
}));

// Mock fetch for proxy endpoints
global.fetch = vi.fn();

describe('ChatInterface Component (Socket)', () => {

    beforeEach(() => {
        vi.clearAllMocks();

        window.HTMLAudioElement.prototype.play = vi.fn().mockResolvedValue(undefined);
        window.HTMLAudioElement.prototype.pause = vi.fn();

        // mock AudioContext
        window.AudioContext = vi.fn().mockImplementation(() => ({
            state: 'suspended',
            resume: vi.fn().mockResolvedValue(undefined),
            createMediaStreamSource: vi.fn().mockReturnValue({ connect: vi.fn() }),
            createAnalyser: vi.fn().mockReturnValue({ fftSize: 256, connect: vi.fn(), frequencyBinCount: 16, getByteFrequencyData: vi.fn() }),
            destination: {},
            createBufferSource: vi.fn().mockReturnValue({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), buffer: null, onended: null }),
            createBuffer: vi.fn().mockReturnValue({ getChannelData: vi.fn().mockReturnValue(new Float32Array(1)) })
        })) as any;

        if (!navigator.mediaDevices) {
            (navigator as any).mediaDevices = {};
        }
        navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] });

        // mock localStorage
        const localStorageMock = (() => {
            let store: Record<string, string> = {};
            return {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => { store[key] = value; },
                removeItem: (key: string) => { delete store[key]; },
                clear: () => { store = {}; }
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // mock SpeechRecognition
        (window as any).SpeechRecognition = vi.fn().mockImplementation(() => ({
            start: vi.fn(),
            stop: vi.fn(),
            abort: vi.fn(),
            continuous: true,
            interimResults: true,
            lang: 'en-US'
        }));
        (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;

        // Mock fetch - reset after each test
        (global.fetch as any).mockClear();

        // Mock /api/assessment/init endpoint by default
        (global.fetch as any).mockImplementation(async (url: string) => {
            if (url === '/api/assessment/init') {
                return {
                    ok: true,
                    json: async () => ({ sessionId: 'mock-session-123' })
                } as Response;
            }
            return { ok: false } as Response;
        });
    });

    it('renders initial greeting', () => {
        render(<ChatInterface config={DEFAULT_CONFIG as any} onComplete={vi.fn()} sessionId="123" />);
        expect(screen.getByText(DEFAULT_CONFIG.initialGreeting)).toBeInTheDocument();
    });

    it('emits chat-message when sending', async () => {
        (global.fetch as any).mockImplementation(async (url: string) => {
            if (url === '/api/assessment/init') {
                return {
                    ok: true,
                    json: async () => ({ sessionId: 'mock-session-123' })
                } as Response;
            }
            if (url === '/api/assessment/message') {
                const mockReadableStream = {
                    getReader: vi.fn().mockReturnValue({
                        read: vi.fn()
                            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello') })
                            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(' world') })
                            .mockResolvedValueOnce({ done: true })
                    })
                };
                return {
                    ok: true,
                    body: mockReadableStream
                } as Response;
            }
            return { ok: false } as Response;
        });

        render(<ChatInterface config={DEFAULT_CONFIG as any} onComplete={vi.fn()} sessionId="123" />);

        const input = screen.getByPlaceholderText('Share your thoughts...');
        fireEvent.change(input, { target: { value: 'This is my ambition' } });

        const sendBtn = screen.getByRole('button', { name: 'Send message' });
        fireEvent.click(sendBtn);

        await waitFor(() => {
            // When sending, fetch should be called with the assessment/message endpoint
            expect(global.fetch).toHaveBeenCalledWith('/api/assessment/message', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }));
        });

        // Verify the response text was updated
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    });

    it('updates text when chat-chunk arrives', async () => {
        const handlers: Record<string, any> = {};
        mockSocket.on.mockImplementation((event, cb) => {
            handlers[event] = cb;
        });

        // Mock fetch - includes both init and message endpoints
        (global.fetch as any).mockImplementation(async (url: string) => {
            if (url === '/api/assessment/init') {
                return {
                    ok: true,
                    json: async () => ({ sessionId: 'mock-session-123' })
                } as Response;
            }
            if (url === '/api/assessment/message') {
                const mockReadableStream = {
                    getReader: vi.fn().mockReturnValue({
                        read: vi.fn()
                            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello') })
                            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(' world') })
                            .mockResolvedValueOnce({ done: true })
                    })
                };
                return {
                    ok: true,
                    body: mockReadableStream
                } as Response;
            }
            return { ok: false } as Response;
        });

        render(<ChatInterface config={DEFAULT_CONFIG as any} onComplete={vi.fn()} sessionId="123" />);

        // Simulate sending a message to start a model block
        const input = screen.getByPlaceholderText('Share your thoughts...');
        fireEvent.change(input, { target: { value: 'hi' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

        await waitFor(() => {
            expect(screen.getByText(/Hello world/)).toBeInTheDocument();
        });
    });

    it('handles synthesis-trigger state update', async () => {
        const onComplete = vi.fn();
        const handlers: Record<string, any> = {};
        mockSocket.on.mockImplementation((event, cb) => {
            handlers[event] = cb;
        });

        // Mock fetch for init endpoint specifically
        (global.fetch as any).mockImplementation(async (url: string) => {
            if (url === '/api/assessment/init') {
                return {
                    ok: true,
                    json: async () => ({ sessionId: 'mock-session-123' })
                } as Response;
            }
            return { ok: false } as Response;
        });

        render(<ChatInterface config={DEFAULT_CONFIG as any} onComplete={onComplete} sessionId="123" />);

        // Trigger trigger
        await waitFor(() => {
            if (handlers['state-update']) {
                handlers['state-update']({ type: 'synthesis-trigger', payload: {} });
            }
        });

        expect(screen.getByText(/Synthesizing your reflection/i)).toBeInTheDocument();

        // Wait for onComplete
        await waitFor(() => {
            expect(onComplete).toHaveBeenCalled();
        }, { timeout: 4000 });
    });
});
