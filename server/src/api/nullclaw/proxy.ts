import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SessionManager } from './sessionManager';
import { NullClawClient } from './client';
import { sendAdminAlert } from '../telegram/bot';
import { TelegramFormatter } from '../telegram/formatters';

const router = Router();

/**
 * @route   POST /api/assessment/init
 * @desc    Initialize a new NullClaw expert thread for a browser session
 */
router.post('/init', async (req, res) => {
    try {
        let { browserSessionId } = req.body;

        // If no ID provided, generate one
        if (!browserSessionId) {
            browserSessionId = uuidv4();
        }

        // Check if we already have a mapping
        let threadId = await SessionManager.getThreadId(browserSessionId);
        let isNewSession = false;

        if (!threadId) {
            // Create new thread in NullClaw
            threadId = await NullClawClient.createThread();
            await SessionManager.setThreadId(browserSessionId, threadId);
            isNewSession = true;
        }

        // Response immediately
        res.json({
            status: 'success',
            sessionId: browserSessionId,
            openClawThreadId: threadId,
            message: 'Initialized'
        });

        // Background: Alert admin if it's a new session
        if (isNewSession) {
            const alertText = TelegramFormatter.formatNewSessionAlert(browserSessionId);
            sendAdminAlert(alertText).catch(e => console.error('BG Alert Error:', e));
        }
    } catch (err: any) {
        console.error('Proxy init error:', err);
        res.status(500).json({ status: 'error', error: err.message || 'Internal error' });
    }
});

/**
 * @route   POST /api/assessment/message
 * @desc    Forward user message to NullClaw and stream response
 */
router.post('/message', async (req, res) => {
    try {
        const { sessionId, content } = req.body;

        if (!sessionId || !content) {
            res.status(400).json({ error: 'Missing sessionId or content' });
            return;
        }

        const threadId = await SessionManager.getThreadId(sessionId);
        if (!threadId) {
            res.status(404).json({ error: 'Session not found or expired' });
            return;
        }

        // Stream response from Expert via NullClaw Gateway
        const stream = await NullClawClient.streamResponse(threadId, content);

        if (!stream) {
            res.status(500).json({ error: 'Failed to start stream' });
            return;
        }

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Pipe stream to response
        const reader = stream.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }

        res.end();
    } catch (err: any) {
        console.error('Proxy message error:', err);
        if (!res.headersSent) {
            res.status(500).json({ status: 'error', error: err.message || 'Internal error' });
        } else {
            res.end();
        }
    }
});

export default router;
