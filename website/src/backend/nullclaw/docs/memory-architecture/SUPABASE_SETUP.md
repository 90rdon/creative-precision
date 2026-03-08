# Supabase as Centralized Memory Hub

## Overview

Use Supabase as your cloud-based centralized memory system for Atlas and Vigil.

### Benefits

| Feature | Why It Helps |
|---------|--------------|
| Free tier for development | No cost to experiment |
| PostgreSQL + pgvector | Semantic search included |
| Cloud API | Atlas & Vigil connect from anywhere |
| Real-time subscriptions | Near real-time sync |
| Auto backups | No manual backup management |
| Free 500MB storage | Plenty for initial experiments |

---

## Quick Start (5 minutes)

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Enter:
   - **Name**: nullclaw-memory
   - **Database Password**: Generate/choose a secure password
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait ~2 minutes for project to initialize

### Step 2: Enable pgvector Extension

In Supabase SQL Editor (from dashboard → SQL Editor):

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Step 3: Initialize Schema

Run this in SQL Editor to create the memory schema:

```sql
-- ============================================================
-- NULLCLAW MEMORY SCHEMA FOR SUPABASE
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
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
    access_count INTEGER DEFAULT 0,

    -- Tags and access
    tags JSONB DEFAULT '[]',
    access_level TEXT DEFAULT 'private',  -- public, shared, private

    -- Content
    content_hash TEXT NOT NULL,
    embedding_id TEXT,

    -- Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (instance_id) REFERENCES instances(id),
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
-- MESSAGES & SESSIONS
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
-- TAGS & PERMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    namespace TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Instance and agent indexes
CREATE INDEX IF NOT EXISTS idx_memories_instance ON memories(instance_id);
CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_memories_layer ON memories(layer);
CREATE INDEX IF NOT EXISTS idx_memories_access_level ON memories(access_level);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at DESC);

-- Vector similarity index
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (vector vector_cosine_ops);

-- Full-text search (Supabase provides this)
-- Enabled automatically with pg_vector extension

-- ============================================================
-- VIEWS
-- ============================================================

-- Active agents view
CREATE OR REPLACE VIEW v_active_agents AS
SELECT
    a.id, a.name, a.display_name, a.role,
    i.name as instance_name
FROM agents a
JOIN instances i ON a.instance_id = i.id
WHERE a.is_active = TRUE AND i.is_active = TRUE;

-- Extended memories view
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
-- INITIAL DATA
-- ============================================================

-- Insert default instances
INSERT INTO instances (id, name, display_name, description)
VALUES
    ('atlas', 'atlas', 'Atlas', 'Primary Mac-based instance'),
    ('vigil', 'vigil', 'Vigil', 'Linux/SSH-based instance')
ON CONFLICT (name) DO NOTHING;

-- Insert default agents for Atlas
INSERT INTO agents (id, instance_id, name, display_name, role)
VALUES
    ('atlas_main', 'atlas', 'main', 'Main', 'Chief of Staff'),
    ('atlas_context', 'atlas', 'context', 'Context', 'Awareness'),
    ('atlas_research', 'atlas', 'research', 'Research', 'Intelligence')
ON CONFLICT DO NOTHING;
```

### Step 4: Get Your Connection Strings

From Supabase dashboard → Settings → Database:

For Atlas (local):
```
postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

For Vigil (remote):
```
postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

---

## Configure Atlas

Edit `nullclaw_data/config.json`:

```json
{
  "memory": {
    "profile": "centralized",
    "backend": "supabase",
    "database": {
      "host": "db.<your-project-ref>.supabase.co",
      "port": 5432,
      "name": "postgres",
      "user": "postgres",
      "password": "<your-db-password>",
      "ssl": true
    },
    "vector_db": {
      "url": "https://<your-project-ref>.supabase.co",
      "api_key": "",
      "embedding_model": "nomic-embed-text-v1.5:free",
      "dimensions": 1536
    }
  }
}
```

---

## Configure Vigil

On 19.0.0.134, edit `/data/pi/.nullclaw/config.json`:

```json
{
  "memory": {
    "profile": "centralized",
    "backend": "supabase",
    "database": {
      "host": "db.<your-project-ref>.supabase.co",
      "port": 5432,
      "name": "postgres",
      "user": "postgres",
      "password": "<your-db-password>",
      "ssl": true
    }
  }
}
```

