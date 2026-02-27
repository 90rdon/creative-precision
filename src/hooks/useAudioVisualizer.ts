import { useRef, useCallback } from 'react';

// --- Visualizer Helper: Organic Blob ---
export const drawBlob = (
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

export const useAudioVisualizer = () => {
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const startVisualizer = useCallback(async (canvas: HTMLCanvasElement | null, onMicError?: (err: string) => void) => {
        try {
            if (!streamRef.current) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContextClass();
            }

            const ctx = audioCtxRef.current!;
            if (ctx.state === 'suspended') await ctx.resume();

            const source = ctx.createMediaStreamSource(streamRef.current);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const animate = (time: number) => {
                if (analyserRef.current && canvas) {
                    const bufferLength = analyserRef.current.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    analyserRef.current.getByteFrequencyData(dataArray);

                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
                    const avg = sum / bufferLength;

                    const canvasCtx = canvas.getContext('2d');
                    if (canvasCtx) {
                        drawBlob(canvasCtx, canvas.width, canvas.height, avg, time);
                    }
                }
                animationRef.current = requestAnimationFrame(animate);
            };
            animationRef.current = requestAnimationFrame(animate);

        } catch (e) {
            console.error("Visualizer setup failed", e);
            if (onMicError) onMicError("Microphone access needed for visualizer.");
        }
    }, []);

    const stopVisualizer = useCallback(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    return { startVisualizer, stopVisualizer };
};
