import { Server, Socket } from 'socket.io';
import { handleChatStream, handleSynthesisRequest } from '../gemini/stream';

export function handleChatConnection(io: Server, socket: Socket) {
    socket.on('chat-message', async (data) => {
        console.log('Received chat message:', data);
        if (data.messages && Array.isArray(data.messages)) {
            await handleChatStream(socket, data.messages);
        }
    });

    socket.on('request-results', async (data) => {
        console.log('Received request-results:', data);
        if (data.history && Array.isArray(data.history)) {
            await handleSynthesisRequest(socket, data.history);
        }
    });
}
