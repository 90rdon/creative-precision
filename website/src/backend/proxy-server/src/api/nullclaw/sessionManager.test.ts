import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from './sessionManager';

describe('SessionManager', () => {
    beforeEach(() => {
        // Clear internal state between tests by removing known keys
        SessionManager.removeThread('test-session-1');
        SessionManager.removeThread('test-session-2');
    });

    it('should return undefined for an unknown session', async () => {
        const result = await SessionManager.getThreadId('nonexistent-session');
        expect(result).toBeUndefined();
    });

    it('should store and retrieve a thread mapping', async () => {
        await SessionManager.setThreadId('test-session-1', 'thread_abc123');
        const result = await SessionManager.getThreadId('test-session-1');
        expect(result).toBe('thread_abc123');
    });

    it('should overwrite an existing mapping', async () => {
        await SessionManager.setThreadId('test-session-1', 'thread_old');
        await SessionManager.setThreadId('test-session-1', 'thread_new');
        const result = await SessionManager.getThreadId('test-session-1');
        expect(result).toBe('thread_new');
    });

    it('should remove a mapping', async () => {
        await SessionManager.setThreadId('test-session-2', 'thread_xyz');
        await SessionManager.removeThread('test-session-2');
        const result = await SessionManager.getThreadId('test-session-2');
        expect(result).toBeUndefined();
    });

    it('should manage multiple sessions independently', async () => {
        await SessionManager.setThreadId('test-session-1', 'thread_A');
        await SessionManager.setThreadId('test-session-2', 'thread_B');
        expect(await SessionManager.getThreadId('test-session-1')).toBe('thread_A');
        expect(await SessionManager.getThreadId('test-session-2')).toBe('thread_B');
    });
});
