import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenClawClient } from './client';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('OpenClawClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.OPENCLAW_API_ENDPOINT = 'http://localhost:18790/api/v1';
        process.env.OPENCLAW_TOKEN = 'test-token-abc';
    });

    afterEach(() => {
        delete process.env.OPENCLAW_API_ENDPOINT;
        delete process.env.OPENCLAW_TOKEN;
    });

    describe('createThread', () => {
        it('should POST to /threads and return the thread id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'thread_abc123' })
            });

            const threadId = await OpenClawClient.createThread();

            expect(threadId).toBe('thread_abc123');
            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toContain('/threads');
            expect(opts.method).toBe('POST');
            expect(opts.headers['Authorization']).toBe('Bearer test-token-abc');
        });

        it('should throw if the response is not ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Unauthorized'
            });

            await expect(OpenClawClient.createThread()).rejects.toThrow(/createThread failed/);
        });
    });

    describe('addMessage', () => {
        it('should POST to /threads/:id/messages with correct body', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            await OpenClawClient.addMessage('thread_abc', 'Hello expert');

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toContain('/threads/thread_abc/messages');
            const body = JSON.parse(opts.body);
            expect(body.role).toBe('user');
            expect(body.content).toBe('Hello expert');
        });

        it('should throw on failed message add', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Not Found'
            });

            await expect(OpenClawClient.addMessage('invalid', 'test')).rejects.toThrow(/addMessage failed/);
        });
    });

    describe('startStreamingRun', () => {
        it('should POST to /threads/:id/runs with stream:true and return body', async () => {
            const mockBody = {};
            mockFetch.mockResolvedValueOnce({
                ok: true,
                body: mockBody
            });

            const result = await OpenClawClient.startStreamingRun('thread_abc');

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toContain('/threads/thread_abc/runs');
            const body = JSON.parse(opts.body);
            expect(body.stream).toBe(true);
            expect(body.assistant_id).toBe('expert');
            expect(result).toBe(mockBody);
        });

        it('should throw if run start fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Internal Server Error'
            });

            await expect(OpenClawClient.startStreamingRun('thread_xyz')).rejects.toThrow(/startStreamingRun failed/);
        });
    });
});
