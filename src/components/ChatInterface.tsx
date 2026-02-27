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
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto w-full bg-sand-50 rounded-lg shadow-sm border border-stone-200 overflow-hidden relative font-sans">

      {/* Header */}
      <div className="bg-white border-b border-stone-100 p-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${voiceStatus === 'listening' ? 'bg-forest-800 scale-125 shadow-sm' : voiceStatus === 'speaking' ? 'bg-sand-400' : 'bg-stone-300'}`} />
          <span className="font-medium text-stone-500 transition-all duration-300 flex items-center gap-2 text-sm tracking-tight">
            {isTransitioning ? 'Preparing your reflection...' :
              voiceStatus === 'processing' ? <><Loader2 size={12} className="animate-spin" /> Reflecting...</> :
                voiceStatus === 'speaking' ? <><Volume2 size={12} className="animate-pulse" /> Speaking...</> :
                  voiceStatus === 'listening' ? (interimInput ? 'Listening...' : 'Listening...') :
                    'Reflection Session'}
          </span>
        </div>

        {micError && (
          <div className="flex items-center gap-1 text-red-600 text-xs bg-red-50 px-2 py-1 rounded">
            <AlertCircle size={12} /> {micError}
          </div>
        )}

        {showFallbackLink && !isTransitioning && (
          <button onClick={() => onComplete(messages)} className="py-1 px-4 text-xs font-medium border border-forest-800 rounded-full text-forest-800 hover:bg-forest-800 hover:text-white transition-colors cursor-pointer">
            Generate Assessment
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 bg-sand-50 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`
                inline-block p-4 md:p-6 rounded-lg text-[15px] md:text-[16px] leading-relaxed relative tracking-wide
                ${msg.role === 'user'
                  ? 'bg-white text-sand-900 shadow-sm border border-stone-100'
                  : 'text-sand-900 font-serif text-[18px] md:text-[20px] bg-transparent px-0'}
              `}>
                {msg.text}
                {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-forest-800 animate-pulse align-middle" />}
              </div>
            </div>
          </div>
        ))}
        {/* Loading / Thinking State Visual */}
        {(voiceStatus === 'processing' || (isLoading && messages[messages.length - 1]?.isStreaming && messages[messages.length - 1]?.text === '')) && (
          <div className="flex flex-col items-start max-w-[85%] animate-in fade-in">
            <div className="flex items-center gap-3 text-stone-400 p-2 font-serif italic text-lg">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
                <div className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
                <div className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-bounce" />
              </div>
              <span className="text-forest-800/60">Reflecting...</span>
            </div>
          </div>
        )}

        {isTransitioning && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-stone-500 animate-in fade-in">
            <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-sand-900 animate-spin" />
            <span className="font-serif italic text-lg">
              Synthesizing your reflection...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-6 bg-white border-t border-stone-100 z-20 transition-colors duration-500">
        <div className="relative flex items-center gap-2">
          <textarea
            value={interimInput || input}
            onChange={(e) => { setInput(e.target.value); }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={voiceMode ? (voiceStatus === 'listening' ? "Listening..." : "Wait for response...") : "Share your thoughts..."}
            className={`
              w-full bg-sand-50 text-sand-900 placeholder:text-stone-400 rounded-lg py-3 md:py-4 pl-4 pr-16 md:pr-20 resize-none 
              focus:outline-none focus:ring-1 focus:ring-forest-800 border-none max-h-32 min-h-[50px] md:min-h-[64px] transition-all duration-300 text-sm md:text-base
              ${voiceStatus === 'listening' ? 'bg-forest-50/10 ring-1 ring-forest-100' : ''}
              ${interimInput ? 'text-stone-500' : ''} 
            `}
            rows={1}
            disabled={isLoading || voiceStatus === 'processing' || voiceStatus === 'speaking' || isTransitioning}
          />

          <div className="absolute right-2 md:right-3 flex items-center gap-1 md:gap-2">

            {/* Visualizer & Mic Button Container */}
            <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={80}
                height={80}
                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${voiceStatus === 'listening' ? 'opacity-100' : 'opacity-0'}`}
              />

              <button
                onClick={handleToggleVoice}
                className={`
                  relative z-10 p-2 md:p-2.5 rounded-full transition-all duration-300 border cursor-pointer
                  ${voiceMode
                    ? 'bg-transparent border-transparent text-forest-900 hover:scale-105'
                    : 'bg-transparent border-transparent text-stone-400 hover:bg-stone-100 hover:text-sand-900'}
                `}
                title={voiceMode ? "Stop Voice Mode" : "Start Voice Mode"}
                aria-label={voiceMode ? "Stop Voice Mode" : "Start Voice Mode"}
              >
                {voiceMode ? <Square size={16} className="md:w-[18px] md:h-[18px]" fill="currentColor" /> : <Mic size={18} className="md:w-[20px] md:h-[20px]" />}
              </button>
            </div>

            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !interimInput.trim()) || isLoading || isTransitioning}
              className="p-2 md:p-2.5 bg-forest-900 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors cursor-pointer"
              aria-label="Send message"
            >
              <Send size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        </div>
        <div className="text-center mt-2 md:mt-3 flex justify-center gap-4">
          <span className="text-[10px] md:text-[11px] font-medium tracking-wide text-stone-400 uppercase">
            {isTransitioning ? 'Generating reflection...' : voiceMode ? (voiceStatus === 'listening' ? "Speak naturally · I'll respond to silence" : "AI is thinking...") : "Reflect AI Assessment"}
          </span>
        </div>
      </div>
    </div>
  );
};
