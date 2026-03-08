# On-Demand Memory Services Guide

## Quick Start

Start services only when you need them:

```bash
cd memory-architecture

# Start memory services (auto-stops after 15 min idle)
./memory.sh start

# Or start with immediate connection
./memory.sh connect

# Stop services manually
./memory.sh stop

# Check status
./memory.sh status
```

---

## How It Works

1. **Start on demand** - Services spin up in ~10 seconds
2. **Auto-stop** - Services stop after 15 minutes of no activity
3. **Resource efficient** - Zero resources when idle
4. **Seamless** - Agents can request services via HTTP

---

## Commands

| Command | Description |
|---------|-------------|
| `./memory.sh start` | Start memory services |
| `./memory.sh stop` | Stop memory services |
| `./memory.sh status` | Check if running |
| `./memory.sh connect` | Connect to database (persistence) |
| `./memory.sh request` | Start + execute command |
| `./memory.sh ping` | Quick health check |
| `./memory.sh logs` | View service logs |

---

## Resource Usage

| State | CPU | Memory | Disk |
|-------|-----|--------|------|
| Idle   | 0%  | 0MB    | 0MB  |
| Running (active) | ~0.5-1% | ~300MB | ~50MB |
| Running (idle) | ~0.1% | ~256MB | ~50MB |
| Stopped | 0% | 0MB | 0MB |

---

## Auto-Stop Timer

Services auto-stop after **15 minutes** of inactivity. To extend:

```bash
# Keep alive (extends timer)
./memory.sh keep-alive
```

Or make a request to any endpoint to reset the timer.

---

## HTTP Gateway (Optional)

For programmatic access from agents/services:

```bash
# Start gateway
cd services/gateway
npm install
npm start

# API endpoints
curl http://localhost:9500/status      # Check status
curl http://localhost:9500/start       # Start services
curl http://localhost:9500/stop        # Stop services
```

Example from Atlas agent:

```bash
# Agent requests memory before query
curl -X POST http://localhost:9500/request

# Then use database
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw
```

---

## Workflow Example

### Atlas needs to query memory:

```bash
# 1. Start services on-demand
./memory.sh start  # Or agent calls `curl http://localhost:9500/start`

# 2. Connect and query
./memory.sh connect

# 3. Do your work
SELECT * FROM v_memories_extended LIMIT 10;

# 4. Disconnect - services auto-stop after 15 min idle
\q
```

### Process flows:

```bash
#!/bin/bash
# atlas-memory-query.sh

# Start services
./memory.sh start

# Query database
psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw <<EOF
  SELECT key, content FROM memories WHERE access_level='shared' LIMIT 10;
EOF

# Services auto-stop after 15 min idle
echo "Query complete. Services will auto-stop when idle."
```

---

## Cron Jobs (Optional)

Start/stop on schedule:

```bash
# Start at 9 AM daily
0 9 * * * cd /path/to/memory-architecture && ./memory.sh start

# Stop at 11 PM daily
0 23 * * * cd /path/to/memory-architecture && ./memory.sh stop

# Or check hourly, stop if no activity recently
0 * * * * cd /path/to/memory-architecture && ./memory.sh status | grep "NOT RUNNING" > /dev/null || ./memory.sh stop
```

---

## Integration with Atlas/Vigil

Add to config or agent commands:

```json
// nullclaw_data/config.json
{
  "memory": {
    "pre_query": "./path/to/memory-architecture/memory.sh start",
    "on_demand": true,
    "database": {
      "host": "localhost",
      "port": 5432,
      "timeout": 5000
    }
  }
}
```

---

## Troubleshooting

### Services take time to start?

```bash
# Check container health
docker ps

# View logs
./memory.sh logs postgres
./memory.sh logs qdrant
./memory.sh logs redis
```

### Services not auto-stopping?

```bash
# Check activity file
cat .last_activity

# Manual stop
./memory.sh stop

# Verify stopped
./memory.sh status
```

### Want different timeout?

Edit `memory.sh`:
```bash
TIMEOUT_MINUTES=30  # Change from 15 to 30
```

---

## Tips

1. **First start takes longer** - Docker image pulls (~1-2 min)
2. **Subsequent starts** - Fast (~5-10 sec)
3. **Activity tracking** - Any command updates idle timer
4. **Minimal footprint** - Only runs when you use it
5. **Seamless** - Agents won't notice the difference

---

## Estimated Savings

| Duration | Continuous | On-Demand | Saved |
|----------|------------|------------|-------|
| 24 hours | 300 MB × 24h | 300 MB × 2h | ~6.9 GB-hours |
| 1 week   | 300 MB × 168h | 300 MB × 10h | ~47 GB-hours |
| 1 month  | 300 MB × 730h | 300 MB × 30h | ~210 GB-hours |

If you only use memory for 1-2 hours a day, you save **90%+** of resources!
