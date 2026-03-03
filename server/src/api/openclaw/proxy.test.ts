import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import proxyRouter from './proxy';

// --- Mock dependencies ---
vi.mock('./sessionManager', () => ({
    SessionManager: {
        getThreadId: vi.fn(),
        setThreadId: vi.fn(),
        removeThread: vi.fn(),
    }
}));

vi.mock('./client', () => ({
    OpenClawClient: {
        createThread: vi.fn(),
        addMessage: vi.fn(),
        streamResponse: vi.fn(),
    }
}));

vi.mock('../telegram/bot', () => ({
    sendAdminAlert: vi.fn().mockResolvedValue(true)
}));

vi.mock('../telegram/formatters', () => ({
    TelegramFormatter: {
        formatNewSessionAlert: vi.fn().mockReturnValue('mock-alert-text')
    }
}));

// Import after mocking
import { SessionManager } from './sessionManager';
import { OpenClawClient } from './client';
import { sendAdminAlert } from '../telegram/bot';

// Build a minimal express app around the router
const app = express();
app.use(express.json());
app.use('/api/assessment', proxyRouter);

describe('POST /api/assessment/init', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new session and return sessionId when none exists', async () => {
        vi.mocked(SessionManager.getThreadId).mockResolvedValue(undefined);
        vi.mocked(OpenClawClient.createThread).mockResolvedValue('thread_new123');

        const res = await request(app)
            .post('/api/assessment/init')
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.sessionId).toBeTruthy();
        expect(res.body.openClawThreadId).toBe('thread_new123');
        expect(OpenClawClient.createThread).toHaveBeenCalledOnce();
        expect(SessionManager.setThreadId).toHaveBeenCalledOnce();
    });

    it('should reuse an existing session when valid browserSessionId is sent', async () => {
        vi.mocked(SessionManager.getThreadId).mockResolvedValue('thread_existing');

        const res = await request(app)
            .post('/api/assessment/init')
            .send({ browserSessionId: 'existing-browser-session' });

        expect(res.status).toBe(200);
        expect(res.body.sessionId).toBe('existing-browser-session');
        expect(res.body.openClawThreadId).toBe('thread_existing');
        // Should NOT create a new thread
        expect(OpenClawClient.createThread).not.toHaveBeenCalled();
    });

    it('should fire a Telegram alert only for NEW sessions', async () => {
        vi.mocked(SessionManager.getThreadId).mockResolvedValue(undefined);
        vi.mocked(OpenClawClient.createThread).mockResolvedValue('thread_xyz');

        await request(app).post('/api/assessment/init').send({});

        // Give async fire-and-forget time to execute
        await new Promise(r => setTimeout(r, 50));
        expect(sendAdminAlert).toHaveBeenCalledOnce();
    });

    it('should NOT fire a Telegram alert when reconnecting an existing session', async () => {
        vi.mocked(SessionManager.getThreadId).mockResolvedValue('thread_existing');

        await request(app)
            .post('/api/assessment/init')
            .send({ browserSessionId: 'existing-session' });

        await new Promise(r => setTimeout(r, 50));
        expect(sendAdminAlert).not.toHaveBeenCalled();
    });

    it('should return 500 when OpenClaw createThread fails', async () => {
        vi.mocked(SessionManager.getThreadId).mockResolvedValue(undefined);
        vi.mocked(OpenClawClient.createThread).mockRejectedValue(new Error('Connection refused'));

        const res = await request(app).post('/api/assessment/init').send({});

        expect(res.status).toBe(500);
        expect(res.body.status).toBe('error');
    });
});

describe('POST /api/assessment/message', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if sessionId or content is missing', async () => {
        const res = await request(app)
            .post('/api/assessment/message')
            .send({ sessionId: 'abc' }); // missing content

        expect(res.status).toBe(400);
    });

    it('should return 404 if session is not found', async () => {
        vi.mocked(SessionManager.getThreadId).mockResolvedValue(undefined);

        const res = await request(app)
            .post('/api/assessment/message')
            .send({ sessionId: 'unknown-session', content: 'Hello' });

        expect(res.status).toBe(404);
    });

    it('should call streamResponse and stream the response', async () => {
        vi.mocked(SessionManager.getThreadId).mockResolvedValue('thread_abc');

        // Simulate a readable stream that yields a single chunk
        const encoder = new TextEncoder();
        const chunk = encoder.encode('Hello from OpenClaw');
        const mockStream = new ReadableStream({
            start(controller) {
                controller.enqueue(chunk);
                controller.close();
            }
        });
        vi.mocked(OpenClawClient.streamResponse).mockResolvedValue(mockStream as any);

        const res = await request(app)
            .post('/api/assessment/message')
            .send({ sessionId: 'session-valid', content: 'What is my bottleneck?' });

        expect(res.status).toBe(200);
        expect(OpenClawClient.streamResponse).toHaveBeenCalledWith('thread_abc', 'What is my bottleneck?');
        expect(res.text).toContain('Hello from OpenClaw');
    });
});
