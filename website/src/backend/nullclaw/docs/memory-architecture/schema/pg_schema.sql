-- Nullclaw Multi-Layer Memory Schema
-- ==================================
-- PostgreSQL 16+ with pgvector extension
-- For medium-term and long-term memory storage

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- For GiST indexes on JSONB

-- ============================================================================
-- METADATA
-- ============================================================================

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

-- ============================================================================
-- INSTANCES AND AGENTS (Partitioning Layer)
-- ============================================================================

CREATE TABLE instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE Table agents (
    id TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    role TEXT,
    capabilities JSONB,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE,
    UNIQUE(instance_id, name)
);

-- Sessions for conversation contexts
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    metadata JSONB,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- ============================================================================
-- MEMORY STORAGE (Multi-Layer)
-- ============================================================================

CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'core',

    -- Partitioning
    agent_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    session_id TEXT,

    -- Layer information
    layer TEXT NOT NULL DEFAULT 'short',  -- 'short', 'medium', 'long', 'semantic'
    tier TEXT DEFAULT NULL,               -- Importance tier (1-5)

    -- Tags and access control
    tags JSONB NOT NULL DEFAULT '[]',
    access_level TEXT NOT NULL DEFAULT 'private',
    score REAL DEFAULT NULL,               -- Importance score
    access_count INTEGER DEFAULT 0,

    -- Content analysis
    content_hash TEXT NOT NULL,
    embedding_id TEXT,

    -- Lifecycle
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT,
    archived_at TEXT,
    deleted_at TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB,

    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (instance_id) REFERENCES instances(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    UNIQUE(key, agent_id)
);

-- Embeddings stored directly in PostgreSQL
CREATE TABLE embeddings (
    id TEXT PRIMARY KEY,
    memory_id TEXT NOT NULL,
    vector VECTOR(1536) NOT NULL,
    dimensions INTEGER NOT NULL,
    model_name TEXT NOT NULL,
    model_version TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    UNIQUE(memory_id, model_name)
);

-- Messages stored per session
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]',
    access_level TEXT NOT NULL DEFAULT 'private',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (instance_id) REFERENCES instances(id)
);

-- ============================================================================
-- TAGS AND ACCESS CONTROL
-- ============================================================================

CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    namespace TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    parent_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tag_permissions (
    id TEXT PRIMARY KEY,
    tag_id TEXT NOT NULL,
    instance_id TEXT,
    agent_id TEXT,
    permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'delete')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
);

-- ============================================================================
-- SHARED MEMORY (Cross-Instance)
-- ============================================================================

CREATE TABLE shared_memories (
    id TEXT PRIMARY KEY,
    source_memory_id TEXT NOT NULL,
    source_instance_id TEXT NOT NULL,
    target_instance_id TEXT NOT NULL,
    target_agent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    synced_at TEXT,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (source_memory_id) REFERENCES memories(id) ON DELETE CASCADE
);

-- ============================================================================
-- MEMORY RELATIONSHIPS
-- ============================================================================

