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
    <div className="flex flex-col h-full overflow-hidden font-sans">
      {/* Chat Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FEFDFB] border border-black/10 rounded-xl md:my-2">

        {/* Session Label */}
        <div className="flex items-center justify-between gap-2 px-4 md:px-6 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${voiceStatus === 'listening' ? 'bg-[#2A2520] opacity-100' : 'bg-[#8B7355] opacity-50'}`}
            />
            <span className="text-[0.7rem] md:text-[0.78rem] font-medium text-[#6B6560] tracking-wide flex items-center gap-1.5">
              {isTransitioning ? 'Preparing your reflection...' :
                voiceStatus === 'processing' ? <><Loader2 size={12} className="animate-spin" /> Reflecting...</> :
                  voiceStatus === 'speaking' ? <><Volume2 size={12} className="animate-pulse" /> Speaking...</> :
                    voiceStatus === 'listening' ? 'Listening...' :
                      'Reflection Session'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {micError && (
              <div className="flex flex-col md:flex-row items-center gap-1 text-red-600 text-[0.65rem] md:text-xs bg-red-50 py-1 px-2 rounded text-right">
                <AlertCircle size={10} className="md:w-3 md:h-3" />
                <span className="hidden leading-tight leading-t md:inline">{micError}</span>
                <span className="md:hidden">Error</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 flex flex-col gap-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="max-w-[92%] md:max-w-[85%]">
                <div className={`font-sans text-[0.9rem] md:text-[0.95rem] leading-[1.6] md:leading-[1.7] ${msg.role === 'user' ? 'text-[#6B6560] bg-[#FEFDFB] border border-black/5 rounded-2xl rounded-br-sm px-3 md:px-4 py-2.5 md:py-3' : 'text-[#2A2520]'}`}>
                  {msg.text}
                  {msg.isStreaming && (
                    <span className="inline-block w-[2px] h-[1em] ml-[2px] bg-[#8B7355] animate-pulse align-middle" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading / Thinking State */}
          {(voiceStatus === 'processing' || (isLoading && messages[messages.length - 1]?.isStreaming && messages[messages.length - 1]?.text === '')) && (
            <div className="flex items-center gap-2 text-[#9B9590] py-2">
              <div className="flex gap-[3px]">
                <div className="w-[5px] h-[5px] rounded-full bg-[#8B7355] animate-bounce" style={{ animationDelay: '-0.3s' }} />
                <div className="w-[5px] h-[5px] rounded-full bg-[#8B7355] animate-bounce" style={{ animationDelay: '-0.15s' }} />
                <div className="w-[5px] h-[5px] rounded-full bg-[#8B7355] animate-bounce" />
              </div>
              <span className="font-serif italic text-[0.85rem] md:text-[0.88rem] text-[#9B9590]">Reflecting...</span>
            </div>
          )}

          {/* Transition indicator */}
          {isTransitioning && (
            <div className="flex flex-col items-center gap-3 py-8 text-[#6B6560]">
              <div className="w-8 h-8 rounded-full border-2 border-black/10 border-t-[#2A2520] animate-spin" />
              <span className="font-serif italic text-[0.85rem] md:text-sm">
                Synthesizing your reflection...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="shrink-0 px-3 md:px-6 pb-4 pt-3 bg-[#FEFDFB] border-t border-black/5 rounded-b-xl">
          <div className={`flex items-center gap-1 md:gap-2 bg-white border border-black/10 rounded-full py-1.5 md:py-2 pl-3 md:pl-5 pr-1.5 md:pr-2 transition-colors focus-within:border-[#8B7355] ${isTransitioning ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="text"
              value={interimInput || input}
              onChange={(e) => { setInput(e.target.value); }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={voiceMode ? (voiceStatus === 'listening' ? "Listening..." : "Wait...") : "Share your thoughts..."}
              disabled={isLoading || voiceStatus === 'processing' || voiceStatus === 'speaking' || isTransitioning}
              className="flex-1 font-sans text-[0.85rem] md:text-[0.9rem] text-[#2A2520] bg-transparent border-none outline-none placeholder:text-[#9B9590] min-w-0"
            />

            {/* Visualizer + Mic Button */}
            <div className="relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shrink-0">
              <canvas
                ref={canvasRef}
                width={80}
                height={80}
                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${voiceStatus === 'listening' ? 'opacity-100' : 'opacity-0'}`}
              />
              <button
                onClick={handleToggleVoice}
                className={`relative z-10 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full border-none cursor-pointer transition-all duration-200 bg-transparent shrink-0 ${voiceMode ? 'text-[#2A2520]' : 'text-[#9B9590] hover:text-[#2A2520]'}`}
                title={voiceMode ? "Stop Voice Mode" : "Start Voice Mode"}
              >
                {voiceMode ? <Square size={14} fill="currentColor" className="md:w-4 md:h-4" /> : <Mic size={16} className="md:w-[18px] md:h-[18px]" />}
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !interimInput.trim()) || isLoading || isTransitioning}
              className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full border-none transition-all duration-200 bg-[#2A2520] text-[#F4F1EB] shrink-0 ${(!input.trim() && !interimInput.trim()) || isLoading || isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#3A3530]'}`}
            >
              <Send size={14} className="md:w-4 md:h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Footer Label */}
      <div className="text-center pb-2 pt-1 md:pb-3 md:pt-2 shrink-0">
        {showFallbackLink && !isTransitioning ? (
          <button
            onClick={() => onComplete(messages)}
            className="font-sans text-[0.6rem] md:text-[0.65rem] font-medium tracking-widest uppercase text-[#9B9590] bg-transparent border-none cursor-pointer underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity duration-200 p-2"
          >
            Ready for your reflection? View results →
          </button>
        ) : (
          <span className="text-[0.55rem] md:text-[0.65rem] font-medium tracking-widest uppercase text-[#9B9590] opacity-50 px-2 block truncate">
            {isTransitioning ? 'Generating reflection...' :
              voiceMode ? (voiceStatus === 'listening' ? "Speak naturally · I'll respond to silence" : "AI is thinking...") : "Reflect AI Assessment"}
          </span>
        )}
      </div>
    </div>
  );
};
