-- =============================================================================
-- COMBINED MIGRATION: Run this in the Supabase Dashboard SQL Editor
-- Project: Creative Precision | creative-precision (qxetgnheojhpcskctort)
-- Generated: 2026-03-02
--
-- Instructions:
--   1. Go to https://supabase.com/dashboard/project/qxetgnheojhpcskctort
--   2. Click "SQL Editor" in the left sidebar
--   3. Paste this entire file and click "Run"
--   4. All tables will be created with correct RLS policies.
-- =============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION 1: Core Telemetry Schema (20260301000000)                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

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

-- 2. Assessment Events (The Behavioral Telemetry)
CREATE TABLE IF NOT EXISTS public.assessment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    payload JSONB DEFAULT '{}'::jsonb,        -- proxy server raw payload
    dwell_time_seconds INTEGER
);

-- 3. Executive Insights (Post-Chat AI Analysis)
CREATE TABLE IF NOT EXISTS public.executive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sentiment_score TEXT,
    identified_market_trend TEXT,
    gtm_feedback_quote TEXT,
    analysis_notes TEXT
);

-- 4. Market Signals (OpenClaw External Research)
CREATE TABLE IF NOT EXISTS public.market_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    source_url TEXT,
    topic TEXT NOT NULL,
    signal_strength INTEGER CHECK (signal_strength BETWEEN 1 AND 10),
    key_insight TEXT NOT NULL,
    strategic_implication TEXT
);

-- 5. GTM Experiments (Config Version Tracking)
CREATE TABLE IF NOT EXISTS public.gtm_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    experiment_name TEXT NOT NULL,
    active_persona_hash TEXT,
    active_system_prompt TEXT,
    conversion_rate NUMERIC(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT false
);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION 2: GTM Intelligence Cycle Tables (20260302000000)           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 6. Intelligence Cycles (Log of each full Orchestration Loop run)
CREATE TABLE IF NOT EXISTS public.intelligence_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'completed', 'partial_failure', 'failed')),
    synthesizer_summary TEXT,
    simulator_summary TEXT,
    engineer_summary TEXT,
    report_delivered_at TIMESTAMP WITH TIME ZONE
);

-- 7. Agent Changes (The Engineer's Change Management Ledger)
--    Tier 1 = Major (SOUL.md, core protocol) → requires admin approval
--    Tier 2 = Minor (prompt tweaks, copy)    → auto-applied, fully logged
CREATE TABLE IF NOT EXISTS public.agent_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tier SMALLINT NOT NULL CHECK (tier IN (1, 2)),
    title TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    proposed_diff TEXT,
    target_file TEXT,
    status TEXT NOT NULL DEFAULT 'pending_approval'
        CHECK (status IN ('pending_approval', 'applied_automatically', 'approved', 'rejected')),
    applied_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT DEFAULT 'admin',
    intelligence_cycle_id UUID REFERENCES public.intelligence_cycles(id) ON DELETE SET NULL
);

-- 8. Simulator Runs (Log of every synthetic adversarial test)
CREATE TABLE IF NOT EXISTS public.simulator_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id TEXT NOT NULL,
    persona TEXT,
    initial_message TEXT,
    expert_response TEXT,
    verdict TEXT CHECK (verdict IN ('passed', 'failed', 'inconclusive')),
    failure_notes TEXT,
    intelligence_cycle_id UUID REFERENCES public.intelligence_cycles(id) ON DELETE SET NULL
);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  RLS POLICIES                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.assessment_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_insights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_signals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtm_experiments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_cycles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_changes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_runs         ENABLE ROW LEVEL SECURITY;

-- Service role full access (server-side with SERVICE_ROLE_KEY)
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access" ON public.assessment_sessions    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access" ON public.assessment_events      FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access" ON public.executive_insights      FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access" ON public.market_signals          FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access" ON public.gtm_experiments         FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access" ON public.intelligence_cycles     FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access" ON public.agent_changes           FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access" ON public.simulator_runs          FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon access for agent tools and proxy server (ANON_KEY)
DO $$ BEGIN
  CREATE POLICY "Anon insert sessions"     ON public.assessment_sessions    FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon update sessions"     ON public.assessment_sessions    FOR UPDATE TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon insert events"       ON public.assessment_events      FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon insert insights"     ON public.executive_insights     FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon select insights"     ON public.executive_insights     FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon insert signals"      ON public.market_signals         FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon select signals"      ON public.market_signals         FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon insert cycles"       ON public.intelligence_cycles    FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon update cycles"       ON public.intelligence_cycles    FOR UPDATE TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon select cycles"       ON public.intelligence_cycles    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon insert agent changes" ON public.agent_changes         FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon select agent changes" ON public.agent_changes         FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon insert simulator runs" ON public.simulator_runs       FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anon select simulator runs" ON public.simulator_runs       FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
