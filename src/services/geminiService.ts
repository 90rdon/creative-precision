import { io, Socket } from 'socket.io-client';
import { AppConfig, Message } from "../types";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const createChatSession = (config: AppConfig) => {
  // Returns the socket directly or a mock Chat object if we want to minimize refactoring
  // But refactoring ChatInterface is better.
  return getSocket();
};

export const generateResults = (): Promise<string> => {
  // Handled via Socket events now, this is just a mock for compatibility if needed.
  // Real logic is emitted in request-results.
  return Promise.resolve("{}");
};

export const generateSpeech = async (text: string, retries = 3, delay = 1000): Promise<string> => {
  try {
    const res = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      if (res.status === 429 && retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return generateSpeech(text, retries - 1, delay * 2);
      }
      throw new Error('Speech synthesis failed');
    }
    const data = await res.json();
    return data.audio || "";
  } catch (error) {
    console.error("Error generating speech:", error);
    return "";
  }
};
