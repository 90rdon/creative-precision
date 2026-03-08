-- ============================================================
-- Nullclaw Memory Schema for Supabase
-- ============================================================
-- Matches the exact table structure used by nullclaw's memory
-- engine, with PostgreSQL/pgvector upgrades where applicable.
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    provider    TEXT,
    model       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEMORIES
-- Core memory store - matches nullclaw SQLite schema exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS memories (
    id          TEXT PRIMARY KEY,
    key         TEXT NOT NULL,
    content     TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'core',
    session_id  TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- Conversation history per session
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id          BIGSERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEMORY EMBEDDINGS
-- Vector store for semantic search (replaces SQLite BLOB with pgvector)
-- nullclaw references this as "memory_embeddings" table
-- ============================================================
CREATE TABLE IF NOT EXISTS memory_embeddings (
    memory_key  TEXT PRIMARY KEY,
    embedding   VECTOR(1536) NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KV STORE
-- Generic key-value cache
-- ============================================================
CREATE TABLE IF NOT EXISTS kv (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL
);

-- ============================================================
-- CROSS-INSTANCE SHARING (extended tables for multi-agent)
-- These add agent/instance awareness on top of the base schema
-- ============================================================
CREATE TABLE IF NOT EXISTS instances (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    display_name TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
    id          TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    display_name TEXT,
    role        TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(instance_id, name)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Memory lookup (nullclaw queries by key frequently)
CREATE INDEX IF NOT EXISTS idx_memories_key       ON memories(key);
CREATE INDEX IF NOT EXISTS idx_memories_category  ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_session   ON memories(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_created   ON memories(created_at DESC);

-- Full-text search on content
CREATE INDEX IF NOT EXISTS idx_memories_fts
    ON memories USING GIN (to_tsvector('english', content));

-- Vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector
    ON memory_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Message lookups
CREATE INDEX IF NOT EXISTS idx_messages_session   ON messages(session_id);

-- ============================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- ============================================================
-- VIEWS
-- ============================================================

-- Recent memories (non-conversation, ordered by recency)
CREATE OR REPLACE VIEW v_memories_recent AS
SELECT id, key, content, category, session_id, created_at, updated_at
FROM memories
WHERE category != 'conversation'
ORDER BY created_at DESC;

-- Memories with embeddings
CREATE OR REPLACE VIEW v_memories_with_embeddings AS
SELECT m.id, m.key, m.content, m.category, m.created_at,
       e.embedding
FROM memories m
JOIN memory_embeddings e ON m.key = e.memory_key;

-- ============================================================
-- SEMANTIC SEARCH FUNCTION
-- Usage: SELECT * FROM search_memories('your query embedding', 5);
-- ============================================================
CREATE OR REPLACE FUNCTION search_memories(
    query_embedding VECTOR(1536),
    match_count     INT DEFAULT 6,
    min_score       FLOAT DEFAULT 0.0
)
RETURNS TABLE (
    id          TEXT,
    key         TEXT,
    content     TEXT,
    category    TEXT,
    similarity  FLOAT
)
LANGUAGE sql STABLE AS $$
    SELECT
        m.id,
        m.key,
        m.content,
        m.category,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM memory_embeddings e
    JOIN memories m ON m.key = e.memory_key
    WHERE 1 - (e.embedding <=> query_embedding) >= min_score
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ============================================================
-- INITIAL DATA
-- ============================================================
INSERT INTO instances (id, name, display_name)
VALUES
    ('atlas', 'atlas', 'Atlas'),
    ('vigil', 'vigil', 'Vigil')
ON CONFLICT (name) DO NOTHING;

INSERT INTO agents (id, instance_id, name, display_name, role)
VALUES
    ('atlas_main',       'atlas', 'main',            'Main',           'Chief of Staff, CTO, COO'),
    ('atlas_context',    'atlas', 'context',          'Context',        'Omni-presence Awareness'),
    ('atlas_research',   'atlas', 'research',         'Research',       'Intelligence Gathering'),
    ('atlas_governance', 'atlas', 'governance',       'Governance',     'Guardian'),
    ('atlas_explorer',   'atlas', 'explorer',         'Explorer',       'Path Discovery'),
    ('atlas_adversary',  'atlas', 'adversary',        'Adversary',      'Red Team'),
    ('atlas_validator',  'atlas', 'validator',        'Validator',      'Quality Assurance'),
    ('atlas_learning',   'atlas', 'learning',         'Learning',       'Continuous Improvement'),
    ('atlas_adaptation', 'atlas', 'adaptation',       'Adaptation',     'System Evolution')
ON CONFLICT (instance_id, name) DO NOTHING;
