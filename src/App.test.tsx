import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock window.location with proper string properties
const mockLocation = {
    pathname: '/assessment',
    href: 'http://localhost/assessment.html'
};

beforeEach(() => {
    mockLocation.pathname = '/assessment';
    mockLocation.href = 'http://localhost/assessment.html';
    // Reset and mock window.location
    delete (window as any).location;
    Object.defineProperty(window, 'location', {
        get: () => mockLocation,
        set: () => {},
        configurable: true
    });
});

describe('App', () => {
    it('covers various telemetry tracking events', () => {
        // Start in assessment view
        mockLocation.pathname = '/assessment';
        const { unmount } = render(<App />);

        fireEvent.click(screen.getByText('MockMessage'));
        fireEvent.click(screen.getByText('MockAssessmentComplete'));
        fireEvent.click(screen.getByText('MockCalendar'));
        fireEvent.click(screen.getByText('MockShare'));
        fireEvent.click(screen.getByText('MockPdf'));
        expect(screen.getByText('MockComplete')).toBeInTheDocument();
        unmount();
    });

    it('can complete and restart', () => {
        // Start in assessment view
        mockLocation.pathname = '/assessment';
        const { unmount: unmountApp } = render(<App />);

        fireEvent.click(screen.getByText('MockComplete'));
        unmountApp();

        // Navigate to results
        mockLocation.pathname = '/synthesize';
        mockLocation.href = 'http://localhost/synthesize.html';
        const { unmount: unmountResults } = render(<App />);

        expect(screen.getByText('MockRestart')).toBeInTheDocument();
        fireEvent.click(screen.getByText('MockRestart'));
        unmountResults();

        // Navigate to landing
        mockLocation.pathname = '/';
        mockLocation.href = 'http://localhost/index.html';
        render(<App />);

        expect(screen.getByText('MockStart')).toBeInTheDocument();
    });
});
