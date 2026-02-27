import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Landing } from './components/Landing';
import { ChatInterface } from './components/ChatInterface';
import { Results } from './components/Results';
import { ConfigPanel } from './components/ConfigPanel';
import { AppConfig, AppView, Message, AssessmentEvent } from './types';
import { DEFAULT_CONFIG } from './constants';
import { initSession, updateSession, trackEvent } from './services/telemetryService';
import { Download, X } from 'lucide-react';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('assessment');
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
    const sessionStartRef = useRef(Date.now());

    // --- Telemetry Init ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const utm: Record<string, string> = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
            const val = params.get(key);
            if (val) utm[key] = val;
        });

        console.log(`[Telemetry] Session Started: ${sessionId}`, utm);

        initSession({
            session_id: sessionId,
            utm_source: utm.utm_source,
            utm_medium: utm.utm_medium,
            utm_campaign: utm.utm_campaign,
            utm_content: utm.utm_content,
            utm_term: utm.utm_term,
        });
    }, []);

    // --- Abandon tracking ---
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (view !== 'results') {
                const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
                updateSession(sessionId, {
                    completion_status: 'abandoned',
                    duration_seconds: duration,
                });
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [view, sessionId]);

    // --- Telemetry callback ---
    const handleTrackEvent = useCallback((event: AssessmentEvent) => {
        console.log(`[Telemetry] ${event.event_type}`, event.event_data);
        trackEvent(event);

        // Update session status based on events
        if (event.event_type === 'message_sent') {
            updateSession(sessionId, {
                completion_status: 'in_progress',
                message_count: (event.event_data?.message_count as number) || 0,
            });
        } else if (event.event_type === 'assessment_complete') {
            const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
            updateSession(sessionId, {
                completion_status: 'completed',
                duration_seconds: duration,
                message_count: (event.event_data?.message_count as number) || 0,
            });
        } else if (event.event_type === 'lifeline_clicked') {
            updateSession(sessionId, {
                clicked_lifeline: true,
                booked_call: event.event_data?.type === 'calendar',
            });
        } else if (event.event_type === 'share_clicked') {
            updateSession(sessionId, { clicked_share: true });
        } else if (event.event_type === 'pdf_downloaded') {
            updateSession(sessionId, { downloaded_pdf: true });
        }
    }, [sessionId]);

    const startAssessment = () => {
        setView('assessment');
    };

    const handleAssessmentComplete = (history: Message[]) => {
        setChatHistory(history);
        setView('results');
    };

    const handleRestart = () => {
        setChatHistory([]);
        setView('landing');
    };

    return (
        <div className="bg-sand-100 text-sand-900 font-sans selection:bg-sand-200 h-full w-full flex flex-col relative overflow-hidden">

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col items-center px-4 md:px-6 pb-4 md:pb-6 pt-2 md:pt-4">
                {view === 'landing' && <Landing onStart={startAssessment} />}

                {view === 'assessment' && (
                    <div className="h-full w-full max-w-4xl flex flex-col">
                        <ChatInterface
                            config={config}
                            onComplete={handleAssessmentComplete}
                            sessionId={sessionId}
                            onTrackEvent={handleTrackEvent}
                        />
                    </div>
                )}

                {view === 'results' && (
                    <div className="h-full overflow-y-auto w-full">
                        <Results
                            history={chatHistory}
                            onRestart={handleRestart}
                            sessionId={sessionId}
                            onTrackEvent={handleTrackEvent}
                        />
                    </div>
                )}
            </main>

            <ConfigPanel
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                config={config}
                onSave={setConfig}
            />

        </div>
    );
};

export default App;
