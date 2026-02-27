import { useRef, useCallback, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

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


interface UseTextToSpeechProps {
    setVoiceStatus: (status: VoiceStatus) => void;
    voiceStatus: VoiceStatus;
    voiceMode: boolean;
    onSpeechEnd: () => void;
}

export const useTextToSpeech = ({ setVoiceStatus, voiceStatus, voiceMode, onSpeechEnd }: UseTextToSpeechProps) => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioQueueRef = useRef<AudioBuffer[]>([]);
    const isPlayingQueueRef = useRef(false);

    const voiceStatusRef = useRef(voiceStatus);
    const voiceModeRef = useRef(voiceMode);

    useEffect(() => {
        voiceStatusRef.current = voiceStatus;
    }, [voiceStatus]);

    useEffect(() => {
        voiceModeRef.current = voiceMode;
    }, [voiceMode]);

    const playNextInQueue = useCallback(async () => {
        if (isPlayingQueueRef.current || audioQueueRef.current.length === 0) {
            if (audioQueueRef.current.length === 0 && voiceStatusRef.current === 'speaking') {
                setTimeout(() => {
                    if (audioQueueRef.current.length === 0 && voiceStatusRef.current === 'speaking') {
                        onSpeechEnd();
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
            const ctx = audioCtxRef.current!;
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
    }, [onSpeechEnd, setVoiceStatus]);


    const queueSpeech = useCallback(async (text: string) => {
        if (!text.trim()) return;

        try {
            const base64 = await generateSpeech(text);
            if (!base64) return;

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass();
            const ctx = audioCtxRef.current;

            const bytes = decode(base64);
            const buffer = await decodeAudioData(bytes, ctx!);

            audioQueueRef.current.push(buffer);
            playNextInQueue();
        } catch (e) {
            console.error("Queueing speech failed", e);
        }
    }, [playNextInQueue]);

    const speak = useCallback(async (text: string) => {
        audioQueueRef.current = [];
        isPlayingQueueRef.current = false;
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (e) { }
        }
        await queueSpeech(text);
    }, [queueSpeech]);

    const stopPlayback = useCallback(() => {
        audioQueueRef.current = [];
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (e) { }
        }
        isPlayingQueueRef.current = false;
    }, []);

    return { speak, stopPlayback };
};
