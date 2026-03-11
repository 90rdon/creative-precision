-- Fleet Architecture Schema for NullClaw Communication Layer
-- ======================================================
-- PostgreSQL 16+ for Vigil central storage
-- Tables: instances, agents, events, decisions, memories, health_checks, alerts, daily_reports

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- INSTANCE AND AGENT REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    environment TEXT,                    -- 'kubernetes', 'raspberry-pi', 'docker'
    endpoint TEXT,                       -- Gateway URL
    status TEXT DEFAULT 'unknown',       -- 'online', 'offline', 'degraded'
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    instance_id TEXT REFERENCES instances(id),
    name TEXT,
    role TEXT,                           -- 'main', 'expert', 'synthesizer', 'engineer', 'simulator'
    workspace_path TEXT,
    status TEXT DEFAULT 'idle',          -- 'idle', 'active', 'error', 'degraded'
    last_activity TIMESTAMP
);

-- ============================================================================
-- EVENT AND DECISION LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id TEXT REFERENCES instances(id),
    agent_id TEXT REFERENCES agents(id),
    event_type TEXT NOT NULL,             -- 'action', 'error', 'warning', 'info'
    category TEXT,                        -- e.g., 'synthesis', 'simulation', 'optimization'
    severity TEXT DEFAULT 'info',         -- 'critical', 'error', 'warning', 'info', 'debug'
    title TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,   -- Flexible data storage
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id TEXT REFERENCES instances(id),
    agent_id TEXT REFERENCES agents(id),
    event_id TEXT REFERENCES events(id),
    decision_type TEXT NOT NULL,          -- 'tool_use', 'route', 'memory_retrieval', 'response'
    decision_context JSONB,
    decision_logic TEXT,                  -- LLM reasoning text
    decision_outcome JSONB,               -- Action taken
    result TEXT,                          -- 'success', 'failure', 'partial'
    confidence REAL,                      -- 0.0 to 1.0
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MEMORY LAYERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agent_id TEXT REFERENCES agents(id),
    layer TEXT NOT NULL,                  -- 'L1', 'L2', 'L3', 'L4', 'L5'
    key TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    importance_score REAL DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM HEALTH AND ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_checks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id TEXT REFERENCES instances(id),
    service TEXT NOT NULL,                 -- 'postgresql', 'qdrant', 'redis', 'gateway', etc.
    status TEXT NOT NULL,                 -- 'healthy', 'degraded', 'down'
    checked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id TEXT REFERENCES instances(id),
    severity TEXT NOT NULL,               -- 'critical', 'warning', 'info'
    category TEXT,
    title TEXT NOT NULL,
    description TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PERIODIC REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_reports (
    report_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    summary TEXT,
    metrics JSONB,
    generated_at TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Instance and agent lookups
CREATE INDEX IF NOT EXISTS idx_agents_instance ON agents(instance_id);
CREATE INDEX IF NOT EXISTS idx_events_instance ON events(instance_id);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

-- Event severity filtering
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity, created_at DESC);

-- Decision tracking
CREATE INDEX IF NOT EXISTS idx_decisions_instance ON decisions(instance_id);
CREATE INDEX IF NOT EXISTS idx_decisions_agent ON decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON decisions(decision_type);

-- Memory retrieval
CREATE INDEX IF NOT EXISTS idx_memories_layer ON memories(layer);
CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at DESC);

-- Health checks
CREATE INDEX IF NOT EXISTS idx_health_instance ON health_checks(instance_id);
CREATE INDEX IF NOT EXISTS idx_health_service ON health_checks(service);
CREATE INDEX IF NOT EXISTS idx_health_checked_at ON health_checks(checked_at DESC);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_instance ON alerts(instance_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(is_resolved);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active instances with agents
CREATE OR REPLACE VIEW v_active_instances AS
SELECT
    i.id, i.name, i.environment, i.endpoint, i.status, i.last_seen,
    COUNT(a.id) as agent_count
FROM instances i
LEFT JOIN agents a ON i.id = a.instance_id
GROUP BY i.id, i.name, i.environment, i.endpoint, i.status, i.last_seen;

-- Recent critical events
CREATE OR REPLACE VIEW v_recent_critical_events AS
SELECT
    e.id, e.title, e.event_type, e.category, e.severity, e.created_at,
    i.name as instance_name, a.name as agent_name
FROM events e
LEFT JOIN instances i ON e.instance_id = i.id
LEFT JOIN agents a ON e.agent_id = a.id
WHERE e.severity IN ('critical', 'error')
ORDER BY e.created_at DESC
LIMIT 50;

-- Unresolved alerts
CREATE OR REPLACE VIEW v_unresolved_alerts AS
SELECT
    a.id, a.title, a.severity, a.category, a.created_at,
    i.name as instance_name
FROM alerts a
LEFT JOIN instances i ON a.instance_id = i.id
WHERE a.is_resolved = false
ORDER BY a.severity, a.created_at DESC;

-- Agent status summary
CREATE OR REPLACE VIEW v_agent_status AS
SELECT
    a.id, a.name, a.role, a.status, a.last_activity,
    i.name as instance_name,
    COUNT(e.id) as event_count_24h
FROM agents a
JOIN instances i ON a.instance_id = i.id
LEFT JOIN events e ON a.id = e.agent_id AND e.created_at > NOW() - INTERVAL '24 hours'
GROUP BY a.id, a.name, a.role, a.status, a.last_activity, i.name;
