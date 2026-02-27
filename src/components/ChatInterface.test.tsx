import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInterface } from './ChatInterface';
import { DEFAULT_CONFIG } from '../constants';

const mockSendMessageStream = vi.fn();
const mockGenerateSpeech = vi.fn().mockResolvedValue('test-base64');
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();

vi.mock('../services/geminiService', () => ({
    createChatSession: () => ({
        sendMessageStream: mockSendMessageStream
    }),
    generateSpeech: (...args: any[]) => mockGenerateSpeech(...args)
}));

describe('ChatInterface Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockSendMessageStream.mockImplementation(async function* () {
            yield { text: 'Test response stream chunk' };
        });

        window.HTMLAudioElement.prototype.play = mockPlay;
        window.HTMLAudioElement.prototype.pause = mockPause;

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
    });

    it('renders initial greeting', () => {
        render(<ChatInterface config={DEFAULT_CONFIG} onComplete={vi.fn()} sessionId="123" />);
        expect(screen.getByText(DEFAULT_CONFIG.initialGreeting)).toBeInTheDocument();
    });

    it('can type and send a message', async () => {
        const onTrackEvent = vi.fn();
        render(<ChatInterface config={DEFAULT_CONFIG} onComplete={vi.fn()} sessionId="123" onTrackEvent={onTrackEvent} />);

        const input = screen.getByPlaceholderText('Share your thoughts...');
        fireEvent.change(input, { target: { value: 'This is my ambition' } });

        const sendBtn = input.nextElementSibling?.nextElementSibling as HTMLElement;
        fireEvent.click(sendBtn);

        await waitFor(() => {
            expect(screen.getByText('This is my ambition')).toBeInTheDocument();
        });

        expect(onTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'message_sent' }));
    });

    it('can toggle voice mode on and off', async () => {
        render(<ChatInterface config={DEFAULT_CONFIG} onComplete={vi.fn()} sessionId="123" />);

        const micBtn = screen.getByTitle('Start Voice Mode');

        // Turn ON
        fireEvent.click(micBtn);

        await waitFor(() => {
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
        });

        // The button title changes to Stop Voice Mode
        await waitFor(() => {
            expect(screen.getByTitle('Stop Voice Mode')).toBeInTheDocument();
        });

        const stopMicBtn = screen.getByTitle('Stop Voice Mode');
        fireEvent.click(stopMicBtn);

        await waitFor(() => {
            expect(screen.getByTitle('Start Voice Mode')).toBeInTheDocument();
        });
    });

    it('handles close signal appropriately', async () => {
        const onComplete = vi.fn();
        // Simulate Gemini returning a close signal phrase that ends the chat
        mockSendMessageStream.mockImplementationOnce(async function* () {
            yield { text: 'let me synthesize your thoughts' };
        });

        render(<ChatInterface config={DEFAULT_CONFIG} onComplete={onComplete} sessionId="123" />);

        const input = screen.getByPlaceholderText('Share your thoughts...');
        fireEvent.change(input, { target: { value: 'Im ready' } });

        const sendBtn = input.nextElementSibling?.nextElementSibling as HTMLElement;
        fireEvent.click(sendBtn);

        await waitFor(() => {
            expect(screen.getByText('let me synthesize your thoughts')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(/Synthesizing your reflection/i)).toBeInTheDocument();
        });
    });
});
