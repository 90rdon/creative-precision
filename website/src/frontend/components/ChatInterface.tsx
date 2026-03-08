import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AppConfig, AssessmentEvent } from '../types';
import { getSocket } from '../services/geminiService';
import { Mic, Send, Square, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface ChatInterfaceProps {
  config: AppConfig;
  onComplete: (history: Message[]) => void;
  sessionId: string; // Made required
  onTrackEvent?: (event: AssessmentEvent) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ config, onComplete, sessionId, onTrackEvent }) => {
  // UI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [interimInput, setInterimInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Refs for Logic
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef('');
  const messagesRef = useRef<Message[]>([]);
  const voiceModeRef = useRef(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Audio Queue Refs (for text buffering during chunks)
  const sentenceBufferRef = useRef('');
  const processedSentencesRef = useRef<Set<string>>(new Set());

  // Custom Hooks
  const { startVisualizer, stopVisualizer } = useAudioVisualizer();

  const handleSpeechEnd = useCallback(() => {
    if (voiceModeRef.current) {
      startListening();
    } else {
      setVoiceStatus('idle');
    }
  }, []);

  const { speak, stopPlayback } = useTextToSpeech({
    voiceStatus,
    setVoiceStatus,
    voiceMode,
    onSpeechEnd: handleSpeechEnd
  });

  // --- Telemetry helper ---
  const track = useCallback((eventType: string, eventData?: Record<string, unknown>) => {
    if (onTrackEvent && sessionId) {
      onTrackEvent({ session_id: sessionId, event_type: eventType, event_data: eventData });
    }
  }, [onTrackEvent, sessionId]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || inputRef.current || input).trim();
    if (!textToSend) return;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setInput('');
    inputRef.current = '';
    setInterimInput('');
    setIsLoading(true);

    sentenceBufferRef.current = '';
    processedSentencesRef.current.clear();
    stopPlayback();

    if (voiceMode) {
      setVoiceStatus('processing');
      stopListening();
    }

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => {
      const newMessages = [...prev, userMsg];
      messagesRef.current = newMessages;
      track('message_sent', { message_count: newMessages.length, text_length: textToSend.length });
      return newMessages;
    });

    setMessages(prev => {
      const updated = [...prev, { role: 'model' as const, text: '', isStreaming: true }];
      messagesRef.current = updated;
      return updated;
    });

    try {
      const response = await fetch('/api/assessment/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          content: textToSend
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        setMessages(prev => {
          const copy = [...prev];
          const lastIndex = copy.length - 1;
          const currentText = copy[lastIndex].text || '';
          copy[lastIndex] = { role: 'model', text: currentText + chunk, isStreaming: true };
          messagesRef.current = copy;
          return copy;
        });

        // Add voice mode support
        if (voiceModeRef.current) {
          sentenceBufferRef.current += chunk;
          const sentences = sentenceBufferRef.current.split(/(?<=[.!?])\s+/);

          if (sentences.length > 1) {
            let combinedSentence = "";
            for (let i = 0; i < sentences.length - 1; i++) {
              const sentence = sentences[i].trim();
              if (sentence) {
                combinedSentence += (combinedSentence ? " " : "") + sentence;
                if (combinedSentence.length > 20 || i === sentences.length - 2) {
                  if (!processedSentencesRef.current.has(combinedSentence)) {
                    processedSentencesRef.current.add(combinedSentence);
                    speak(combinedSentence);
                    combinedSentence = "";
                  }
                }
              }
            }
            sentenceBufferRef.current = (combinedSentence ? combinedSentence + " " : "") + sentences[sentences.length - 1];
          }
        }
      }

      // Final voice mode cleanup
      if (voiceModeRef.current && sentenceBufferRef.current.trim()) {
        const remaining = sentenceBufferRef.current.trim();
        if (!processedSentencesRef.current.has(remaining)) {
          processedSentencesRef.current.add(remaining);
          speak(remaining);
        }
      }

      // Cleanup on done
      setIsLoading(false);
      setMessages(prev => {
        const copy = [...prev];
        const lastIndex = copy.length - 1;
        const fullText = copy[lastIndex].text;
        copy[lastIndex] = { ...copy[lastIndex], isStreaming: false };
        messagesRef.current = copy;
        track('ai_responded', { text_length: fullText?.length || 0 });
        return copy;
      });

    } catch (err: any) {
      console.error('Fetch streaming error:', err);
      setIsLoading(false);
      setMicError(err.message || 'Connection lost.');
    }
  };

  const { startListening, stopListening, silenceTimerRef } = useSpeechRecognition({
    onTranscript: (interim, final) => {
      if (final) {
        const current = inputRef.current;
        const next = (current + ' ' + final).trim();
        setInput(next);
        inputRef.current = next;
        setInterimInput('');

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          handleSend(next);
        }, 1200);
      } else if (interim) {
        setInterimInput(interim);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const current = inputRef.current;
          const combined = (current + ' ' + interim).trim();
          handleSend(combined);
        }, 2000);
      }
    },
    onMicError: setMicError,
    voiceMode, setVoiceMode,
    voiceStatus, setVoiceStatus
  });

  // --- 1. Initialization ---
  const initSession = useCallback(async (forceNew = false) => {
    let savedSessionId = localStorage.getItem('expert_assessment_session_id');

    if (forceNew) {
      savedSessionId = null;
      localStorage.removeItem('expert_assessment_session_id');
    }

    try {
      const response = await fetch('/api/assessment/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // If forceNew is true, we send null to get a fresh UUID from proxy
        body: JSON.stringify({ browserSessionId: savedSessionId })
      });
      const data = await response.json();
      if (data.sessionId) {
        localStorage.setItem('expert_assessment_session_id', data.sessionId);
        setCurrentSessionId(data.sessionId);

        // Reset messages if it's a new session
        if (forceNew) {
          const greeting = [{ role: 'model' as const, text: config.initialGreeting }];
          setMessages(greeting);
          messagesRef.current = greeting;
          track('session_reset', { new_session_id: data.sessionId });
        }
      }
    } catch (err) {
      console.error('Failed to init session:', err);
    }
  }, [config, track]);

  useEffect(() => {
    const initialMessages = [{ role: 'model' as const, text: config.initialGreeting }];
    setMessages(initialMessages);
    messagesRef.current = initialMessages;

    initSession();
  }, [config]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to start over? This will clear your current assessment history.")) {
      initSession(true);
    }
  };

  // --- 2. Socket Listeners ---
  useEffect(() => {
    const socket = getSocket();

    // Still listening for overall state updates (e.g. synthesis trigger)
    const onStateUpdate = (data: { type: string, payload: any }) => {
      if (data.type === 'synthesis-trigger') {
        setIsTransitioning(true);
        track('assessment_complete', { message_count: messagesRef.current.length });
        stopListening();
        stopPlayback();
        setTimeout(() => {
          onComplete(messagesRef.current);
        }, 3000);
      } else if (data.type === 'error') {
        setIsLoading(false);
        setMicError(data.payload.message || 'An unexpected error occurred.');
      }
    };

    socket.on('state-update', onStateUpdate);

    return () => {
      socket.off('state-update', onStateUpdate);
    };
  }, []);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimInput, voiceStatus]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  // --- 5. Main Handlers ---
  const handleToggleVoice = async () => {
    if (voiceMode) {
      setVoiceMode(false);
      setVoiceStatus('idle');
      stopListening();
      stopVisualizer();
      stopPlayback();
    } else {
      setVoiceMode(true);
      await startVisualizer(canvasRef.current, setMicError);

      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'model' && !lastMsg.isStreaming) {
        await speak(lastMsg.text);
      } else {
        startListening();
      }
    }
  };

  // --- Render ---
  const messageCount = messages.filter(m => m.role === 'user').length;
  const showFallbackLink = messageCount >= 6 && messages[messages.length - 1]?.role === 'model' && !messages[messages.length - 1]?.isStreaming;

  return (
    <>
      <div className="chat-container">
        <div className="session-label">
          <div className="session-dot"></div>
          <span className="session-text">Reflection Session</span>

          <div className="ml-auto flex items-center gap-4">
            {micError && (
              <div className="flex items-center gap-1 text-red-600 text-[11px] bg-red-50 px-2 py-0.5 rounded">
                <AlertCircle size={12} /> {micError}
              </div>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all hover:bg-stone-100 text-stone-500 hover:text-charcoal border border-transparent hover:border-stone-200"
              title="Start a fresh session"
            >
              <RotateCcw size={12} /> Start Over
            </button>
          </div>
        </div>

        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-6">
                      <table className="min-w-full border-collapse border border-[#2A2520]/10 rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-[#F5F3F0]">{children}</thead>,
                  th: ({ children }) => <th className="border border-[#2A2520]/10 px-4 py-2 text-left font-semibold">{children}</th>,
                  td: ({ children }) => <td className="border border-[#2A2520]/10 px-4 py-2">{children}</td>,
                }}
              >
                {msg.text || ''}
              </ReactMarkdown>
              {msg.isStreaming && (
                <span
                  className="inline-block w-1.5 h-4 ml-1 bg-[#2A2520] animate-pulse align-middle"
                />
              )}
            </div>
          ))}

          {(voiceStatus === 'processing' || (isLoading && (messages[messages.length - 1]?.text === '' || messages[messages.length - 1]?.isStreaming))) && (
            <div className="message message-ai">
              <p className="flex items-center gap-2 italic" style={{ color: '#9B9590' }}>
                <Loader2 size={14} className="animate-spin" /> The Expert is analyzing...
              </p>
            </div>
          )}

          {isTransitioning && (
            <div className="message message-ai">
              <p className="flex items-center gap-2 italic" style={{ color: '#9B9590' }}>
                <Loader2 size={14} className="animate-spin" /> Synthesizing your reflection...
              </p>
            </div>
          )}

          {showFallbackLink && !isTransitioning && (
            <div className="mx-auto mt-4 text-center">
              <button onClick={() => onComplete(messages)} style={{ borderColor: 'rgba(42,37,32,0.12)', color: '#2A2520' }} className="py-2 px-6 text-sm font-medium border rounded-full hover:bg-stone-100 transition-colors cursor-pointer">
                Generate Assessment
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-box">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={voiceMode ? (voiceStatus === 'listening' ? "I'm listening..." : "Thinking...") : "Share your thoughts..."}
              disabled={isLoading || isTransitioning}
            />

            <div className="input-actions">
              <button
                className={`action-btn ${voiceMode ? 'active' : ''}`}
                onClick={handleToggleVoice}
                title={voiceMode ? "Disable voice mode" : "Enable voice mode"}
              >
                {voiceMode ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
              </button>

              <button
                className="action-btn send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading || isTransitioning}
                title="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {voiceMode && (
            <div className="voice-visualizer">
              <canvas ref={canvasRef} width={200} height={40} />
              {interimInput && <div className="interim-text">{interimInput}</div>}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #FDFCFB;
          max-width: 800px;
          margin: 0 auto;
          position: relative;
        }
        
        .session-label {
          display: flex;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(42,37,32,0.05);
        }
        
        .session-dot {
          width: 6px;
          height: 6px;
          background: #2A2520;
          border-radius: 50%;
          margin-right: 12px;
        }
        
        .session-text {
          font-family: 'Newsreader', serif;
          font-style: italic;
          font-size: 1.1rem;
          color: #2A2520;
          opacity: 0.6;
        }
        
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .message {
          max-width: 85%;
          line-height: 1.7;
          font-size: 1.05rem;
        }
        
        .message-ai {
          align-self: flex-start;
          color: #2A2520;
          font-family: 'Inter', sans-serif;
        }
        
        .message-user {
          align-self: flex-end;
          background: #F5F3F0;
          padding: 1rem 1.5rem;
          border-radius: 1.5rem 1.5rem 0 1.5rem;
          color: #2A2520;
          font-family: 'Inter', sans-serif;
        }
        
        .input-area {
          padding: 2rem;
          background: #FDFCFB;
        }
        
        .input-box {
          position: relative;
          background: #FFFFFF;
          border: 1px solid rgba(42,37,32,0.12);
          border-radius: 1.5rem;
          padding: 0.5rem 0.5rem 0.5rem 1.5rem;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(42,37,32,0.04);
        }
        
        .input-box:focus-within {
          border-color: #2A2520;
          box-shadow: 0 4px 25px rgba(42,37,32,0.08);
        }
        
        input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          color: #2A2520;
          background: transparent;
          padding: 0.75rem 0;
        }
        
        input::placeholder {
          color: #9B9590;
        }
        
        .input-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .action-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9B9590;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .action-btn:hover {
          background: #F5F3F0;
          color: #2A2520;
        }
        
        .action-btn.active {
          background: #2A2520;
          color: #FFFFFF;
        }
        
        .send-btn {
          background: #F5F3F0;
          color: #2A2520;
        }
        
        .send-btn:hover:not(:disabled) {
          background: #2A2520;
          color: #FFFFFF;
        }
        
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .voice-visualizer {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .interim-text {
          font-size: 0.9rem;
          color: #9B9590;
          font-style: italic;
          margin-top: 0.5rem;
          text-align: center;
          max-width: 80%;
          margin: 0.5rem auto 0;
        }

        /* Markdown Overrides */
        .message-ai h1, .message-ai h2, .message-ai h3 {
          color: #2A2520;
          font-family: 'Newsreader', serif;
        }
        
        .message-ai strong {
          color: #2A2520;
          font-weight: 600;
        }

        .message-ai table {
          width: 100%;
          margin: 1.5rem 0;
          font-size: 0.95rem;
        }

        .message-ai blockquote {
          border-left: 3px solid #2A2520;
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          color: #6B6560;
          font-style: italic;
        }
      `}</style>
    </>
  );
};
