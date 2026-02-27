import React, { useState } from 'react';
import { Landing } from './components/Landing';
import { ChatInterface } from './components/ChatInterface';
import { Results } from './components/Results';
import { ConfigPanel } from './components/ConfigPanel';
import { AppConfig, AppView, Message } from './types';
import { DEFAULT_CONFIG } from './constants';
import { Settings, Download, X } from 'lucide-react';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('assessment');
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

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

    const handleExitClick = () => {
        if (chatHistory.length > 0) {
            setShowExitModal(true);
        } else {
            window.location.href = 'index.html';
        }
    };

    const downloadTranscript = () => {
        const text = chatHistory.map(m => `${m.role === 'user' ? 'Executive' : 'Reflect'}:\n${m.text}\n`).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reflect_Assessment_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exitWithSave = () => {
        downloadTranscript();
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    };

    return (
        <div className="bg-sand-100 text-sand-900 font-sans selection:bg-sand-200 h-full w-full flex flex-col relative overflow-hidden">

            {/* Settings Button (floating) */}
            <button
                onClick={() => setIsConfigOpen(true)}
                className="absolute top-3 right-4 z-40 p-2 text-stone-400 hover:text-sand-900 transition-colors rounded-full hover:bg-white/50"
                title="Configure AI"
            >
                <Settings size={18} />
            </button>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col items-center px-6 pb-6 pt-4">
                {view === 'landing' && <Landing onStart={startAssessment} />}

                {view === 'assessment' && (
                    <div className="h-full w-full max-w-4xl flex flex-col">
                        <ChatInterface
                            config={config}
                            onComplete={handleAssessmentComplete}
                        />
                    </div>
                )}

                {view === 'results' && (
                    <div className="h-full overflow-y-auto w-full">
                        <Results
                            history={chatHistory}
                            onRestart={handleRestart}
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

            {/* Exit Confirmation Modal */}
            {showExitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="font-serif text-2xl text-sand-900 mb-2">Save before you go?</h3>
                        <p className="text-stone-500 mb-6 text-sm">
                            You're leaving the reflection space. Would you like to save a copy of this transcript for your records before exiting?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={exitWithSave}
                                className="w-full flex items-center justify-center gap-2 bg-sand-900 text-sand-50 py-3 px-4 rounded-lg font-medium hover:bg-black transition-colors"
                            >
                                <Download size={18} />
                                Save Transcript & Exit
                            </button>
                            <button
                                onClick={() => window.location.href = 'index.html'}
                                className="w-full py-3 px-4 rounded-lg font-medium text-stone-500 hover:bg-stone-50 hover:text-sand-900 transition-colors"
                            >
                                Exit without saving
                            </button>
                        </div>
                        <button
                            onClick={() => setShowExitModal(false)}
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;
