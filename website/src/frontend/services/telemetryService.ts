import { SessionData, AssessmentEvent } from '../types';
import { getSocket } from './geminiService';

export const initSession = (sessionData: Partial<SessionData> & { session_id: string }): void => {
  try {
    const socket = getSocket();
    socket.emit('telemetry', { type: 'initSession', payload: sessionData });
  } catch {
    // Silently fail
  }
};

export const updateSession = (sessionId: string, updates: Partial<SessionData>): void => {
  try {
    const socket = getSocket();
    socket.emit('telemetry', { type: 'updateSession', payload: { sessionId, updates } });
  } catch {
    // Silently fail
  }
};

export const trackEvent = (event: AssessmentEvent): void => {
  try {
    const socket = getSocket();
    socket.emit('telemetry', { type: 'trackEvent', payload: event });
  } catch {
    // Silently fail
  }
};
