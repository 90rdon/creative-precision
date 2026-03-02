import { Server, Socket } from 'socket.io';
import { handleChatStream, handleSynthesisRequest } from '../gemini/stream';
import { redis, supabase } from '../db';

export function handleChatConnection(io: Server, socket: Socket) {
    socket.on('chat-message', async (data) => {
        console.log(`Received chat message for session: ${data.sessionId}`);
        if (data.sessionId && data.messages) {
            await redis.set(`session:${data.sessionId}`, JSON.stringify({ history: data.messages }), 'EX', 3600);
        }

        if (data.messages && Array.isArray(data.messages)) {
            await handleChatStream(socket, data.messages);
        }
    });

    socket.on('request-results', async (data) => {
        console.log(`Received request-results for session: ${data.sessionId}`);
        if (data.history && Array.isArray(data.history)) {
            if (data.sessionId) {
                await redis.set(`session:${data.sessionId}`, JSON.stringify({ history: data.history }), 'EX', 3600);
            }
            await handleSynthesisRequest(socket, data.history, data.sessionId);
        }
    });

    socket.on('telemetry', async (data) => {
        console.log(`[Telemetry - ${data.type}]`, JSON.stringify(data.payload));

        if (supabase && data.payload) {
            const sessionId = data.payload.session_id || data.payload.sessionId || null;
            const { error } = await supabase.from('assessment_events').insert({
                session_id: sessionId,
                event_type: data.payload.event_type || data.type,
                payload: data.payload
            });

            if (error) {
                console.error("[Telemetry] Failed to post to Supabase:", error.message);
            }
        }
    });
}
