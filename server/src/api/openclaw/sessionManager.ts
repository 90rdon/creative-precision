/**
 * Manager to handle mapping of browser sessions to OpenClaw thread IDs
 * and conversation history per thread.
 * V0.1: Using In-Memory Storage (will clear on server restart).
 */

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export class SessionManager {
    // Map<browserSessionId, openClawThreadId>
    private static sessions: Map<string, string> = new Map();

    // Map<threadId, chatHistory>
    private static history: Map<string, ChatMessage[]> = new Map();

    // --- Session → Thread mapping ---

    static async getThreadId(browserSessionId: string): Promise<string | undefined> {
        return this.sessions.get(browserSessionId);
    }

    static async setThreadId(browserSessionId: string, openClawThreadId: string): Promise<void> {
        this.sessions.set(browserSessionId, openClawThreadId);
        // Initialize empty history for new thread
        if (!this.history.has(openClawThreadId)) {
            this.history.set(openClawThreadId, []);
        }
        console.log(`[SessionManager] Mapped ${browserSessionId} → ${openClawThreadId}`);
    }

    static async removeThread(browserSessionId: string): Promise<void> {
        const threadId = this.sessions.get(browserSessionId);
        this.sessions.delete(browserSessionId);
        if (threadId) {
            this.history.delete(threadId);
            console.log(`[SessionManager] Removed session ${browserSessionId} and thread ${threadId}`);
        }
    }

    // --- Conversation History ---

    static async getHistory(threadId: string): Promise<ChatMessage[]> {
        return this.history.get(threadId) || [];
    }

    static async setHistory(threadId: string, messages: ChatMessage[]): Promise<void> {
        this.history.set(threadId, messages);
    }
}
