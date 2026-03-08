# Implementation Guide - Multi-Instance Long-Term Memory

## Quick Start (5 minutes)

### 1. Prerequisites

```bash
# Check available space (need ~5GB for initial setup)
df -h

# Install Docker (if not already)
# Mac: https://docs.docker.com/desktop/install/mac-install/
# Linux: curl -fsSL https://get.docker.com | sh

# Clone or navigate to the memory-architecture directory
cd memory-architecture
```

### 2. Start the Stack

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Verify Services

```bash
# PostgreSQL
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw -c "SELECT version();"

# Qdrant
curl http://localhost:6333/healthz

# Redis
redis-cli ping  # Should return PONG
```

### 4. Access Admin UI

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | admin / nullclaw |
| pgAdmin | http://localhost:5050 | admin@nullclaw.local / admin |
| Prometheus | http://localhost:9090 | - |
| Qdrant Dashboard | http://localhost:6333/dashboard | - |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Memory Hierarchy                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  L1: Working Memory (In-process)  →  L2: Short-term (SQLite)    │
│              (seconds)                                             (hours-days)      │
│                       ↓ Every 10s                                   ↓ Hourly     │
│  L3: Medium-term (PostgreSQL + pgvector) → L4: Long-term (Qdrant)│
│             (days-weeks)                                             (months-years) │
│                       ↓ Daily                                        ↓ Weekly    │
│  L5: Semantic (Permanent)                                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Consolidation Triggers

| Layer | Trigger | Actions |
|-------|---------|---------|
| L1→L2 | Every 10s | Snapshot, compress, store |
| L2→LL3 | Every hour | Summarize, extract entities, generate embeddings |
| L3→L4 | Daily | Importance scoring, archive or promote |
| L4→L5 | Weekly | Pattern extraction, knowledge graph |

---

## Migration from Current System

### Step 1: Export Existing Data

```bash
cd nullclaw_data/workspace

# Export memory database
sqlite3 memory.db ".dump memories" > memories.sql
sqlite3 memory.db ".dump messages" > messages.sql
sqlite3 memory.db ".dump sessions" > sessions.sql

# Or use the built SQLite export
sqlite3 memory.db .dump > full_export.sql
```

### Step 2: Import to PostgreSQL

```bash
# Convert SQLite dump to PostgreSQL format
# (Use sqlite3 pgloader or scripts/pgloader)

# Or use pgloader
pgloader --verbose \
  "sqlite:///nullclaw_data/workspace/memory.db" \
  "postgresql://nullclaw:nullclaw@localhost:5432/nullclaw"
```

### Step 3: Tag and Classify

```sql
-- Update existing memories with layer information
UPDATE memories
SET layer = CASE
    WHEN julianday('now') - julianday(created_at) < 1 THEN 'short'
    WHEN julianday('now') - julianday(created_at) < 7 THEN 'medium'
    ELSE 'long'
END;
```

### Step 4: Generate Embeddings

```bash
# Use the consolidation service
curl -X POST http://localhost:3001/api/embedding/generate \
  -H "Content-Type: application/json" \
  -d '{"batch": true, "model": "nomic-embed-text-v1.5:free"}'
```

---

## Configuration

### Atlas Config Update

Edit `nullclaw_data/config.json`:

```json
{
  "memory": {
    "profile": "centralized",
    "backend": "postgresql",
    "database": {
      "host": "localhost",
      "port": 5432,
      "user": "nullclaw",
      "password": "nullclaw",
      "database": "nullclaw"
    },
    "vector_db": {
      "url": "http://localhost:6333",
      "embedding_model": "nomic-embed-text-v1.5:free",
      "dimensions": 768
    },
    "sync": {
      "enabled": true,
      "method": "websocket",
      "url": "ws://localhost:8080"
    }
  }
}
```

### Vigil Config Update

Since Vigil runs on 19.0.0.134, you have two options:

#### Option A: Direct Connection (Same Network)

```bash
# Configure Vigil to connect to Atlas's database
vi /data/pi/.nullclaw/config.json
```

```json
{
  "memory": {
    "database": {
      "host": "10.0.0.X",  # Atlas's IP
      "port": 5432,
      "user": "nullclaw",
      "password": "nullclaw",
      "database": "nullclaw"
    }
  }
}
```

#### Option B: Database Sync

```bash
# On Atlas, run periodic sync via cron
# Add to crontab -e:
# 0 * * * * pg_dump nullclaw | ssh gordon@19.0.0.134 "psql nullclaw"
```

---

## Real-Time Sync Setup

### WebSocket Server

The sync service runs automatically. Connection details:

