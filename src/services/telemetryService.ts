/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SessionData, AssessmentEvent } from '../types';

let supabase: SupabaseClient | null = null;

const getClient = (): SupabaseClient | null => {
  if (supabase) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  supabase = createClient(url, key);
  return supabase;
};

export const initSession = (sessionData: Partial<SessionData> & { session_id: string }): void => {
  try {
    const client = getClient();
    if (!client) return;

    client
      .from('assessment_sessions')
      .insert({
        ...sessionData,
        completion_status: 'started',
        message_count: 0,
        clicked_lifeline: false,
        clicked_share: false,
        booked_call: false,
        downloaded_pdf: false,
      })
      .then(() => {});
  } catch {
    // Silently fail — telemetry should never break the app
  }
};

export const updateSession = (sessionId: string, updates: Partial<SessionData>): void => {
  try {
    const client = getClient();
    if (!client) return;

    client
      .from('assessment_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .then(() => {});
  } catch {
    // Silently fail
  }
};

export const trackEvent = (event: AssessmentEvent): void => {
  try {
    const client = getClient();
    if (!client) return;

    client
      .from('assessment_events')
      .insert({
        session_id: event.session_id,
        event_type: event.event_type,
        event_data: event.event_data || {},
      })
      .then(() => {});
  } catch {
    // Silently fail
  }
};
