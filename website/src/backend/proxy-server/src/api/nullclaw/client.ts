/**
 * NullClaw Expert Client
 *
 * Architecture Note (Updated 2026-03-09):
 * This client uses the NullClaw Webhook Router endpoint.
 *
 * - Proxy server is transport-only (no AI thinking)
 * - All AI processes and persona routing happen inside nullclaw-kube
 * - Webhook router at /webhook routes requests to appropriate agents
 *
 * Session Management:
 * - Session IDs are generated and tracked by SessionManager
 * - nullclaw-kube handles conversation history internally
 * - Webhook router routes based on agent_id parameter
 */

import { v4 as uuidv4 } from 'uuid';
import { SessionManager } from './sessionManager';

export class NullClawClient {
    /**
     * Webhook router base URL
     * Default connects to nullclaw-kube webhook router service
     */
    private static get webhookUrl() {
        // Determine which host to use
        // - If WEBHOOK_ROUTER_URL is set, use it (direct webhook router)
        // - Otherwise use NULLCLAW_API_ENDPOINT with /webhook path
        const webhookUrl = process.env.WEBHOOK_ROUTER_URL;
        if (webhookUrl) {
            return webhookUrl.replace(/\/$/, ''); // Strip trailing slash
        }

        // Fallback to constructing from NULLCLAW_API_ENDPOINT
        const nullclawUrl = process.env.NULLCLAW_API_ENDPOINT || 'http://nullclaw-kube:18790';

        // Strip existing paths and construct webhook URL
        const baseUrl = nullclawUrl.replace(/\/(v1\/)?responses?$/, '')
                                       .replace(/\/webhook$/, '');

        return `${baseUrl}/webhook`;
    }

    /**
     * Auth token for webhook endpoint
     */
    private static get authToken() {
        return process.env.WEBHOOK_TOKEN ||
               process.env.NULLCLAW_TOKEN ||
               '09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83';
    }

    /**
     * Create a thread = initialize new session
     * Session ID is generated locally for tracking
     */
    static async createThread(): Promise<string> {
        const threadId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        console.log(`[NullClawClient] Initialized session ID: ${threadId}`);
        return threadId;
    }

    /**
     * Stub for API compatibility
     * SessionManager handles message storage if needed
     */
    static async addMessage(threadId: string, content: string): Promise<void> {
        console.log(`[NullClawClient] Queueing message for session ${threadId}`);
    }

    /**
     * Start a streaming run via webhook router
     * Streams the response back to the client
     */
    static async startStreamingRun(sessionId: string, message: string): Promise<ReadableStream | null> {
        try {
            const webhookUrl = this.webhookUrl;
            console.log(`[NullClawClient] Starting stream for session ${sessionId} to ${webhookUrl}`);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    session_id: sessionId,
                    request_id: uuidv4(),
                    agent_id: 'expert'
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`[NullClawClient] Webhook stream error: ${response.status}`, error);
                return null;
            }

            return response.body;
        } catch (error) {
            console.error('[NullClawClient] Failed to start stream', error);
            return null;
        }
    }

    /**
     * Send a message to the webhook router
     * Routes to appropriate agent based on agent_id
     */
    static async sendMessage(sessionId: string, content: string): Promise<string> {
        const webhookUrl = this.webhookUrl;
        const request_id = uuidv4();

        console.log(`[NullClawClient] Sending request to ${webhookUrl} for session ${sessionId}`);

        let retries = 2;
        while (true) {
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: AbortSignal.timeout(60000),
                    body: JSON.stringify({
                        message: content,
                        session_id: sessionId,
                        request_id,
                        agent_id: 'expert'
                    })
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`[NullClawClient] Gateway call failed (${response.status}): ${error.slice(0, 200)}`);
                }

                const data = await response.json() as { response?: string, status?: string };
                return data.response || data.status || 'Acknowledged';
            } catch (err: any) {
                const code = err?.cause?.code || err?.code;
                if (code === 'UND_ERR_SOCKET' && retries > 0) {
                    console.warn(`[NullClawClient] Socket closed unexpectedly (UND_ERR_SOCKET). Retrying... (${retries} retries left)`);
                    retries--;
                    continue;
                }
                throw err;
            }
        }
    }
}

