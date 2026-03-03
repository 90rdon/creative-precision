-- =============================================================================
-- Migration: Agent Changes & GTM Intelligence Cycle Tables
-- Created: 2026-03-02
-- Purpose: Track all Engineer-proposed changes (Tier 1 & Tier 2), simulator
--          runs, and the overall GTM intelligence cycle execution log.
-- =============================================================================

-- 1. Agent Changes (The Engineer's Change Management Ledger)
--    Tier 1 = Major (e.g., SOUL.md, core protocol) → requires admin approval
--    Tier 2 = Minor (e.g., prompt tweaks)          → auto-applied, still logged
CREATE TABLE IF NOT EXISTS public.agent_changes (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tier            SMALLINT NOT NULL CHECK (tier IN (1, 2)),
    title           TEXT NOT NULL,
    reasoning       TEXT NOT NULL,
    proposed_diff   TEXT,                       -- The exact change in text/markdown diff form
    target_file     TEXT,                       -- e.g., 'SOUL.md', 'agents/expert/agent/system.md'
    status          TEXT NOT NULL DEFAULT 'pending_approval'
                        CHECK (status IN ('pending_approval', 'applied_automatically', 'approved', 'rejected')),
    applied_at      TIMESTAMP WITH TIME ZONE,   -- When it was actually enacted
    approved_by     TEXT DEFAULT 'admin',       -- 'admin' (Tier 1) or 'auto' (Tier 2)
    intelligence_cycle_id UUID                  -- Foreign key to cycle that proposed this change
);

-- 2. Simulator Runs (Log of every synthetic adversarial test)
CREATE TABLE IF NOT EXISTS public.simulator_runs (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id      TEXT NOT NULL,              -- The synthetic session ID (e.g., `synthetic-<timestamp>`)
    persona         TEXT,                       -- The adversarial persona description used
    initial_message TEXT,                       -- The opening attack vector
    expert_response TEXT,                       -- What the Expert replied
    verdict         TEXT CHECK (verdict IN ('passed', 'failed', 'inconclusive')),
    failure_notes   TEXT,                       -- Why the Expert failed (if applicable)
    intelligence_cycle_id UUID
);

-- 3. Intelligence Cycles (Log of each full Orchestration Loop)
CREATE TABLE IF NOT EXISTS public.intelligence_cycles (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at    TIMESTAMP WITH TIME ZONE,
    status          TEXT NOT NULL DEFAULT 'running'
                        CHECK (status IN ('running', 'completed', 'partial_failure', 'failed')),
    synthesizer_summary TEXT,                   -- The Synthesizer's findings
    simulator_summary   TEXT,                   -- The Simulator's Red Team report
    engineer_summary    TEXT,                   -- The Engineer's change recommendations
    report_delivered_at TIMESTAMP WITH TIME ZONE -- When the Telegram alert was sent
);

-- =============================================================================
-- Add foreign key from agent_changes and simulator_runs to intelligence_cycles
-- =============================================================================

ALTER TABLE public.agent_changes
    ADD CONSTRAINT fk_agent_changes_cycle
    FOREIGN KEY (intelligence_cycle_id)
    REFERENCES public.intelligence_cycles(id)
    ON DELETE SET NULL;

ALTER TABLE public.simulator_runs
    ADD CONSTRAINT fk_simulator_runs_cycle
    FOREIGN KEY (intelligence_cycle_id)
    REFERENCES public.intelligence_cycles(id)
    ON DELETE SET NULL;

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.agent_changes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_runs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_cycles   ENABLE ROW LEVEL SECURITY;

-- Full access for service_role (used by server-side code with SERVICE_ROLE_KEY)
CREATE POLICY "Service Role Full Access" ON public.agent_changes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access" ON public.simulator_runs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access" ON public.intelligence_cycles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anonymous read/insert for agent tools (they use ANON_KEY via gtm_tools.ts)
CREATE POLICY "Anon insert agent_changes" ON public.agent_changes
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon select agent_changes" ON public.agent_changes
    FOR SELECT TO anon USING (true);

CREATE POLICY "Anon insert simulator_runs" ON public.simulator_runs
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon select simulator_runs" ON public.simulator_runs
    FOR SELECT TO anon USING (true);

CREATE POLICY "Anon insert intelligence_cycles" ON public.intelligence_cycles
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon update intelligence_cycles" ON public.intelligence_cycles
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon select intelligence_cycles" ON public.intelligence_cycles
    FOR SELECT TO anon USING (true);
