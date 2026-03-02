-- 1. Assessment Sessions (The Chat Transcripts)
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    transcript JSONB DEFAULT '[]'::jsonb,
    final_synthesis JSONB,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
);

-- 2. Assessment Events (The Behavioral Telemetry - No Data Farming)
CREATE TABLE IF NOT EXISTS public.assessment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_type TEXT NOT NULL, -- e.g., 'topic_changed', 'share_clicked', 'lifeline_pulled', 'drop_off'
    event_data JSONB DEFAULT '{}'::jsonb,
    dwell_time_seconds INTEGER
);

-- 3. Executive Insights (OpenClaw's Post-Chat Analysis)
CREATE TABLE IF NOT EXISTS public.executive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sentiment_score TEXT, -- e.g., 'high_friction', 'guarded', 'receptive'
    identified_market_trend TEXT, -- e.g., "AI fear", "Resistance to change"
    gtm_feedback_quote TEXT, -- The exact raw quote we can use for marketing
    analysis_notes TEXT
);

-- 4. Market Signals (OpenClaw's External Web/News Research)
CREATE TABLE IF NOT EXISTS public.market_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    source_url TEXT,
    topic TEXT NOT NULL, -- e.g., 'Enterprise AI Adoption', 'Tech Layoffs'
    signal_strength INTEGER CHECK (signal_strength BETWEEN 1 AND 10),
    key_insight TEXT NOT NULL,
    strategic_implication TEXT
);

-- 5. GTM Experiments (Tracking Which Config Wins)
CREATE TABLE IF NOT EXISTS public.gtm_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    experiment_name TEXT NOT NULL,
    active_persona_hash TEXT, -- To track which version of IDENTITY.md was used
    active_system_prompt TEXT,
    conversion_rate NUMERIC(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT false
);

-- Set up RLS (Row Level Security) - assuming this is service-role only for now
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtm_experiments ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role to have full access
CREATE POLICY "Service Role Full Access" ON public.assessment_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service Role Full Access" ON public.assessment_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service Role Full Access" ON public.executive_insights
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service Role Full Access" ON public.market_signals
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service Role Full Access" ON public.gtm_experiments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
