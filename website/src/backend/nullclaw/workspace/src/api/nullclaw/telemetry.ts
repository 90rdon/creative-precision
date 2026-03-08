/**
 * NullClaw-Atlas Telemetry Logger
 * 
 * Tracks assessment session events and executive insights.
 * Sends data to Supabase tables: assessment_events, executive_insights
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export interface AssessmentEvent {
  event_type: 'topic_entered' | 'topic_exit' | 'lifeline_pulled' | 'share_clicked' | 'session_start' | 'session_end';
  topic: string;
  session_id: string;
  duration_seconds?: number;
  metadata?: Record<string, unknown>;
}

export interface ExecutiveInsight {
  role: string;
  industry: string;
  company_size?: string;
  friction_category: string;
  insight: string;
  session_id: string;
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Log an assessment event for telemetry tracking
 */
export async function logAssessmentEvent(event: AssessmentEvent): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!supabase) {
    console.log('[TELEMETRY] Supabase not configured. Event logged locally only:', event);
    return { success: false, reason: 'no_supabase' };
  }

  const { data, error } = await supabase
    .from('assessment_events')
    .insert({
      ...event,
      event_timestamp: new Date().toISOString()
    });

  if (error) {
    console.error('[TELEMETRY] Failed to log assessment event:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.[0]?.id };
}

/**
 * Log an executive insight discovered during assessment
 */
export async function logExecutiveInsight(insight: ExecutiveInsight): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!supabase) {
    console.log('[TELEMETRY] Supabase not configured. Insight logged locally only:', insight);
    return { success: false, reason: 'no_supabase' };
  }

  const { data, error } = await supabase
    .from('executive_insights')
    .insert({
      ...insight,
      logged_at: new Date().toISOString()
    });

  if (error) {
    console.error('[TELEMETRY] Failed to log executive insight:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.[0]?.id };
}

/**
 * Update the current topic being discussed (triggers telemetry loop)
 */
export async function updateCurrentTopic(params: {
  session_id: string;
  previous_topic?: string;
  new_topic: string;
  duration_on_previous?: number;
}): Promise<{ success: boolean }> {
  const { session_id, previous_topic, new_topic, duration_on_previous } = params;

  // Log exit from previous topic
  if (previous_topic && duration_on_previous) {
    await logAssessmentEvent({
      event_type: 'topic_exit',
      topic: previous_topic,
      session_id,
      duration_seconds: duration_on_previous
    });
  }

  // Log entry to new topic
  await logAssessmentEvent({
    event_type: 'topic_entered',
    topic: new_topic,
    session_id
  });

  return { success: true };
}

/**
 * Track a "lifeline pull" - when an executive engages deeply with a question
 */
export async function trackLifelinePull(params: {
  session_id: string;
  topic: string;
  question_type: string;
  engagement_level: 'surface' | 'moderate' | 'deep';
}): Promise<{ success: boolean }> {
  await logAssessmentEvent({
    event_type: 'lifeline_pulled',
    topic: params.topic,
    session_id: params.session_id,
    metadata: {
      question_type: params.question_type,
      engagement_level: params.engagement_level
    }
  });

  return { success: true };
}

// --- CLI Entry Point ---

if (process.argv[1]?.includes('telemetry')) {
  console.log('[TELEMETRY] NullClaw-Atlas Telemetry Logger initialized');
  console.log(`[TELEMETRY] Supabase configured: ${!!supabase}`);
  process.exit(0);
}
