import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AppConfig, AssessmentEvent } from '../types';
import { createChatSession, generateSpeech } from '../services/geminiService';
import { CLOSE_SIGNAL_PHRASES } from '../constants';
import { Mic, Send, MoreHorizontal, Square, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { GenerateContentResponse, Chat } from "@google/genai";

interface ChatInterfaceProps {
  config: AppConfig;
  onComplete: (history: Message[]) => void;
  sessionId?: string;
  onTrackEvent?: (event: AssessmentEvent) => void;
}

// --- Audio Helpers ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Visualizer Helper: Organic Blob ---
const drawBlob = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  volume: number,
  time: number
) => {
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const intensity = Math.min(1, volume / 50);
  const baseRadius = 20 + (intensity * 15);

  ctx.beginPath();

  for (let i = 0; i <= 360; i += 10) {
    const angle = (i * Math.PI) / 180;
    const noise = Math.sin((i * 0.05) + (time * 0.005)) * (5 + (intensity * 10));
    const r = baseRadius + noise;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();

  const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.2, centerX, centerY, baseRadius * 2);
  gradient.addColorStop(0, 'rgba(57, 85, 75, 0.8)');
  gradient.addColorStop(1, 'rgba(77, 107, 94, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, 4 + (intensity * 2), 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#F0EDE6';
  ctx.fill();
};

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
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef('');
  const voiceModeRef = useRef(false);
  const voiceStatusRef = useRef<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const messagesRef = useRef<Message[]>([]);

  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Audio Queue Refs
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingQueueRef = useRef(false);
  const sentenceBufferRef = useRef('');
  const processedSentencesRef = useRef<Set<string>>(new Set());

  // --- Telemetry helper ---
  const track = useCallback((eventType: string, eventData?: Record<string, unknown>) => {
    if (onTrackEvent && sessionId) {
      onTrackEvent({ session_id: sessionId, event_type: eventType, event_data: eventData });
    }
  }, [onTrackEvent, sessionId]);

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
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    voiceStatusRef.current = voiceStatus;
  }, [voiceStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimInput, voiceStatus]);

  // --- 2. Visualizer Loop ---
  const startVisualizer = async () => {
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(streamRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const animate = (time: number) => {
        if (analyserRef.current && canvasRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const avg = sum / bufferLength;

          const canvasCtx = canvasRef.current.getContext('2d');
          if (canvasCtx) {
            drawBlob(canvasCtx, canvasRef.current.width, canvasRef.current.height, avg, time);
          }
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);

    } catch (e) {
      console.error("Visualizer setup failed", e);
      setMicError("Microphone access needed for visualizer.");
    }
  };

  const stopVisualizer = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // --- 3. Speech Recognition Logic ---
  const startListening = useCallback(() => {
    if (recognitionRef.current && voiceStatusRef.current === 'listening') return;

    if (!recognitionRef.current) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setMicError("Speech recognition not supported.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (voiceModeRef.current) {
          setVoiceStatus('listening');
          setMicError(null);
        }
      };

      recognition.onend = () => {
        if (voiceModeRef.current && voiceStatusRef.current !== 'speaking' && voiceStatusRef.current !== 'processing') {
          setTimeout(() => {
            if (voiceModeRef.current && voiceStatusRef.current !== 'speaking' && voiceStatusRef.current !== 'processing') {
              try { recognition.start(); } catch (e) { /* ignore */ }
            }
          }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        if (err === 'no-speech' || err === 'aborted' || !err) return;

        console.error("Microphone error:", err);
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setMicError("Microphone blocked or not allowed.");
          setVoiceMode(false);
          setVoiceStatus('idle');
        } else if (err === 'network') {
          setMicError("Network error with speech recognition.");
        }
      };

      recognition.onresult = (event: any) => {
        let finalTrans = '';
        let interimTrans = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (finalTrans) {
          const current = inputRef.current;
          const next = (current + ' ' + finalTrans).trim();
          setInput(next);
          inputRef.current = next;
          setInterimInput('');

          silenceTimerRef.current = setTimeout(() => {
            handleSend(next);
          }, 1200);
        } else if (interimTrans) {
          setInterimInput(interimTrans);
          silenceTimerRef.current = setTimeout(() => {
            const current = inputRef.current;
            const combined = (current + ' ' + interimTrans).trim();
            handleSend(combined);
          }, 2000);
        }
      };

      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      // already started or starting
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);


  // --- 4. TTS Logic ---
  const playNextInQueue = useCallback(async () => {
    if (isPlayingQueueRef.current || audioQueueRef.current.length === 0) {
      if (audioQueueRef.current.length === 0 && voiceStatusRef.current === 'speaking') {
        setTimeout(() => {
          if (audioQueueRef.current.length === 0 && voiceStatusRef.current === 'speaking') {
            if (voiceModeRef.current) {
              startListening();
            } else {
              setVoiceStatus('idle');
            }
          }
        }, 100);
      }
      return;
    }

    isPlayingQueueRef.current = true;
    setVoiceStatus('speaking');
    const buffer = audioQueueRef.current.shift()!;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      source.onended = () => {
        isPlayingQueueRef.current = false;
        playNextInQueue();
      };

      sourceRef.current = source;
      source.start();
    } catch (e) {
      console.error("Playback failed", e);
      isPlayingQueueRef.current = false;
      playNextInQueue();
    }
  }, [startListening]);

  const queueSpeech = async (text: string) => {
    if (!text.trim()) return;

    try {
      const base64 = await generateSpeech(text);
      if (!base64) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass();
      const ctx = audioCtxRef.current;

      const bytes = decode(base64);
      const buffer = await decodeAudioData(bytes, ctx);

      audioQueueRef.current.push(buffer);
      playNextInQueue();
    } catch (e) {
      console.error("Queueing speech failed", e);
    }
  };

  const speak = async (text: string) => {
    stopListening();
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) { }
    }
    await queueSpeech(text);
  };


  // --- 5. Main Handlers ---
  const handleToggleVoice = async () => {
    if (voiceMode) {
      setVoiceMode(false);
      setVoiceStatus('idle');
      stopListening();
      stopVisualizer();
      if (sourceRef.current) sourceRef.current.stop();
    } else {
      setVoiceMode(true);
      await startVisualizer();

      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'model' && !lastMsg.isStreaming) {
        await speak(lastMsg.text);
      } else {
        startListening();
      }
    }
  };

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
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) { }
    }

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
                    queueSpeech(combinedSentence);
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
          queueSpeech(remaining);
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

        // Halt STT and clear TTS queues to prevent audio collisions during transition
        stopListening();
        audioQueueRef.current = [];
        isPlayingQueueRef.current = false;
        if (sourceRef.current) {
          try { sourceRef.current.stop(); } catch (e) { }
        }

        setTimeout(() => {
          onComplete(messagesRef.current);
        }, 3000);
      }

    } catch (error) {
      console.error("Chat error", error);
      setIsLoading(false);
      if (voiceModeRef.current) {
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
