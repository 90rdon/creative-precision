import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initSession, updateSession, trackEvent } from './telemetryService';
import * as supabaseJs from '@supabase/supabase-js';

// Mock the Vite Env
vi.mock('@supabase/supabase-js', () => {
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    const fromMock = vi.fn().mockReturnValue({ insert: insertMock, update: updateMock });

    return {
        createClient: vi.fn(() => ({
            from: fromMock
        }))
    };
});

describe('Telemetry Service', () => {
    const originalEnv = import.meta.env;

    beforeEach(() => {
        vi.resetAllMocks();
        (import.meta as any).env = {
            ...originalEnv,
            VITE_SUPABASE_URL: 'https://test.supabase.co',
            VITE_SUPABASE_ANON_KEY: 'test-key',
        };
    });

    describe('initSession', () => {
        it('initializes a session', () => {
            expect(() => initSession({ session_id: 'test-123' })).not.toThrow();
        });

        it('silently fails if URL or KEY is missing', () => {
            (import.meta as any).env = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
            expect(() => initSession({ session_id: 'test-123' })).not.toThrow();
        });
    });

    describe('updateSession', () => {
        it('updates a session', () => {
            expect(() => updateSession('test-123', { message_count: 5 })).not.toThrow();
        });

        it('silently fails if URL or KEY is missing', () => {
            (import.meta as any).env = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
            expect(() => updateSession('test-123', { message_count: 5 })).not.toThrow();
        });
    });

    describe('trackEvent', () => {
        it('tracks an event successfully', () => {
            expect(() => trackEvent({ session_id: '123', event_type: 'test_event', event_data: {} })).not.toThrow();
        });

        it('silently fails if URL or KEY is missing', () => {
            (import.meta as any).env = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
            expect(() => trackEvent({ session_id: '123', event_type: 'test_event', event_data: {} })).not.toThrow();
        });
    });
});
