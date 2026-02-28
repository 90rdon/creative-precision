import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { handleChatConnection } from './socket/chat';
import { socketAuthMiddleware } from './middleware/auth';

dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });
delete process.env.GOOGLE_API_KEY; // Prevent SDK from picking up the expired test key in the user shell

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // disabled for simpler local dev and websocket testing
}));
app.use(cors());
app.use(express.json());

// API route speech
import { getGeminiClient } from './gemini/stream';
import { Modality } from '@google/genai';

app.post('/api/speech', async (req, res) => {
    try {
        const { text } = req.body;
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
        res.json({ audio: audioData });
    } catch (err: any) {
        console.error("Speech API error:", err);
        if (err?.status === 429 || err?.message?.includes("429")) {
            res.status(429).json({ error: 'Rate limit' });
        } else {
            res.status(500).json({ error: 'Internal error' });
        }
    }
});

// API route healthcheck
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Socket auth
io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    handleChatConnection(io, socket);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Serve frontend build in production
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
