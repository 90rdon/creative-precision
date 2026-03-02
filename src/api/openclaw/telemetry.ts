import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''; // Usually want service_role for backend operations

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function logExecutiveInsight(sessionId: string, data: { sentiment_score: string, identified_market_trend: string, gtm_feedback_quote: string, analysis_notes: string }) {
    const { error } = await supabase
        .from('executive_insights')
        .insert([{
            session_id: sessionId,
            ...data
        }]);

    if (error) {
        console.error('Failed to log executive insight:', error);
    }
}

export async function logMarketSignal(data: { source_url?: string, topic: string, signal_strength: number, key_insight: string, strategic_implication: string }) {
    const { error } = await supabase
        .from('market_signals')
        .insert([data]);

    if (error) {
        console.error('Failed to log market signal:', error);
    }
}