```javascript
// Connect from agents
const ws = new WebSocket('ws://localhost:8080');

ws.on('connect', () => {
  console.log('Connected to sync service');
});

// Subscribe to instance updates
ws.send(JSON.stringify({
  type: 'subscribe',
  instance: 'atlas',
  agent: 'main'
}));

// Listen for updates
ws.on('message', (data) => {
  const event = JSON.parse(data);
  if (event.type === 'memory_update') {
    // Refresh local cache
  }
});
```

### Redis Pub/Sub (Alternative)

```bash
# Publish memory update
redis-cli PUBLISH nullclaw.memories '{"id": "abc", "type": "created"}'

# Subscribe (in your service)
redis-cli SUBSCRIBE nullclaw.memories
```

---

## Memory Operations Examples

### Store Memory

```sql
-- Create or update memory
INSERT INTO memories (id, key, content, category, agent_id, instance_id, layer, tags, access_level) VALUES
  ('mem_xxx', 'project_goals', 'The project goals are...', 'core', 'atlas_main', 'atlas',
   'medium', '["shared", "atlas", "action"]'::jsonb, 'shared')
ON CONFLICT (key, agent_id) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = datetime('now');

-- Create embedding
INSERT INTO embeddings (id, memory_id, vector, model_name)
SELECT 'emb_' || uuid_generate_v4(), m.id, ARRAY[0.1, 0.2, ...], 'nomic-embed-text-v1.5'
FROM memories m
WHERE m.key = 'project_goals';
```

### Query Memory

```sql
-- Get high-value memories
SELECT * FROM v_memories_high_value
WHERE instance_name = 'atlas'
ORDER BY score DESC
LIMIT 10;

-- Full-text search
SELECT * FROM memories
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'project & goal');

-- Vector similarity search
SELECT m.*, e.vector <-> '[0.1,0.2,...]'::vector AS distance
FROM memories m
JOIN embeddings e ON m.id = e.memory_id
WHERE m.access_level = 'shared'
ORDER BY distance
LIMIT 10;
```

### Cross-Instance Sharing

```sql
-- Share memory with Vigil
INSERT INTO shared_memories (id, source_memory_id, source_instance_id, target_instance_id)
VALUES (uuid_generate_v4(), 'mem_xxx', 'atlas', 'vigil');

-- Vigil queries for shared memories
SELECT * FROM v_cross_instance_memories
WHERE instance_name != 'vigil';
```

---

## Monitoring

### Grafana Dashboards

Pre-configured dashboards are available at:
- Memory Usage (`/dashboards/memory.json`)
- Query Performance (`/dashboards/queries.json`)
- Consolidation Status (`/dashboards/consolidation.json`)

### Key Metrics to Monitor

| Metric | Metric Name | Alert |
|--------|-------------|-------|
| Database size | `postgres_database_size_bytes` | >10GB |
| Query latency | `postgres_query_duration_seconds` | >1s |
| Vector DB size | `qdrant_collection_points` | >1M |
| Memory score | `memory_importance_score` | High variance |

---

## Cost Estimation

### Local Deployment (Recommended)

| Item | Cost |
|------|------|
| Infrastructure (Docker) | $0 |
| Storage (first 1TB) | $0 |
| Embeddings (1M/year) | $0 (using free nomic model) |
| LLM Summarization | $5-10/mo (local models) |
| **Total** | **~$10/mo** |

### With Cloud Backup

| Item | Cost |
|------|------|
| Above | ~$10/mo |
| Cloudflare R2 (500GB) | ~$7.5/mo |
| **Total** | **~$18/mo** |

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw
```

### Vector Search Not Working

```bash
# Start Qdrant container
docker-compose up -d qdrant

# Check logs
docker-compose logs qdrant

# Test API
curl http://localhost:6333/collections/nullclaw_memories
```

### Sync Issues

```bash
# Check WebSocket server
docker-compose logs sync

# Test Redis
redis-cli ping

# Check pub/sub
redis-cli PUBSUB CHANNELS
```

---

## Next Steps

1. **Setup infrastructure** - Run `docker-compose up -d`
2. **Migrate existing data** - Export SQLite and import to PostgreSQL
3. **Configure agents** - Update Atlas and Vigil configs
4. **Test sync** - Verify cross-instance memory sharing
5. **Monitor tuning** - Set up Grafana alerts

---

## Resources

- **Quick Reference**: See `decision-matrix.md`
- **Architecture**: See `architecture.md`
- **Schema**: See `schema/pg_schema.sql`
- **Docker Setup**: See `docker-compose.yml`
