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
    <>
      <div className="chat-container">
        <div className="session-label">
          <div className="session-dot"></div>
          <span className="session-text">Reflection Session</span>
          {micError && (
            <div className="flex items-center gap-1 text-red-600 text-[11px] bg-red-50 px-2 py-0.5 rounded ml-auto">
              <AlertCircle size={12} /> {micError}
            </div>
          )}
        </div>

        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
              <p>
                {msg.text}
                {msg.isStreaming && <span className="inline-block w-1 h-3 ml-1 bg-charcoal animate-pulse align-middle" style={{ backgroundColor: '#2A2520' }} />}
              </p>
            </div>
          ))}

          {(voiceStatus === 'processing' || (isLoading && messages[messages.length - 1]?.isStreaming && messages[messages.length - 1]?.text === '')) && (
            <div className="message message-ai">
              <p className="flex items-center gap-2 italic" style={{ color: '#9B9590' }}>
                <Loader2 size={14} className="animate-spin" /> Thinking...
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

        <div className="input-bar">
          <div className="input-wrapper">
            <input
              type="text"
              value={interimInput || input}
              onChange={(e) => { setInput(e.target.value); }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={voiceMode ? (voiceStatus === 'listening' ? "Listening..." : "Wait for response...") : "Share your thoughts..."}
              aria-label="Type your response"
              disabled={isLoading || voiceStatus === 'processing' || voiceStatus === 'speaking' || isTransitioning}
            />

            <div className="relative flex items-center justify-center w-9 h-9">
              <canvas
                ref={canvasRef}
                width={36}
                height={36}
                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 rounded-full ${voiceStatus === 'listening' ? 'opacity-100' : 'opacity-0'}`}
                style={{ backgroundColor: voiceStatus === 'listening' ? 'rgba(42,37,32,0.06)' : 'transparent' }}
              />
              <button
                className={`input-btn btn-mic relative z-10`}
                style={{ color: voiceMode ? '#2A2520' : '' }}
                aria-label={voiceMode ? "Stop Voice Mode" : "Start Voice Mode"}
                onClick={handleToggleVoice}
              >
                {voiceMode ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
              </button>
            </div>

            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !interimInput.trim()) || isLoading || isTransitioning}
              className="input-btn btn-send cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="assess-footer">
        <p>Reflect AI Assessment</p>
      </div>
    </>
  );
};
