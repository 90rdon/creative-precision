import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenClawClient } from './client';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('OpenClawClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.OPENCLAW_API_ENDPOINT = 'http://localhost:18790';
        process.env.OPENCLAW_TOKEN = 'test-token-abc';
    });

    afterEach(() => {
        delete process.env.OPENCLAW_API_ENDPOINT;
        delete process.env.OPENCLAW_TOKEN;
    });

    describe('createThread', () => {
        it('should return a generated session ID string', async () => {
            const threadId = await OpenClawClient.createThread();
            expect(threadId).toMatch(/^sess_\d+_\w+/);
        });
    });

    describe('streamResponse', () => {
        it('should POST to /v1/responses with correct payload and headers', async () => {
            // Mock a simple readable stream
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('data: {"type": "response.output_text.delta", "delta": "Hello"}\n'));
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n'));
                    controller.close();
                }
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                body: mockStream
            });

            const stream = await OpenClawClient.streamResponse('session-123', 'Testing');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:18790/v1/responses',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token-abc',
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        model: 'expert',
                        input: 'Testing',
                        stream: true
                    })
                })
            );

            expect(stream).not.toBeNull();

            // Verify streaming transformation
            const reader = stream!.getReader();
            const { value } = await reader.read();
            expect(new TextDecoder().decode(value)).toBe('Hello');
        });

        it('should throw if gateway returns non-ok status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                text: async () => 'Forbidden'
            });

            await expect(OpenClawClient.streamResponse('s1', 'hi'))
                .rejects.toThrow(/Gateway call failed \(403\): Forbidden/);
        });
    });
});
