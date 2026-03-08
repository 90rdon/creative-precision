import { useRef, useCallback, useEffect } from 'react';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface UseSpeechRecognitionProps {
    onTranscript: (interim: string, final: string) => void;
    onMicError?: (err: string) => void;
    voiceMode: boolean;
    voiceStatus: VoiceStatus;
    setVoiceStatus: (status: VoiceStatus) => void;
    setVoiceMode: (mode: boolean) => void;
}

export const useSpeechRecognition = ({
    onTranscript,
    onMicError,
    voiceMode,
    voiceStatus,
    setVoiceStatus,
    setVoiceMode,
}: UseSpeechRecognitionProps) => {
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const voiceModeRef = useRef(voiceMode);
    const voiceStatusRef = useRef(voiceStatus);

    useEffect(() => {
        voiceModeRef.current = voiceMode;
    }, [voiceMode]);

    useEffect(() => {
        voiceStatusRef.current = voiceStatus;
    }, [voiceStatus]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && voiceStatusRef.current === 'listening') return;

        if (!recognitionRef.current) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                if (onMicError) onMicError("Speech recognition not supported.");
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                if (voiceModeRef.current) {
                    setVoiceStatus('listening');
                    if (onMicError) onMicError('');
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
                    if (onMicError) onMicError("Microphone blocked or not allowed.");
                    setVoiceMode(false);
                    setVoiceStatus('idle');
                } else if (err === 'network') {
                    if (onMicError) onMicError("Network error with speech recognition.");
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

                onTranscript(interimTrans, finalTrans);
            };

            recognitionRef.current = recognition;
        }

        try {
            recognitionRef.current.start();
        } catch (e) {
            // already started or starting
        }
    }, [onTranscript, setVoiceStatus, setVoiceMode, onMicError]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }, []);

    return { startListening, stopListening, silenceTimerRef };
};
