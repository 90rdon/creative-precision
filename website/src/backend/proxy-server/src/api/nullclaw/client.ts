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

import { v4 as uuidv4 } from 'uuid';
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
     * Send a message to NullClaw Gateway via /webhook endpoint instead of /v1/responses.
     */
    static async sendMessage(sessionId: string, content: string): Promise<string> {
        const payload = {
            message: content,
            session_id: sessionId,
            request_id: uuidv4()
        };

        console.log(`[NullClawClient] Sending request to ${this.baseUrl}/v1/responses for session ${sessionId}`);

        let retries = 2; // Increased to 2 retries just to be safe
        while (true) {
            try {
                const response = await fetch(`${this.baseUrl}/v1/responses`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.authToken}`,
                        'Connection': 'close'
                    },
                    signal: AbortSignal.timeout(60000),
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`[NullClawClient] Gateway call failed (${response.status}): ${error.slice(0, 200)}`);
                }

                const data = await response.json() as { response?: string, status?: string };
                return data.response || data.status || "Acknowledged";
            } catch (err: any) {
                const code = err?.cause?.code || err?.code;
                if (code === 'UND_ERR_SOCKET' && retries > 0) {
                    console.warn(`[NullClawClient] Socket closed unexpectedly (UND_ERR_SOCKET) connecting to /v1/responses. Retrying... (${retries} retries left)`);
                    retries--;
                    continue;
                }
                throw err;
            }
        }
    }
}

