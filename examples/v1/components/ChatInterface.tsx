import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AppConfig } from '../types';
import { createChatSession, generateSpeech } from '../services/geminiService';
import { Button } from './Button';
import { Mic, Send, MoreHorizontal, Square, Volume2, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { GenerateContentResponse, Chat } from "@google/genai";

interface ChatInterfaceProps {
  config: AppConfig;
  onComplete: (history: Message[]) => void;
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
  
  // Base settings
  const centerX = width / 2;
  const centerY = height / 2;
  // Volume usually 0-255. Normalize to 0-1 for scaling.
  const intensity = Math.min(1, volume / 50); 
  const baseRadius = 20 + (intensity * 15);
  
  ctx.beginPath();
  
  // Create a blob shape using sine waves
  for (let i = 0; i <= 360; i += 10) {
    const angle = (i * Math.PI) / 180;
    // Noise factor based on time and angle
    const noise = Math.sin((i * 0.05) + (time * 0.005)) * (5 + (intensity * 10));
    const r = baseRadius + noise;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  
  ctx.closePath();
  
  // Gradient Fill
  const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.2, centerX, centerY, baseRadius * 2);
  gradient.addColorStop(0, 'rgba(57, 85, 75, 0.8)'); // Forest-800
  gradient.addColorStop(1, 'rgba(77, 107, 94, 0.0)'); // Forest-500 transparent

  ctx.fillStyle = gradient;
  ctx.fill();

  // Inner Core
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4 + (intensity * 2), 0, Math.PI * 2);
  ctx.fillStyle = '#F3F3EF'; // Sand-100
  ctx.fill();
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ config, onComplete }) => {
  // UI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [interimInput, setInterimInput] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [micError, setMicError] = useState<string | null>(null);

  // Refs for Logic
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef(''); // Syncs with input state for closures
  const voiceModeRef = useRef(false); // Syncs with voiceMode state for robust callbacks
  const voiceStatusRef = useRef<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  
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

  // --- 1. Initialization ---
  useEffect(() => {
    chatRef.current = createChatSession(config);
    setMessages([{ role: 'model', text: config.initialGreeting }]);
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
          for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
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
    // If we are already listening, don't restart
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
        console.log("🎙️ Microphone started listening");
        if (voiceModeRef.current) {
          setVoiceStatus('listening');
          setMicError(null);
        }
      };

      recognition.onend = () => {
        console.log("🛑 Microphone stopped listening");
        // Robust restart logic:
        // If voice mode is still ON, and we aren't currently speaking or processing,
        // then the browser stopped listening unexpectedly (silence timeout). Restart it.
        if (voiceModeRef.current && voiceStatusRef.current !== 'speaking' && voiceStatusRef.current !== 'processing') {
           setTimeout(() => {
             if (voiceModeRef.current && voiceStatusRef.current !== 'speaking' && voiceStatusRef.current !== 'processing') {
               console.log("🔄 Restarting microphone loop...");
               try { recognition.start(); } catch (e) { /* ignore */ }
             }
           }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        // Handle common non-fatal errors silently
        if (err === 'no-speech' || err === 'aborted' || !err) {
          return;
        }

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
          console.log("🎤 Final Voice Input:", finalTrans);
          const current = inputRef.current;
          const next = (current + ' ' + finalTrans).trim();
          setInput(next);
          inputRef.current = next;
          setInterimInput('');
          
          // Fast debounce (1.2s) for final results -> Feels snappy
          silenceTimerRef.current = setTimeout(() => {
            console.log("🚀 Sending message due to final silence detection");
            handleSend(next);
          }, 1200); 
        } else if (interimTrans) {
          console.log("👂 Interim Voice Input:", interimTrans);
          setInterimInput(interimTrans);
          // Slower debounce (2s) for interim (mid-thought pauses)
          silenceTimerRef.current = setTimeout(() => {
             console.log("🚀 Sending message due to interim silence detection");
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
        // Only set to idle if we were actually speaking and the queue is now empty
        // But wait a tiny bit to ensure no more chunks are coming
        setTimeout(() => {
          if (audioQueueRef.current.length === 0 && voiceStatusRef.current === 'speaking') {
            console.log("🔊 Queue empty, finished speaking");
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
    console.log("🎵 Queuing speech for:", text.substring(0, 30) + "...");
    
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
    // Legacy full-text speak (used for greeting or fallback)
    stopListening();
    audioQueueRef.current = []; // Clear queue
    isPlayingQueueRef.current = false;
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch(e) {}
    }
    await queueSpeech(text);
  };


  // --- 5. Main Handlers ---
  const handleToggleVoice = async () => {
    if (voiceMode) {
      // Turn Off
      console.log("⏹️ Voice mode toggled OFF");
      setVoiceMode(false);
      setVoiceStatus('idle');
      stopListening();
      stopVisualizer();
      if (sourceRef.current) sourceRef.current.stop();
    } else {
      // Turn On
      console.log("▶️ Voice mode toggled ON");
      setVoiceMode(true);
      await startVisualizer();
      
      // Feature: Speak the last message (greeting) if it exists and hasn't been spoken
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'model' && !lastMsg.isStreaming) {
        console.log("🗣️ Speaking previous message on toggle");
        await speak(lastMsg.text);
      } else {
        startListening();
      }
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || inputRef.current || input).trim();
    console.log("📤 Handling Send:", textToSend);
    if (!textToSend || !chatRef.current) return;

    // Reset UI for processing
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setInput('');
    inputRef.current = '';
    setInterimInput('');
    setIsLoading(true);
    
    // Reset streaming state
    sentenceBufferRef.current = '';
    processedSentencesRef.current.clear();
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch(e) {}
    }

    if (voiceMode) {
       setVoiceStatus('processing');
       stopListening(); 
    }

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);

    try {
      const streamResult = await chatRef.current.sendMessageStream({ message: userMsg.text });
      
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '', isStreaming: true }]);

      for await (const chunk of streamResult) {
        const text = (chunk as GenerateContentResponse).text || '';
        fullText += text;
        
        // Update UI
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'model', text: fullText, isStreaming: true };
          return copy;
        });

        // Streaming TTS logic
        if (voiceModeRef.current) {
          sentenceBufferRef.current += text;
          
          // Split by sentence boundaries but keep the boundary
          const sentences = sentenceBufferRef.current.split(/(?<=[.!?])\s+/);
          
          if (sentences.length > 1) {
            let combinedSentence = "";
            for (let i = 0; i < sentences.length - 1; i++) {
              const sentence = sentences[i].trim();
              if (sentence) {
                combinedSentence += (combinedSentence ? " " : "") + sentence;
                
                // If combined sentence is long enough (e.g. > 20 chars) or it's the last complete one
                if (combinedSentence.length > 20 || i === sentences.length - 2) {
                  if (!processedSentencesRef.current.has(combinedSentence)) {
                    processedSentencesRef.current.add(combinedSentence);
                    queueSpeech(combinedSentence);
                    combinedSentence = "";
                  }
                }
              }
            }
            // Keep the last (potentially incomplete) sentence AND any leftover combined text
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

      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'model', text: fullText, isStreaming: false };
        return copy;
      });

      setIsLoading(false);

    } catch (error) {
      console.error("Chat error", error);
      setIsLoading(false);
      if (voiceModeRef.current) {
         startListening(); 
      }
    }
  };

  // --- Render ---
  const isReadyForResults = messages.length > 4 && messages[messages.length - 1].role === 'model';

  return (
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto w-full bg-sand-50 rounded-lg shadow-sm border border-stone-200 overflow-hidden relative font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-stone-100 p-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${voiceStatus === 'listening' ? 'bg-forest-800 scale-125 shadow-sm' : voiceStatus === 'speaking' ? 'bg-sand-400' : 'bg-stone-300'}`} />
          <span className="font-medium text-stone-500 transition-all duration-300 flex items-center gap-2 text-sm tracking-tight">
            {voiceStatus === 'processing' ? <><Loader2 size={12} className="animate-spin" /> Reflecting...</> : 
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

        {isReadyForResults && (
           <Button variant="secondary" onClick={() => onComplete(messages)} className="py-1 px-4 text-xs font-medium border-forest-800 text-forest-800 hover:bg-forest-800 hover:text-white transition-colors">
             Generate Assessment
           </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-sand-50 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`
                inline-block p-6 rounded-lg text-[16px] leading-relaxed relative tracking-wide
                ${msg.role === 'user' 
                  ? 'bg-white text-sand-900 shadow-sm border border-stone-100' 
                  : 'text-sand-900 font-serif text-xl bg-transparent px-0'}
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
                  <div className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-bounce" />
                </div>
                <span className="text-forest-800/60">Reflecting...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-stone-100 z-20 transition-colors duration-500">
        <div className="relative flex items-center gap-2">
           <textarea
            value={interimInput || input}
            onChange={(e) => { setInput(e.target.value); }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={voiceMode ? (voiceStatus === 'listening' ? "Listening..." : "Wait for response...") : "Share your thoughts..."}
            className={`
              w-full bg-sand-50 text-sand-900 placeholder:text-stone-400 rounded-lg py-4 pl-4 pr-20 resize-none 
              focus:outline-none focus:ring-1 focus:ring-forest-800 border-none max-h-32 min-h-[64px] transition-all duration-300
              ${voiceStatus === 'listening' ? 'bg-forest-50/10 ring-1 ring-forest-100' : ''}
              ${interimInput ? 'text-stone-500' : ''} 
            `}
            rows={1}
            disabled={isLoading || voiceStatus === 'processing' || voiceStatus === 'speaking'}
          />
          
          <div className="absolute right-3 flex items-center gap-2">
             
            {/* Visualizer & Mic Button Container */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <canvas 
                ref={canvasRef}
                width={80}
                height={80}
                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${voiceStatus === 'listening' ? 'opacity-100' : 'opacity-0'}`}
              />
              
              <button
                onClick={handleToggleVoice}
                className={`
                  relative z-10 p-2.5 rounded-full transition-all duration-300 border
                  ${voiceMode 
                    ? 'bg-transparent border-transparent text-forest-900 hover:scale-105' 
                    : 'bg-transparent border-transparent text-stone-400 hover:bg-stone-100 hover:text-sand-900'}
                `}
                title={voiceMode ? "Stop Voice Mode" : "Start Voice Mode"}
              >
                {voiceMode ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
              </button>
            </div>

            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !interimInput.trim()) || isLoading}
              className="p-2.5 bg-forest-900 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <div className="text-center mt-3 flex justify-center gap-4">
             <span className="text-[11px] font-medium tracking-wide text-stone-400 uppercase">
               {voiceMode ? (voiceStatus === 'listening' ? "Speak naturally · I'll respond to silence" : "AI is thinking...") : "Reflect AI Assessment"}
             </span>
        </div>
      </div>
    </div>
  );
};