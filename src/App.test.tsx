import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./components/Landing', () => ({
    Landing: ({ onStart }: any) => <button onClick={onStart}>MockStart</button>
}));

vi.mock('./components/ChatInterface', () => ({
    ChatInterface: ({ onComplete, onTrackEvent }: any) => (
        <div>
            <button onClick={() => onComplete([{ role: 'user', text: 'hi' }])}>MockComplete</button>
            <button onClick={() => onTrackEvent({ event_type: 'message_sent', event_data: { message_count: 1 } })}>MockMessage</button>
            <button onClick={() => onTrackEvent({ event_type: 'assessment_complete', event_data: {} })}>MockAssessmentComplete</button>
            <button onClick={() => onTrackEvent({ event_type: 'lifeline_clicked', event_data: { type: 'calendar' } })}>MockCalendar</button>
            <button onClick={() => onTrackEvent({ event_type: 'share_clicked', event_data: {} })}>MockShare</button>
            <button onClick={() => onTrackEvent({ event_type: 'pdf_downloaded', event_data: {} })}>MockPdf</button>
        </div>
    )
}));

vi.mock('./components/Results', () => ({
    Results: ({ onRestart }: any) => <button onClick={onRestart}>MockRestart</button>
}));

describe('App', () => {
    it('covers various telemetry tracking events', () => {
        // defaults to ChatInterface -> "MockComplete"
        render(<App />);

        fireEvent.click(screen.getByText('MockMessage'));
        fireEvent.click(screen.getByText('MockAssessmentComplete'));
        fireEvent.click(screen.getByText('MockCalendar'));
        fireEvent.click(screen.getByText('MockShare'));
        fireEvent.click(screen.getByText('MockPdf'));
        expect(screen.getByText('MockComplete')).toBeInTheDocument();
    });

    it('can complete and restart', () => {
        render(<App />);
        fireEvent.click(screen.getByText('MockComplete'));

        // Now in results
        expect(screen.getByText('MockRestart')).toBeInTheDocument();

        // Restart goes to landing
        fireEvent.click(screen.getByText('MockRestart'));
        expect(screen.getByText('MockStart')).toBeInTheDocument();
    });
});
