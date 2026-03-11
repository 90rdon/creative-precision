-- Autonomous Learning System Tables
-- Migration: 001_autonomous_learning

BEGIN;

-- Create learning_state table
CREATE TABLE IF NOT EXISTS learning_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weakness_vector JSONB NOT NULL DEFAULT '{}'::jsonb,
    tested_scenarios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    next_probe_focus TEXT NOT NULL DEFAULT '',
    iteration_count INTEGER NOT NULL DEFAULT 0,
    last_simulation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dynamic_personas table
CREATE TABLE IF NOT EXISTS dynamic_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id TEXT UNIQUE NOT NULL,
    persona_prompt TEXT NOT NULL,
    attack_vector TEXT NOT NULL,
    synthesis_context TEXT NOT NULL,
    iteration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_dynamic_personas_iteration_date ON dynamic_personas(iteration_date DESC);
CREATE INDEX IF NOT EXISTS idx_dynamic_personas_usage_count ON dynamic_personas(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_learning_state_updated ON learning_state(updated_at DESC);

-- Insert initial learning state if not exists
INSERT INTO learning_state (weakness_vector, tested_scenarios, next_probe_focus, iteration_count)
VALUES (
    '{}'::jsonb,
    ARRAY[]::TEXT[],
    'Initial exploration - test core Quiet Expert criteria',
    0
)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE learning_state IS 'Stores autonomous learning state for simulator agent - tracks weakness vectors, tested scenarios, iteration count';
COMMENT ON TABLE dynamic_personas IS 'LLM-synthesized dynamic personas for adversarial testing - replaces fixed persona rotation';

COMMIT;
