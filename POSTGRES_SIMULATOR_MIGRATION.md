# Postgres Migration — Autonomous Learning System

## New Tables

```sql
-- Learning state for the autonomous system
CREATE TABLE IF NOT EXISTS learning_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weakness_vector JSONB NOT NULL DEFAULT '{}',
    tested_scenarios TEXT[] NOT NULL DEFAULT '{}',
    next_probe_focus TEXT NOT NULL DEFAULT '',
    iteration_count INTEGER NOT NULL DEFAULT 0,
    last_simulation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dynamic personas (LLM-synthesized)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dynamic_personas_iteration_date ON dynamic_personas(iteration_date DESC);
CREATE INDEX IF NOT EXISTS idx_dynamic_personas_usage_count ON dynamic_personas(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_learning_state_updated ON learning_state(updated_at DESC);

-- Insert initial learning state
INSERT INTO learning_state (weakness_vector, tested_scenarios, next_probe_focus, iteration_count)
VALUES ('{}', ARRAY[]::TEXT[], 'Initial exploration - test core Quiet Expert criteria', 0)
ON CONFLICT DO NOTHING;

-- Comment for documentation
COMMENT ON TABLE learning_state IS 'Stores autonomous learning state for simulator agent - tracks weakness vectors, tested scenarios, iteration count';
COMMENT ON TABLE dynamic_personas IS 'LLM-synthesized dynamic personas for adversarial testing - replaces fixed persona rotation';
```

## Migration Script

Save as `scripts/simulator/migrations/001_autonomous_learning.sql`:

```sql
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dynamic_personas_iteration_date ON dynamic_personas(iteration_date DESC);
CREATE INDEX IF NOT EXISTS idx_dynamic_personas_usage_count ON dynamic_personas(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_learning_state_updated ON learning_state(updated_at DESC);

-- Insert initial learning state
INSERT INTO learning_state (weakness_vector, tested_scenarios, next_probe_focus, iteration_count)
VALUES (
    '{}'::jsonb,
    ARRAY[]::TEXT[],
    'Initial exploration - test core Quiet Expert criteria',
    0
)
ON CONFLICT DO NOTHING;

COMMIT;
```

## Running the Migration

```bash
# Via psql directly
psql -h 100.85.130.20 -U nullclaw -d nullclaw -f migrations/001_autonomous_learning.sql

# Or via node
npx tsx -e "import { Pool } from 'pg'; import fs from 'fs'; const pool = new Pool('postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw'); pool.query(fs.readFileSync('migrations/001_autonomous_learning.sql', 'utf8')).then(() => console.log('Migration complete')).catch(console.error);"
```

## Verification

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE tablename IN ('learning_state', 'dynamic_personas');

-- Check initial data
SELECT * FROM learning_state;
```
