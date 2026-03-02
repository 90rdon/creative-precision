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
    const [view, setView] = useState<AppView>(() => {
        if (typeof window !== 'undefined') {
            if (window.location.pathname.includes('synthesize')) return 'results';
            if (window.location.pathname.includes('assessment')) return 'assessment';
        }
        return 'landing';
    });
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [chatHistory, setChatHistory] = useState<Message[]>(() => {
        if (typeof window !== 'undefined' && window.location.pathname.includes('synthesize')) {
            try {
                const stored = localStorage.getItem('reflect_chat_history');
                if (stored) return JSON.parse(stored);
            } catch (e) {
                console.error('Error loading history', e);
            }
        }
        return [];
    });
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
        window.location.href = 'assessment.html';
    };

    const handleAssessmentComplete = (history: Message[]) => {
        localStorage.setItem('reflect_chat_history', JSON.stringify(history));
        window.location.href = 'synthesize.html';
    };

    const handleRestart = () => {
        localStorage.removeItem('reflect_chat_history');
        window.location.href = 'assessment.html';
    };

    return (
        <div className="min-h-screen">
            <nav>
                <div className="nav-inner">
                    <a href="index.html" className="logo">Creative <em>Precision.</em></a>
                    <div className="nav-links">
                        <a href="perspective.html">The Perspective</a>
                        <a href="playbooks.html">Playbooks</a>
                        <button
                            onClick={() => setIsConfigOpen(true)}
                            aria-label="Settings"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.4rem' }}
                            className="text-stone-500 hover:text-charcoal transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <div className={view === 'results' ? 'results-layout' : 'app-shell'} style={{ paddingTop: '80px' }}>
                {view === 'landing' && <Landing onStart={startAssessment} />}

                {view === 'assessment' && (
                    <ChatInterface
                        config={config}
                        onComplete={handleAssessmentComplete}
                        sessionId={sessionId}
                        onTrackEvent={handleTrackEvent}
                    />
                )}

                {view === 'results' && (
                    <Results
                        history={chatHistory}
                        onRestart={handleRestart}
                        sessionId={sessionId}
                        onTrackEvent={handleTrackEvent}
                    />
                )}
            </div>

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
