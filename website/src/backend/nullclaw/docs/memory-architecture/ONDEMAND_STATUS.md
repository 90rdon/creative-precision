# On-Demand Memory System - Ready ✓

## Current Status

```
┌─────────────────────────────────────────────────────────────────┐
│  Memory Services Status                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✓ PostgreSQL 16  →  localhost:5432  (healthy)                 │
│  ✓ Qdrant        →  localhost:6333  (ready)                    │
│  ✓ Redis         →  localhost:6379  (ready)                    │
│                                                                │
│  Mode: ON-DEMAND                                              │
│  Auto-stop: 15 minutes idle                                    │
│  Resources: ~300MB when active                                 │
│  Cost: $0/month                                                │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Commands

```bash
cd memory-architecture

# Start services on-demand
./memory.sh start

# Check status
./memory.sh status

# Connect to database
./memory.sh connect

# Stop services
./memory.sh stop

# View logs
./memory.sh logs
```

---

## Quick Test

Connect to the database:

```bash
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw
```

Run test query:

```sql
SELECT name FROM instances LIMIT 5;
\q
```

---

## How On-Demand Works

**Normal Mode:**
```
Not using memory → Services stopped → 0 resources used
Start query      → Services spin up   → ~300MB (for ~15 min)
Done querying     → Services auto-stop → Back to 0 resources
```

**Resource Comparison:**

| Mode | CPU | Memory | Disk |
|------|-----|--------|------|
| Continuous | ~0.5-1% | ~300MB | ~50MB |
| On-demand idle | 0% | 0MB | 0MB |
| **Savings** | **100%** | **100%** | **0%** |

---

## Integration with Atlas/Vigil

### Option 1: Simple script call

Before Atlas/Vigil queries memory, it just needs to run:

```bash
./memory.sh start
```

Services start in ~10 seconds, then can be used for the rest of the session.

### Option 2: Programmatic

Create a pre-query hook in your config:

```json
{
  "memory": {
    "pre_query": "./path/to/memory-architecture/memory.sh start",
    "database": {
      "host": "localhost",
      "port": 5432
    }
  }
}
```

### Option 3: HTTP gateway (for advanced use)

```bash
# Start gateway
cd services/gateway
npm install && npm start

# From Atlas agent
curl -X POST http://localhost:9500/start

# Then use database
...
```

---

## Typical Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  Atlas needs memory                                           │
│       ↓                                                       │
│  Runs: ./memory.sh start                                     │
│       ↓                                                       │
│  Services start in ~10 seconds                                │
│       ↓                                                       │
│  Atlas queries database                                      │
│       ↓                                                       │
│  [15 minutes of inactivity]                                   │
│       ↓                                                       │
│  Services auto-stop (no manual action needed)                 │
│       ↓                                                       │
│  Back to 0 resource usage                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Quick Start

```bash
# 1. Verify services running
./memory.sh status

# 2. Test connection
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw

# You'll see:
# psql (16.x)
# Type "help" for help.

# 3. Run a query
SELECT name FROM instances;

# Output:
#   name
# ---------
#  atlas
#  vigil

# 4. Quit
\q

# 5. Services auto-stop after 15 min idle
#    (Check with: ./memory.sh status)
```

---

## Files Created

| File | Purpose |
|------|---------|
| `docker-compose-ondemand.yml` | On-demand service definitions |
| `memory.sh` | Service manager script |
| `ONDEMAND_GUIDE.md` | Full documentation |
| `services/gateway/` | HTTP gateway programmatic access |

---

## Next Steps

1. **Test a query** - Connect to database and try queries
2. **Configure Atlas** - Add pre-query hook if needed
3. **Configure Vigil** - Point to your Mac's IP
4. **Monitor resource usage** - Watch for ~300MB when active
5. **Adjust timeout** - Edit `memory.sh` if needed (default: 15 min)

---

## Resource Savings Example

If you use memory for:
- **2 hours/day** → Services run 2 hours instead of 24
- **~90% resource savings**

Monthly comparison:
- **Continuous**: 300 MB × 730 hours = ~219 GB-hours
- **On-demand**: 300 MB × 60 hours = ~18 GB-hours
- **Saved**: ~201 GB-hours (92%)

This scales nicely to your experiments!

---

## Troubleshooting

### Services not starting?
```bash
# Check Docker
docker ps

# Check logs
./memory.sh logs postgres
./memory.sh logs qdrant
./memory.sh logs redis
```

### Services not auto-stopping?
```bash
# Check activity
cat .last_activity

# Manual stop
./memory.sh stop

# Verify stopped
./memory.sh status
```

### Want different timeout?
```bash
# Edit memory.sh
nano memory.sh

# Change line:
TIMEOUT_MINUTES=30  # Was 15
```
