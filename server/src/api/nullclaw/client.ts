/**
 * NullClaw Expert Client
 *
 * Architecture Note (Updated 2026-03-02):
 * This client now uses the native NullClaw Gateway HTTP API (v1/responses).
 * Agent logic (system.md, heartbeats, tools) lives in the gateway agents.
 * The proxy server only facilitates the communication between the UI and NullClaw.
 * 
 * Session Management: 
 * We use NullClaw's native session handling by providing a session_id.
 * NullClaw persists the history internally per session.
 */

import { SessionManager } from './sessionManager';

export class NullClawClient {
    private static get baseUrl() {
        // Normalize endpoint URL by stripping common trailing prefixes to ensure 
        // the /v1/responses path is correctly formed
        const url = process.env.NULLCLAW_API_ENDPOINT || 'http://nullclaw-kube:18790';
        return url.replace(/\/api\/v1\/?$/, '');
    }

    private static get authToken() {
        // Auth token from nullclaw.json gateway.auth.token
        return process.env.NULLCLAW_TOKEN || '09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83';
    }

    private static get expertAgentId() {
        return 'expert';
    }

    /**
     * "Create a thread" = initialize a new session locally.
     * With NullClaw's Responses API, we don't strictly need a "create" call,
     * but we return a session ID generated for tracking.
     */
    static async createThread(): Promise<string> {
        const threadId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        console.log(`[NullClawClient] Initialized session ID: ${threadId}`);
        return threadId;
    }

    /**
     * Stub for API compatibility — SessionManager handles message storage if needed,
     * but NullClaw also keeps history internally when session_id is provided.
     */
    static async addMessage(threadId: string, content: string): Promise<void> {
        // In this architecture, we don't need to manually store history here,
        // but we'll log it for debugging and pass it to NullClaw in the next call.
        console.log(`[NullClawClient] Queueing message for session ${threadId}`);
    }

    /**
     * Start a streaming run via NullClaw Gateway.
     * Uses OpenResponses protocol format.
     */
    static async startStreamingRun(threadId: string): Promise<ReadableStream<Uint8Array> | null> {
        // Retrieve last message if we were using a history tracker, 
        // but for now, we'll assume the message is passed in req.body.content directly
        // in the proxy.ts caller, and actually we'll need to pass the message here.
        // Let's modify the signature to accept content directly as it's cleaner for v1/responses.
        return null; // Placeholder as we refactor the proxy caller too
    }

    /**
     * Stream response from the Expert agent via NullClaw Gateway.
     * Uses OpenResponses protocol and transforms it back to plain text for the proxy clients.
     */
    static async streamResponse(sessionId: string, content: string): Promise<ReadableStream<Uint8Array> | null> {
        const payload = {
            model: this.expertAgentId,
            input: content,
            stream: true
        };

        console.log(`[NullClawClient] Sending request to ${this.baseUrl}/v1/responses for session ${sessionId}`);

        const response = await fetch(`${this.baseUrl}/v1/responses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            signal: AbortSignal.timeout(60000),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`[NullClawClient] Gateway call failed (${response.status}): ${error.slice(0, 200)}`);
        }

        const body = response.body;
        if (!body) return null;

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        let buffer = '';

        // Transform OpenResponses SSE -> Plain Text with line buffering
        const transform = new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
                buffer += decoder.decode(chunk, { stream: true });
                const lines = buffer.split('\n');
                // Keep the last partial line in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                    const rawData = trimmedLine.slice(6).trim();
                    if (rawData === '[DONE]') continue;

                    try {
                        const data = JSON.parse(rawData);
                        let delta = '';
                        if (data.type === 'response.output_text.delta') {
                            delta = data.delta || '';
                        }

                        if (delta) {
                            controller.enqueue(encoder.encode(delta));
                        }
                    } catch (e) {
                        // Skip malformed packets
                    }
                }
            },
            flush(controller) {
                // Process any remaining data in the buffer
                if (buffer && buffer.startsWith('data: ')) {
                    const rawData = buffer.slice(6).trim();
                    if (rawData !== '[DONE]') {
                        try {
                            const data = JSON.parse(rawData);
                            const delta = data.delta?.text || data.part?.text || '';
                            if (delta) controller.enqueue(encoder.encode(delta));
                        } catch { }
                    }
                }
            }
        });

        return body.pipeThrough(transform);
    }
}

