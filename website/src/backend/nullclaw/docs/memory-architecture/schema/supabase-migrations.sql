-- ============================================================
-- Supabase Migration: Nullclaw Memory Schema
-- ============================================================
-- Run this in Supabase SQL Editor after creating your project
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid for auto-IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- INSTANCES AND AGENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE,
    UNIQUE(instance_id, name)
);

-- ============================================================
-- MEMORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'core',

    -- Partitioning
    agent_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    session_id TEXT,

    -- Layers
    layer TEXT DEFAULT 'short',  -- short, medium, long, semantic
    score REAL,
    tags JSONB DEFAULT '[]',
    access_level TEXT DEFAULT 'private',  -- public, shared, private
    access_count INTEGER DEFAULT 0,

    -- Content
    content_hash TEXT NOT NULL,
    embedding_id TEXT,

    -- Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    FOREIGN KEY (agent_id) REFERENCES agents(id),
    UNIQUE(key, agent_id)
);

-- ============================================================
-- EMBEDDINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS embeddings (
    id TEXT PRIMARY KEY,
    memory_id TEXT NOT NULL,
    vector VECTOR(1536) NOT NULL,
    dimensions INTEGER NOT NULL,
    model_name TEXT NOT NULL,
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    UNIQUE(memory_id, model_name)
);

-- ============================================================
-- SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]',
    access_level TEXT DEFAULT 'private',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_memories_instance ON memories(instance_id);
CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_memories_layer ON memories(layer);
CREATE INDEX IF NOT EXISTS idx_memories_access_level ON memories(access_level);

-- Vector similarity
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (vector vector_cosine_ops);

-- ============================================================
-- VIEWS
-- ============================================================

-- Active agents
CREATE OR REPLACE VIEW v_active_agents AS
SELECT
    a.id, a.name, a.display_name, a.role,
    i.name as instance_name
FROM agents a
JOIN instances i ON a.instance_id = i.id
WHERE a.is_active = TRUE AND i.is_active = TRUE;

-- Extended memories
CREATE OR REPLACE VIEW v_memories_extended AS
SELECT
    m.id, m.key, m.content, m.category,
    m.layer, m.tags, m.access_level, m.score,
    m.created_at, m.updated_at,
    a.name as agent_name, i.name as instance_name
FROM memories m
JOIN agents a ON m.agent_id = a.id
JOIN instances i ON m.instance_id = i.id
WHERE m.deleted_at IS NULL;

-- Cross-instance shared memories
CREATE OR REPLACE VIEW v_cross_instance_memories AS
SELECT
    m.id, m.key, m.content, m.tags, m.score, m.created_at,
    a.name as agent_name, i.name as instance_name
FROM memories m
JOIN agents a ON m.agent_id = a.id
JOIN instances i ON m.instance_id = i.id
WHERE m.access_level IN ('public', 'shared')
  AND m.deleted_at IS NULL;

-- ============================================================
-- AUTO-INCREMENTS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert default instances
INSERT INTO instances (id, name, display_name, description)
VALUES
    ('atlas', 'atlas', 'Atlas', 'Primary Mac-based instance'),
    ('vigil', 'vigil', 'Vigil', 'Linux/SSH-based instance')
ON CONFLICT (name) DO NOTHING;

-- Insert default agents for Atlas
INSERT INTO agents (id, instance_id, name, display_name, role, is_active)
VALUES
    ('atlas_main', 'atlas', 'main', 'Main', 'Chief of Staff, CTO, COO', TRUE),
    ('atlas_context', 'atlas', 'context', 'Context', 'Omni-presence Awareness', TRUE),
    ('atlas_research', 'atlas', 'research', 'Research', 'Intelligence Gathering', TRUE),
    ('atlas_governance', 'atlas', 'governance', 'Governance', 'Guardian', TRUE),
    ('atlas_intent_architect', 'atlas', 'intent_architect', 'Intent Architect', 'Outcome Definition', TRUE),
    ('atlas_explorer', 'atlas', 'explorer', 'Explorer', 'Path Discovery', TRUE)
ON CONFLICT (instance_id, name) DO NOTHING;
