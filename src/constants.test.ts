import { describe, it, expect } from 'vitest';
import { CLOSE_SIGNAL_PHRASES, DEFAULT_CONFIG } from './constants';

describe('Constants', () => {
    it('should export an array of CLOSE_SIGNAL_PHRASES', () => {
        expect(Array.isArray(CLOSE_SIGNAL_PHRASES)).toBe(true);
        expect(CLOSE_SIGNAL_PHRASES.length).toBeGreaterThan(0);
    });

    it('should contain expected close signal phrases', () => {
        expect(CLOSE_SIGNAL_PHRASES).toContain('let me synthesize');
        expect(CLOSE_SIGNAL_PHRASES).toContain('let me pull together');
    });

    it('should export DEFAULT_CONFIG with the correct modelName and instruction structure', () => {
        expect(DEFAULT_CONFIG).toHaveProperty('modelName', 'gemini-3-flash-preview');
        expect(DEFAULT_CONFIG.systemInstruction).toContain('You are Reflect');
        expect(DEFAULT_CONFIG.systemInstruction).toContain('THE 7-MOMENT JOURNEY:');
        expect(DEFAULT_CONFIG.systemInstruction).toContain('MOMENT 7 — CLOSE:');
    });
});
