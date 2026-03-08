# Local Quick Start - Zero Cost Setup

## What This Setup Includes

| Service | Purpose | Storage Location | Cost |
|---------|---------|------------------|------|
| PostgreSQL 16 + pgvector | Medium-term memory | `data/postgres/` | $0 |
| Qdrant | Long-term vector storage | `data/qdrant/` | $0 |
| Redis | Cache & real-time sync | `data/redis/` | $0 |
| pgAdmin | Database UI | N/A | $0 |

**Total Cost: $0/month** (just uses your Mac's disk/CPU)

---

## Setup (30 seconds)

```bash
cd memory-architecture

# Start all services
./start.sh
```

That's it! All services start automatically.

---

## Verify Services

```bash
# Check status
./status.sh

# Run tests
./status.sh test

# View logs
./status.sh logs
```

---

## Access Points

| Service | URL | Login |
|---------|-----|-------|
| PostgreSQL | `postgresql://nullclaw:nullclaw@localhost:5432/nullclaw` | - |
| Qdrant | `http://localhost:6333` | - |
| pgAdmin | `http://localhost:5050` | nullclaw@local / nullclaw |
| Redis | `localhost:6379` | - |

---

## Test Connection with psql

```bash
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw

# Once connected, run:
\dt                    -- List tables
SELECT * FROM instances;  -- See instances
SELECT * FROM v_active_agents;  -- See agents
\q                     -- Quit
```

---

## Connect Atlas Instance

Edit `nullclaw_data/config.json`:

```json
{
  "memory": {
    "profile": "centralized",
    "backend": "postgresql",
    "database": {
      "host": "localhost",
      "port": 5432,
      "name": "nullclaw",
      "user": "nullclaw",
      "password": "nullclaw",
      "path": "postgresql://nullclaw:nullclaw@localhost:5432/nullclaw"
    },
    "vector_db": {
      "url": "http://localhost:6333",
      "api_key": ""
    },
    "cache": {
      "host": "localhost",
      "port": 6379
    }
  }
}
```

---

## Connect Vigil Instance

Since Vigil runs on 19.0.0.134, you have two options:

### Option 1: Direct Network Connection

Edit Vigil's config to point to your Mac:

```bash
ssh gordon@19.0.0.134
vi /data/pi/.nullclaw/config.json
```

```json
{
  "memory": {
    "database": {
      "host": "10.0.0.X",  // Your Mac's IP on the network
      "port": 5432,
      "name": "nullclaw",
      "user": "nullclaw",
      "password": "nullclaw",
      "path": "postgresql://nullclaw:nullclaw@10.0.0.X:5432/nullclaw"
    }
  }
}
```

### Option 2: Periodic Sync

Run a sync cron on your Mac:

```bash
# Find your network IP
ifconfig | grep inet

# Add to crontab:
0 * * * * pg_dump nullclaw | ssh gordon@19.0.0.134 "psql nullclaw"
```

---

## Storage Locations on Disk

```
memory-architecture/
├── data/
│   ├── postgres/      # Database files (~10-100MB initially)
│   ├── qdrant/        # Vector storage (~10-50MB initially)
│   └── redis/         # Cache data (~5-10MB)
└── ...
```

---

## Monitoring Storage

```bash
# Check total usage
./status.sh

# Check individual storage
du -sh data/postgres data/qdrant data/redis

# Watch in real-time
watch 'du -sh data/*/ | awk "{sum+=$1} END {print "Total:", sum}"'
```

---

## Example Memory Operations

### Store Memory (from Atlas)

```sql
-- Connect to database
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw

-- Create memory
INSERT INTO memories (
    id, key, content, category,
    agent_id, instance_id, layer, tags, access_level,
    content_hash, created_at, updated_at
) VALUES (
    'mem_' || uuid_generate_v4(),
    'setup_complete',
    'Local memory system setup completed successfully',
    'system',
    'atlas_main',
    'atlas',
    'short',
    '["shared", "atlas", "setup"]'::jsonb,
    'shared',
    md5('setup_complete'),
    datetime('now'),
    datetime('now')
);
```

### Query Shared Memories (from Vigil)

```sql
-- Get memories shared by Atlas
SELECT
    m.key, m.content, m.tags, m.score,
    a.name as agent_name, i.name as instance_name
FROM memories m
JOIN agents a ON m.agent_id = a.id
JOIN instances i ON m.instance_id = i.id
WHERE m.access_level IN ('public', 'shared')
  AND i.name != 'vigil'
  AND m.deleted_at IS NULL
ORDER BY m.created_at DESC
LIMIT 10;
```

### Full-Text Search

```sql
-- Search for specific content
SELECT
    m.key, m.content,
    ts_headline('english', m.content, q.query) AS highlighted
FROM memories m,
     to_tsquery('english', 'memory & setup') q
WHERE to_tsvector('english', m.content) @@ q
  AND m.deleted_at IS NULL
LIMIT 5;
```

---

## Stop Services

```bash
# Stop but keep data
docker-compose -f docker-compose-local.yml stop

# Or remove containers (data preserved):
docker-compose -f docker-compose-local.yml down

# To clean start (removes data too):
rm -rf data/*
docker-compose -f docker-compose-local.yml up -d
```

---

## Troubleshooting

### Services not starting?

```bash
# Check Docker status
docker info

# Check port conflicts
lsof -i :5432 -i :6333 -i :6379

# View service logs
./status.sh logs postgres
./status.sh logs qdrant
./status.sh logs redis
```

### Database not responding?

```bash
# Restart PostgreSQL
docker-compose -f docker-compose-local.yml restart postgres

# Check database
docker exec nullclaw-postgres psql -U nullclaw -d nullclaw -c "SELECT 1;"
```

### Out of space?

```bash
# Check disk usage
./status.sh

# Clean old data if needed
sudo du -sh data/* | sort -h

# Archive old memories
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw -c "
  UPDATE memories SET archived_at = datetime('now')
  WHERE created_at < datetime('now', '-30 days')
  AND score < 2;
"
```

---

## Next Steps

1. **Start services** - `./start.sh`
2. **Test connection** - `./status.sh test`
3. **Open pgAdmin** - Configure server for visualization
4. **Configure Atlas** - Update config to point to local DB
5. **Configure Vigil** - Point to your Mac's IP
6. **Test sharing** - Create memory in Atlas, query from Vigil

---

## Estimated Costs

| Item | Usage | Cost |
|------|-------|------|
| Infrastructure | Docker on existing Mac | $0 |
| Storage | First 100GB on Mac | $0 |
| Embeddings | nomic free tier (1M/month) | $0 |
| LLM | Local Llama 3.3 | $0 |
| **Monthly Total** | | **$0** |

You pay nothing extra to run this experiment!

---

## When You Need More

- **Cloud backup**: Add Cloudflare R2 (~$7.50/mo for 500GB)
- **Managed services**: Move to Supabase/Qdrant Cloud (~$30/mo)
- **More agents**: Just keep scaling (100GB+ handled easily)
