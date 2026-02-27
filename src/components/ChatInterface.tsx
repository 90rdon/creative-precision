import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AppConfig, AssessmentEvent } from '../types';
import { createChatSession } from '../services/geminiService';
import { CLOSE_SIGNAL_PHRASES } from '../constants';
import { Mic, Send, Square, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { GenerateContentResponse, Chat } from "@google/genai";

import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface ChatInterfaceProps {
  config: AppConfig;
  onComplete: (history: Message[]) => void;
  sessionId?: string;
  onTrackEvent?: (event: AssessmentEvent) => void;
}

const containsCloseSignal = (text: string): boolean => {
  const lower = text.toLowerCase();
  return CLOSE_SIGNAL_PHRASES.some(phrase => lower.includes(phrase));
};

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

  // Refs for Logic
  const chatRef = useRef<Chat | null>(null);
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
  }, []); // Needs startListening, defined via hook but circular if not careful

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
    if (!textToSend || !chatRef.current) return;

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

    try {
      const streamResult = await chatRef.current.sendMessageStream({ message: userMsg.text });

      let fullText = '';
      setMessages(prev => {
        const updated = [...prev, { role: 'model' as const, text: '', isStreaming: true }];
        messagesRef.current = updated;
        return updated;
      });

      for await (const chunk of streamResult) {
        const text = (chunk as GenerateContentResponse).text || '';
        fullText += text;

        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'model', text: fullText, isStreaming: true };
          messagesRef.current = copy;
          return copy;
        });

        // Streaming TTS logic
        if (voiceModeRef.current) {
          sentenceBufferRef.current += text;
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

      // Process any remaining text in the buffer
      if (voiceModeRef.current && sentenceBufferRef.current.trim()) {
        const remaining = sentenceBufferRef.current.trim();
        if (!processedSentencesRef.current.has(remaining)) {
          processedSentencesRef.current.add(remaining);
          speak(remaining);
        }
      }

      // Finalize the streamed message
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'model', text: fullText, isStreaming: false };
        messagesRef.current = copy;
        return copy;
      });

      setIsLoading(false);
      track('ai_responded', { text_length: fullText.length });

      // --- Close signal detection ---
      if (containsCloseSignal(fullText)) {
        setIsTransitioning(true);
        track('assessment_complete', { message_count: messagesRef.current.length });

        stopListening();
        stopPlayback();

        setTimeout(() => {
          onComplete(messagesRef.current);
        }, 3000);
      }

    } catch (error) {
      console.error("Chat error", error);
      setIsLoading(false);
      if (voiceModeRef.current) startListening();
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
  useEffect(() => {
    chatRef.current = createChatSession(config);
    const initialMessages = [{ role: 'model' as const, text: config.initialGreeting }];
    setMessages(initialMessages);
    messagesRef.current = initialMessages;
  }, [config]);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      fontFamily: 'var(--sans)',
    }}>

      {/* Chat Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--linen)',
        border: '1px solid var(--border-m)',
        borderRadius: '8px',
        margin: '0.75rem 0',
      }}>

        {/* Session Label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '1.25rem 1rem 0.75rem',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: voiceStatus === 'listening' ? 'var(--charcoal)' : 'var(--accent)',
              opacity: voiceStatus === 'listening' ? 1 : 0.5,
              transition: 'all 0.3s',
            }} />
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 500,
              color: 'var(--stone)',
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              {isTransitioning ? 'Preparing your reflection...' :
                voiceStatus === 'processing' ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Reflecting...</> :
                  voiceStatus === 'speaking' ? <><Volume2 size={12} style={{ animation: 'pulse 2s infinite' }} /> Speaking...</> :
                    voiceStatus === 'listening' ? 'Listening...' :
                      'Reflection Session'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {micError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                color: '#dc2626', fontSize: '0.7rem', background: '#fef2f2',
                padding: '0.2rem 0.5rem', borderRadius: '4px',
              }}>
                <AlertCircle size={12} /> {micError}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1rem 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{ maxWidth: '85%' }}>
                <div style={{
                  fontFamily: 'var(--sans)', fontSize: '0.95rem', lineHeight: 1.7,
                  color: msg.role === 'user' ? 'var(--stone)' : 'var(--charcoal)',
                  ...(msg.role === 'user' ? {
                    background: 'var(--linen)', border: '1px solid var(--border)',
                    borderRadius: '12px 12px 2px 12px', padding: '0.85rem 1.1rem',
                  } : {}),
                }}>
                  {msg.text}
                  {msg.isStreaming && (
                    <span style={{
                      display: 'inline-block', width: '2px', height: '1em',
                      marginLeft: '2px', background: 'var(--accent)',
                      animation: 'pulse 1.5s infinite', verticalAlign: 'middle',
                    }} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading / Thinking State */}
          {(voiceStatus === 'processing' || (isLoading && messages[messages.length - 1]?.isStreaming && messages[messages.length - 1]?.text === '')) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--stone-lt)', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', animation: 'bounce 1s infinite', animationDelay: '-0.3s' }} />
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', animation: 'bounce 1s infinite', animationDelay: '-0.15s' }} />
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', animation: 'bounce 1s infinite' }} />
              </div>
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--stone-lt)' }}>Reflecting...</span>
            </div>
          )}

          {/* Transition indicator */}
          {isTransitioning && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '0.75rem', padding: '2rem 0', color: 'var(--stone)',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '2px solid var(--border-m)', borderTopColor: 'var(--charcoal)',
                animation: 'spin 1s linear infinite',
              }} />
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                Synthesizing your reflection...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar — v2 pill style */}
        <div style={{
          flexShrink: 0, padding: '0.75rem 1rem 1rem',
          background: 'var(--linen)', borderTop: '1px solid var(--border)',
          borderRadius: '0 0 8px 8px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'white', border: '1px solid var(--border-m)',
            borderRadius: '24px', padding: '0.6rem 0.6rem 0.6rem 1.25rem',
            transition: 'border-color 0.2s',
            opacity: isTransitioning ? 0.5 : 1,
            pointerEvents: isTransitioning ? 'none' : 'auto',
          }}>
            <input
              type="text"
              value={interimInput || input}
              onChange={(e) => { setInput(e.target.value); }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={voiceMode ? (voiceStatus === 'listening' ? "Listening..." : "Wait for response...") : "Share your thoughts..."}
              disabled={isLoading || voiceStatus === 'processing' || voiceStatus === 'speaking' || isTransitioning}
              style={{
                flex: 1, fontFamily: 'var(--sans)', fontSize: '0.9rem',
                color: 'var(--charcoal)', background: 'none', border: 'none', outline: 'none',
              }}
            />

            {/* Visualizer + Mic Button */}
            <div style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <canvas
                ref={canvasRef}
                width={80}
                height={80}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  pointerEvents: 'none', transition: 'opacity 0.5s',
                  opacity: voiceStatus === 'listening' ? 1 : 0,
                }}
              />
              <button
                onClick={handleToggleVoice}
                style={{
                  position: 'relative', zIndex: 10, width: '36px', height: '36px',
                  borderRadius: '50%', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', background: 'none',
                  color: voiceMode ? 'var(--charcoal)' : 'var(--stone-lt)', flexShrink: 0,
                }}
                title={voiceMode ? "Stop Voice Mode" : "Start Voice Mode"}
              >
                {voiceMode ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
              </button>
            </div>

            {/* Send Button — charcoal circle */}
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !interimInput.trim()) || isLoading || isTransitioning}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                cursor: (!input.trim() && !interimInput.trim()) || isLoading || isTransitioning ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', background: 'var(--charcoal)',
                color: 'var(--cream, #F4F1EB)', flexShrink: 0,
                opacity: (!input.trim() && !interimInput.trim()) || isLoading || isTransitioning ? 0.5 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Footer Label */}
      <div style={{ textAlign: 'center', padding: '0.5rem 0 0.75rem', flexShrink: 0 }}>
        {showFallbackLink && !isTransitioning ? (
          <button
            onClick={() => onComplete(messages)}
            style={{
              fontFamily: 'var(--sans)', fontSize: '0.65rem', fontWeight: 500,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--stone-lt)', background: 'none', border: 'none',
              cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px',
              opacity: 0.6, transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            Ready for your reflection? View results →
          </button>
        ) : (
          <span style={{
            fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--stone-lt)', opacity: 0.5,
          }}>
            {isTransitioning ? 'Generating your reflection...' :
              voiceMode ? (voiceStatus === 'listening' ? "Speak naturally · I'll respond to silence" : "AI is thinking...") : "Reflect AI Assessment"}
          </span>
        )}
      </div>
    </div>
  );
};
