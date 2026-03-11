import { Server, Socket } from 'socket.io';
import { NullClawClient } from '../api/nullclaw/client';
import { redis, pool } from '../db';

export function handleChatConnection(io: Server, socket: Socket) {
    socket.on('chat-message', async (data) => {
        console.log(`Received chat message for session: ${data.sessionId} [Forwarding to NullClaw]`);
        if (data.sessionId && data.messages) {
            await redis.set(`session:${data.sessionId}`, JSON.stringify({ history: data.messages }), 'EX', 3600);
        }

        // Bridge socket to NullClaw HTTP API (v1/responses)
        if (data.messages && Array.isArray(data.messages)) {
            const lastMsg = data.messages[data.messages.length - 1].text;
            try {
                socket.emit('state-update', { type: 'thinking', payload: {} });

                // Call NullClaw for response
                // For now we use the existing sendMessage method which returns a string, 
                // but we can chunk the response back to the socket 
                const stream = await NullClawClient.startStreamingRun(data.sessionId, lastMsg);
                if (stream) {
                    socket.emit('state-update', { type: 'generating', payload: {} });
                    const reader = stream.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = new TextDecoder().decode(value);
                        socket.emit('chat-chunk', { chunk, done: false });
                    }
                    socket.emit('chat-chunk', { chunk: '', done: true });
                } else {
                    const response = await NullClawClient.sendMessage(data.sessionId, lastMsg);
                    socket.emit('chat-chunk', { chunk: response, done: true });
                }
                socket.emit('state-update', { type: 'idle', payload: {} });
            } catch (err: any) {
                console.error("NullClaw Socket Bridge Error:", err);
                socket.emit('state-update', { type: 'error', payload: { message: 'Expert proxy unreachable' } });
            }
        }
    });

    socket.on('request-results', async (data) => {
        console.log(`Received request-results for session: ${data.sessionId} [Requesting Synthesis from NullClaw]`);
        if (data.sessionId) {
            try {
                socket.emit('state-update', { type: 'synthesizing', payload: {} });

                // Request synthesis from NullClaw expert thread
                const prompt = "The session is complete. Please perform your final diagnostic synthesis and provide the JSON assessment results.";
                const response = await NullClawClient.sendMessage(data.sessionId, prompt);

                // Extract JSON if model wrapped it in markdown
                let jsonText = response;
                const match = response.match(/\{[\s\S]*\}/);
                if (match) jsonText = match[0];

                const resultObj = JSON.parse(jsonText);
                socket.emit('results-synthesis', resultObj);
                socket.emit('state-update', { type: 'synthesis-complete', payload: {} });
            } catch (err: any) {
                console.error("Synthesis Redirect Error:", err);
                socket.emit('state-update', { type: 'error', payload: { message: 'Synthesis engine offline' } });
            }
        }
    });

    socket.on('telemetry', async (data) => {
        console.log(`[Telemetry - ${data.type}]`, JSON.stringify(data.payload));

        if (data.payload) {
            try {
                const sessionId = data.payload.session_id || data.payload.sessionId || null;
                const isSynthetic = data.payload.isSynthetic || false;
                const client = await pool.connect();
                try {
                    await client.query(
                        `INSERT INTO assessment_events (session_id, event_type, event_data, created_at)
                         VALUES ($1, $2, $3, NOW())`,
                        [
                            sessionId,
                            data.payload.event_type || data.type,
                            JSON.stringify({ ...data.payload, isSynthetic })
                        ]
                    );
                } finally {
                    client.release();
                }
            } catch (error) {
                console.error("[Telemetry] Failed to log to Postgres:", error);
            }
        }
    });
}
