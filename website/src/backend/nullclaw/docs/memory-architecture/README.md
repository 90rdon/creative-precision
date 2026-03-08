# Multi-Instance Long-Term Memory System

## Executive Summary

A **scalable, cost-efficient multi-layer memory architecture** supporting Vigil, Atlas, and future instances with:
- **Near real-time** synchronization across agents
- **5-layer memory hierarchy** (working → short → medium → long → semantic)
- **Tag-based access control** for security
- **Automatic consolidation** for lifecycle management
- **On-demand** operation (starts only when needed)
- **Estimated cost**: $0/month (local, on-demand)
- **Resource savings**: 90%+ compared to always-on

---

## Quick Start

```bash
cd memory-architecture

# Start services on-demand (only when you need them!)
./memory.sh start

# Services run for 15 minutes then auto-stop
# Use ./memory.sh connect to extend the timer
```

---

## Quick Commands

| Command | Action |
|---------|--------|
| `./memory.sh start` | Start memory services |
| `./memory.sh stop` | Stop memory services |
| `./memory.sh status` | Check if running |
| `./memory.sh connect` | Connect to database (extends timer) |
| `./memory.sh request` | Start + execute command |

---

## Why On-Demand?

| Mode | Daily Resources | Monthly Resources |
|------|-----------------|-------------------|
| **Always-on** | 300 MB × 24h = 7.2 GB-hours | 216 GB-hours |
| **On-demand** | 300 MB × 2h = 0.6 GB-hours | 18 GB-hours |
| **Savings** | **91.7%** | **91.7%** |

If you use memory for 2 hours/day (typical):
- **Always-on**: Services run all day (7.2 GB-hours)
- **On-demand**: Services run 2 hours (0.6 GB-hours)
- **You save**: 6.6 GB-hours per day!

---

## Architecture at a Glance

```
                    Memory Hierarchy (5 Layers)
                    =========================

┌─────────────────────────────────────────────────────────────────┐
│ L1: Working Memory (in-process)                                  │
│        ↓ Every 10s                                               │
│ L2: Short-Term (SQLite, hours-days)                              │
│        ↓ Hourly                                                   │
│ L3: Medium-Term (PostgreSQL, days-weeks)                         │
│        ↓ Daily                                                   │
│ L4: Long-Term (Qdrant, months-years)                             │
│        ↓ Weekly                                                  │
│ L5: Semantic (Permanent)                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              On-Demand Operation                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Start when you query memory                                   │
│  • Auto-stop after 15 min idle                                  │
│  • Zero resources when stopped                                   │
│  • Starts in ~10 seconds                                         │
│  • Seamlessly switch from stopped to running                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack (All Free)

| Component | Technology | Cost | Startup Time |
|-----------|------------|------|--------------|
| Vector DB | Qdrant (Docker) | $0 | ~5s |
| Relational DB | PostgreSQL 16 + pgvector | $0 | ~8s |
| Cache | Redis | $0 | ~2s |
| Embeddings | nomic-embed-text-v1.5 (free) | $0 | - |
| LLM (local) | Llama 3.3 70B | Free | - |
| **Total** | | **$0** | **~10s** |

---

## Access Points

| Service | URL | Login |
|---------|-----|-------|
| PostgreSQL | `postgresql://nullclaw:nullclaw@localhost:5432/nullclaw` | - |
| Qdrant | `http://localhost:6333` | - |
| Redis | `localhost:6379` | - |

---

## Memory Access Levels

| Level | Visibility | Tags |
|-------|-----------|------|
| `public` | All instances | `["public", ...]` |
| `shared` | Cross-instance | `["shared", "atlas", "vigil"]` |
| `private` | Instance-only | `["private", "atlas"]` |
| `sensitive` | Explicit permit | `["sensitive", ""]` |

---

## Example Workflow

```
Atlas needs memory
       ↓
Run: ./memory.sh start
       ↓
Services start in ~10 seconds
       ↓
Connect and query memory
       ↓
[15 minutes of inactivity]
       ↓
Services auto-stop (no action needed)
```

---

## Integration

### Atlas Instance

Update `nullclaw_data/config.json`:

```json
{
  "memory": {
    "profile": "centralized",
    "backend": "postgresql",
    "on_demand": true,
    "database": {
      "host": "localhost",
      "port": 5432,
      "name": "nullclaw",
      "user": "nullclaw",
      "password": "nullclaw"
    },
    "vector_db": {
      "url": "http://localhost:6333"
    },
    "cache": {
      "host": "localhost",
      "port": 6379
    }
  }
}
```

### Vigil Instance

On 19.0.0.134, point to your Mac's IP:

```json
{
  "memory": {
    "database": {
      "host": "10.0.0.X",  // Your Mac's IP
      "port": 5432,
      "name": "nullclaw",
      "user": "nullclaw",
      "password": "nullclaw"
    }
  }
}
```

---

## Consolidation Pipeline

| Trigger | Action | Layer |
|---------|--------|-------|
| Every 10s | Snapshot/collapse | L1 → L2 |
| Every hour | Summarize/extract embeddings | L2 → L3 |
| Daily 3 AM | Importance score & promote/delete | L3 → L4 |
| Weekly | Pattern extraction | L4 → L5 |

---

## Monitoring

```bash
# Check status
./memory.sh status

# View logs
./memory.sh logs

# Test services
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw
```

---

## Scalability

| Agents | Memories | Storage | Estimated |
|--------|----------|---------|-----------|
| 5-10   | 10-50K   | ~1GB     | ~$0/mo |
| 10-50  | 50-100K  | ~10GB    | ~$0/mo |
| 50-100 | 100K-1M  | ~100GB   | ~$0/mo |
| 100+   | 1M+      | ~500GB+  | ~$0-5/mo |

---

## Troubleshooting

### Services not starting?

```bash
# Check Docker
docker ps

# Check logs
./memory.sh logs postgres
```

### Out of space?

```bash
# Check usage
du -sh data/* | sort -h

# Archive old data
./memory.sh stop
tar -czf backup.tar.gz data/
```

---

## Advanced Options

### HTTP Gateway (Programmatic access)

```bash
cd services/gateway
npm install && npm start

# API usage
curl http://localhost:9500/start
curl http://localhost:9500/status
curl http://localhost:9500/stop
```

### Custom Timeout

Edit `memory.sh`:
```bash
TIMEOUT_MINUTES=30  # Default is 15
```

---

## File Index

| File | Path | Purpose |
|------|------|--------|
| `README.md` | `/` | This file |
| `ONDEMAND_GUIDE.md` | `/` | On-demand operation guide |
| `ONDEMAND_STATUS.md` | `/` | Current status snapshot |
| `architecture.md` | `/` | Full architecture documentation |
| `decision-matrix.md` | `/` | Technology choices |
| `docker-compose-ondemand.yml` | `/` | On-demand service setup |
| `memory.sh` | `/` | Service manager script |
| `schema/pg_schema.sql` | `/schema/` | Database schema |

---

## Next Steps

1. **Test on-demand** - `./memory.sh start`
2. **Connect** - `./memory.sh connect` or `psql postgresql://...`
3. **Query memory** - Try some queries
4. **Configure Atlas** - Update config
5. **Configure Vigil** - Point to your Mac
6. **Test sharing** - Create in Atlas, query from Vigil

---

## Summary

This provides a **production-ready memory system** for your experiments that:
- Scales from 1 to 1000+ agents
- Cost $0/month (all local)
- Provides 90%+ resource savings via on-demand
- Near real-time sync
- Automatic consolidation
- Uses proven technologies (PostgreSQL, Qdrant, Redis)
