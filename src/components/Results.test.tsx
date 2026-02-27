import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Results } from './Results';

vi.mock('../services/geminiService', () => ({
    generateResults: vi.fn().mockImplementation((history) => {
        if (history.length === 0) {
            return Promise.reject(new Error("Fail"));
        }
        return Promise.resolve(JSON.stringify({
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
        }));
    })
}));

describe('Results Component', () => {
    const mockHistory = [{ role: 'user' as const, text: 'Hello' }];

    it('renders results headers and triggers download and share', async () => {
        const onRestart = vi.fn();
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });

        const mockAlert = vi.fn();
        window.alert = mockAlert;

        // mock createObjectURL
        window.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
        window.URL.revokeObjectURL = vi.fn();

        render(<Results history={mockHistory} onRestart={onRestart} sessionId="123" />);

        await waitFor(() => {
            expect(screen.getByText(/Your Reflection/i)).toBeInTheDocument();
        });

        const downloadBtn = screen.getByText(/Download Brief/i);
        fireEvent.click(downloadBtn);

        const shareBtns = screen.getAllByText(/Share/i);
        fireEvent.click(shareBtns[0]);

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });

    it('handles result failure fallback', async () => {
        render(<Results history={[]} onRestart={vi.fn()} sessionId="123" />);
        await waitFor(() => {
            expect(screen.getByText(/Your Reflection/i)).toBeInTheDocument();
        });
        // check if fallback result is rendered "You described an organization"
        expect(screen.getByText(/You described an organization/i)).toBeInTheDocument();
    });
});
