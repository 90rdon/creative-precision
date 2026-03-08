import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Results } from './Results';

const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
};

vi.mock('../services/geminiService', () => ({
    getSocket: () => mockSocket
}));

describe('Results Component (Socket)', () => {
    const mockHistory = [{ role: 'user' as const, text: 'Hello' }];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders results headers and triggers events', async () => {
        const onRestart = vi.fn();
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });

        const mockAlert = vi.fn();
        window.alert = mockAlert;

        window.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
        window.URL.revokeObjectURL = vi.fn();

        // Capture on handler
        const handlers: Record<string, any> = {};
        mockSocket.on.mockImplementation((event, cb) => {
            handlers[event] = cb;
        });

        render(<Results history={mockHistory} onRestart={onRestart} sessionId="123" />);

        expect(mockSocket.emit).toHaveBeenCalledWith('request-results', { history: mockHistory, sessionId: "123" });

        // Simulate successful response
        await waitFor(() => {
            if (handlers['results-synthesis']) {
                handlers['results-synthesis']({
                    heres_what_im_hearing: 'I hear you.',
                    pattern_worth_examining: 'Pattern P.',
                    question_to_sit_with: 'What if?',
                    the_close: {
                        sit_with_it: 'A',
                        keep_thinking: 'B',
                        real_conversation: 'C'
                    },
                    template_recommendation: {
                        tier: 'measurement',
                        name: 'Experimental Framework',
                        reason: 'Because test'
                    }
                });
            }
        });

        await waitFor(() => {
            expect(screen.getByText(/Your Reflection/i)).toBeInTheDocument();
        });

        expect(screen.getByText(/I hear you./i)).toBeInTheDocument();
    });

    it('handles result failure fallback', async () => {
        const handlers: Record<string, any> = {};
        mockSocket.on.mockImplementation((event, cb) => {
            handlers[event] = cb;
        });

        render(<Results history={mockHistory} onRestart={vi.fn()} sessionId="123" />);

        // Simulate empty/fail response
        await waitFor(() => {
            if (handlers['results-synthesis']) {
                handlers['results-synthesis'](null);
            }
        });

        await waitFor(() => {
            expect(screen.getByText(/You described an organization/i)).toBeInTheDocument();
        });
    });
});
