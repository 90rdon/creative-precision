import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NullClawClient } from './client';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('NullClawClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NULLCLAW_API_ENDPOINT = 'http://localhost:18790';
        process.env.NULLCLAW_TOKEN = 'test-token-abc';
    });

    afterEach(() => {
        delete process.env.NULLCLAW_API_ENDPOINT;
        delete process.env.NULLCLAW_TOKEN;
    });

    describe('createThread', () => {
        it('should return a generated session ID string', async () => {
            const threadId = await NullClawClient.createThread();
            expect(threadId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        });
    });

    describe('sendMessage', () => {
        it('should POST to /webhook with correct payload and headers including UUID', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ response: 'Hello' })
            });

            const responseText = await NullClawClient.sendMessage('session-123', 'Testing');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:18790/webhook',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token-abc',
                        'Content-Type': 'application/json'
                    }),
                    body: expect.stringContaining('"message":"Testing"')
                })
            );

            // Verifying payload structure properties
            const callArgs = mockFetch.mock.calls[0][1];
            const bodyObj = JSON.parse(callArgs.body);
            expect(bodyObj.message).toBe('Testing');
            expect(bodyObj.session_id).toBe('session-123');
            expect(bodyObj.request_id).toBeDefined();

            expect(responseText).toBe('Hello');
        });

        it('should throw if gateway returns non-ok status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                text: async () => 'Forbidden'
            });

            await expect(NullClawClient.sendMessage('s1', 'hi'))
                .rejects.toThrow(/Gateway call failed \(403\): Forbidden/);
        });
    });
});