CREATE TABLE memory_relationships (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    metadata JSONB,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (source_id) REFERENCES memories(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES memories(id) ON DELETE CASCADE,
    UNIQUE(source_id, target_id, relationship_type)
);

-- ============================================================================
-- CACHE AND KEY-VALUE STORE
-- ============================================================================

CREATE TABLE kv_store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    namespace TEXT NOT NULL DEFAULT 'default',
    instance_id TEXT,
    agent_id TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE embedding_cache (
    content_hash TEXT PRIMARY KEY,
    embedding VECTOR(1536) NOT NULL,
    category TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- CONSOLIDATION AND LIFECYCLE
-- ============================================================================

CREATE TABLE consolidation_batches (
    id TEXT PRIMARY KEY,
    source_layer TEXT NOT NULL,
    target_layer TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TEXT,
    completed_at TEXT,
    processed_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE memory_events (
    id TEXT PRIMARY KEY,
    memory_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Instance and agent indexes
CREATE INDEX idx_memories_instance ON memories(instance_id);
CREATE INDEX idx_memories_agent ON memories(agent_id);
CREATE INDEX idx_memories_session ON memories(session_id);
CREATE INDEX idx_memories_layer ON memories(layer);
CREATE INDEX idx_memories_tier ON memories(tier);

-- Access and tag indexes
CREATE INDEX idx_memories_access_level ON memories(access_level);
CREATE INDEX idx_memories_expires ON memories(expires_at);

-- Content indexes using pgvector
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (vector vector_cosine_ops);
CREATE INDEX idx_embeddings_memory ON embeddings(memory_id);

-- Full-text search (PostgreSQL tsvector)
CREATE INDEX idx_memories_content_fts ON memories USING GIN (to_tsvector('english', content));
CREATE INDEX idx_memories_tags_gin ON memories USING GIN (tags);

-- Lifecycle indexes
CREATE INDEX idx_memories_created ON memories(created_at);
CREATE INDEX idx_memories_updated ON memories(updated_at);
CREATE INDEX idx_memories_score ON memories(score DESC);
CREATE INDEX idx_memories_access_count ON memories(access_count DESC);

-- Cache expiration
CREATE INDEX idx_kv_expires ON kv_store(expires_at);

-- Events
CREATE INDEX idx_events_memory ON memory_events(memory_id);
CREATE INDEX idx_events_type ON memory_events(event_type);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active agents with instance information
CREATE VIEW v_active_agents AS
SELECT
    a.id, a.name, a.display_name, a.description,
    a.role, a.capabilities, a.created_at, a.updated_at,
    i.name as instance_name, i.display_name as instance_display_name
FROM agents a
JOIN instances i ON a.instance_id = i.id
WHERE a.is_active = 1 AND i.is_active = 1;

-- Memories with extended information
CREATE VIEW v_memories_extended AS
SELECT
    m.id, m.key, m.content, m.category,
    m.layer, m.tier, m.tags, m.access_level,
    m.score, m.access_count,
    m.created_at, m.updated_at, m.expires_at,
    a.name as agent_name, i.name as instance_name,
    e.id as embedding_id
FROM memories m
JOIN agents a ON m.agent_id = a.id
JOIN instances i ON m.instance_id = i.id
LEFT JOIN embeddings e ON m.id = e.memory_id
WHERE m.deleted_at IS NULL;

-- Cross-instance shared memories
CREATE VIEW v_cross_instance_memories AS
SELECT
    m.id, m.key, m.content, m.category,
    m.tags, m.access_level, m.score, m.created_at,
    i.name as instance_name, a.name as agent_name
FROM memories m
JOIN instances i ON m.instance_id = i.id
JOIN agents a ON m.agent_id = a.id
WHERE m.access_level IN ('public', 'shared')
AND m.deleted_at IS NULL;

-- Memory by importance
CREATE VIEW v_memories_high_value AS
SELECT
    m.id, m.key, m.content, m.category,
    m.tags, m.access_level, m.score, m.access_count,
    m.layer, m.created_at,
    a.name as agent_name, i.name as instance_name
FROM memories m
JOIN agents a ON m.agent_id = a.id
JOIN instances i ON m.instance_id = i.id
WHERE m.score >= 3.5 AND m.deleted_at IS NULL
ORDER BY m.score DESC;

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC CONSOLIDATION
-- ============================================================================

-- Function to calculate memory importance score
CREATE OR REPLACE FUNCTION calculate_importance(
    p_access_count INTEGER,
    p_recency_days INTEGER,
    p_tags JSONB,
    p_layer TEXT
)
RETURNS REAL AS $$
DECLARE
    v_score REAL := 0;
BEGIN
    -- Access frequency (40% weight)
    v_score := v_score + (p_access_count::REAL / 10.0 * 0.4);

    -- Recency (30% weight) - decay over time
    v_score := v_score + ((100.0 - (p_recency_days::REAL * 7.14)) / 100.0 * 0.3);

    -- Tags (20% weight)
    IF p_tags ? 'critical' THEN
        v_score := v_score + 0.2;
   ELSIF p_tags ? 'high' THEN
        v_score := v_score + 0.1;
    END IF;

    -- Layer priority (10% weight)
    CASE p_layer
        WHEN 'semantic' THEN v_score := v_score + 0.1;
        WHEN 'long' THEN v_score := v_score + 0.08;
        WHEN 'medium' THEN v_score := v_score + 0.05;
        WHEN 'short' THEN v_score := v_score + 0.02;
    END CASE;

    -- Clamp between 0 and 5
    IF v_score < 0 THEN v_score := 0; END IF;
    IF v_score > 5 THEN v_score := 5; END IF;

    RETURN ROUND(v_score::numeric, 2)::REAL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate score
CREATE OR REPLACE FUNCTION update_importance_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.score := calculate_importance(
        NEW.access_count,
        (julianday('now') - juliandate(NEW.created_at))::INTEGER,
        NEW.tags,
        NEW.layer
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_a Importance
    BEFORE INSERT OR UPDATE OF access_count, tags, layer
    ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_importance_score();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default instances
INSERT INTO instances (id, name, display_name, description) VALUES
    ('atlas', 'atlas', 'Atlas', 'Primary Mac-based instance'),
    ('vigil', 'vigil', 'Vigil', 'Linux/SSH-based instance')
ON CONFLICT (name) DO NOTHING;

-- Insert default agents for Atlas
INSERT INTO agents (id, instance_id, name, display_name, role) VALUES
    ('atlas_main', 'atlas', 'main', 'Main', 'Chief of Staff, CTO, COO'),
    ('atlas_context', 'atlas', 'context', 'Context', 'Omni-presence Awareness'),
    ('atlas_research', 'atlas', 'research', 'Research', 'Intelligence Gathering'),
    ('atlas_governance', 'atlas', 'governance', 'Governance', 'Guardian')
ON CONFLICT DO NOTHING;

-- Register schema version
INSERT INTO schema_migrations (version, applied_at) VALUES
    ('1.0.0', datetime('now'))
ON CONFLICT (version) DO NOTHING;