Both instances point to the **same Supabase project** - they share the same centralized memory!

---

## Test Connection

From Atlas:

```bash
psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
```

You should see:
```
psql (16.x)
Type "help" for help.

postgres=# SELECT name FROM instances;
  name
--------
 atlas
 vigil
(2 rows)
```

---

## Example Queries

### Create memory from Atlas

```sql
INSERT INTO memories (
    id, key, content, category,
    agent_id, instance_id, layer, tags, access_level,
    content_hash
) VALUES (
    'mem_atlas_test',
    'test_memory',
    'This is a test memory from Atlas',
    'test',
    'atlas_main',
    'atlas',
    'short',
    '["shared", "atlas", "test"]'::jsonb,
    'shared',
    md5('test_memory')
);
```

### Query from Vigil

```sql
-- Get shared memories from Atlas
SELECT
    v.key, v.content, v.tags, v.score
FROM v_cross_instance_memories v
WHERE v.instance_name != 'vigil'
ORDER BY v.created_at DESC
LIMIT 10;
```

### Full-text search

```sql
-- Search with semantic + full-text combined
SELECT
    m.key, m.content, m.tags,
    1 - (e.vector <-> '[0.1,0.2,...]'::vector) AS similarity
FROM memories m
LEFT JOIN embeddings e ON m.id = e.memory_id
WHERE m.layer = 'short'
  AND m.deleted_at IS NULL
ORDER BY similarity DESC
LIMIT 5;
```

---

## Supabase Real-Time (Optional)

### Subscribe to memory changes

Supabase provides real-time subscriptions out of the box:

```javascript
// From your agent code
const supabase = createClient(
  'https://<project-ref>.supabase.co',
  '<supabase-anon-key>'
);

// Subscribe to memory updates
supabase
  .channel('memories')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, (payload) => {
    console.log('Memory changed:', payload);
    // Refresh local cache, trigger action, etc.
  })
  .subscribe();
```

This gives you **real-time sync** without needing WebSocket servers!

---

## Backup & Security

### Enable Row Level Security (RLS)

In Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Atlas instance can manage its own memories
CREATE POLICY "atlas_memories" ON memories
  FOR ALL USING (agent_id LIKE 'atlas_%');

-- Vigil instance can manage its own memories
CREATE POLICY "vigil_memories" ON memories
  FOR ALL USING (agent_id LIKE 'vigil_%');

-- Both can read shared memories
CREATE POLICY "read_shared" ON memories
  FOR SELECT USING (access_level IN ('public', 'shared'));

-- Read-only for shared memories
CREATE POLICY "memories_read_only" ON memories
  FOR SELECT USING (TRUE);
```

### Backups

Supabase automatically performs:
- **Daily backups** - Up to 4 weeks retention
- **Point-in-time recovery** - Up to 7 days
- No manual backup management needed!

---

## Free Tier Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Database storage | 500MB | Plenty for experiments |
| Bandwidth | 1GB/month | Enough for normal usage |
| File storage | 1GB | For documents |
| Row limit | 50,000 rows | More than enough |
| API calls | 50K/month | Generous |

---

## Next Steps

1. **Create project** at https://supabase.com
2. **Run schema** in SQL Editor
3. **Get connection strings** from dashboard
4. **Configure Atlas** - update config
5. **Configure Vigil** - update config
6. **Test sharing** - create in Atlas, query from Vigil

---

## When to Use Local vs Supabase

| Scenario | Recommendation |
|----------|----------------|
| Experiments with 2-5 agents | Supabase (simpler) |
| Need full control of data | Local Docker |
| Low-latency only | Local Docker |
| Easy setup from anywhere | Supabase |
| Production scaling | Supabase (or local with remote) |

## Quick Checklist

- [ ] Supabase project created
- [ ] pgvector extension enabled
- [ ] Schema initialized
- [ ] Connection strings obtained
- [ ] Atlas config updated
- [ ] Vigil config updated
- [ ] Test query from Atlas
- [ ] Test query from Vigil
- [ ] Real-time subscriptions work (optional)
- [ ] RLS policies set up (optional)
