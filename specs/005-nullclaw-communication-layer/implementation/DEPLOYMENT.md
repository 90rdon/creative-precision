# Deployment Guide: Vigil Fleet Architecture

## Prerequisites

- Vigil Pi with Docker and Docker Compose installed
- Telegram bot token and chat ID for alerts
- Network access between Vigil Pi and nullclaw-kube via Tailscale

## Quick Start on Vigil Pi

### 1. Copy files to Vigil

```bash
# From your development machine
scp -r specs/005-nullclaw-communication-layer/implementation/ \
  90rdon-berry.local:/root/nullclaw-fleet/
```

### 2. Start fleet services on Vigil

```bash
# SSH into Vigil
ssh 90rdon-berry.local

# Navigate to fleet directory
cd /root/nullclaw-fleet/

# Copy schema to init location
cp fleet_schema.sql services/event-logger/init.sql

# Start services
docker compose -f docker-compose-vigil.yml up -d
```

### 3. Verify services are running

```bash
# Check all services
docker compose -f docker-compose-vigil.yml ps

# Should see:
#   - vigil-postgres (healthy)
#   - vigil-redis (healthy)
#   - vigil-qdrant (healthy)
#   - vigil-event-logger (healthy)
#   - vigil-telegram-bot (running)
```

### 4. Test event logger API

```bash
# Health check
curl http://localhost:18990/api/v1/health

# Should return:
# {
#   "status": "healthy",
#   "database": "connected",
#   "redis": "connected",
#   "timestamp": "..."
# }
```

### 5. Verify database tables

```bash
# Enter PostgreSQL container
docker exec -it vigil-postgres psql -U nullclaw -d postgres

# Check tables
\dt

# Should see:
#   - schema_migrations
#   - instances
#   - agents
#   - events
#   - decisions
#   - memories
#   - health_checks
#   - alerts
#   - daily_reports

# Exit
\q
```

## Configure Telegram Bot

### 1. Create a Telegram bot

1. Start a chat with @BotFather on Telegram
2. Send `/newbot` and follow instructions
3. Note the bot token (starts with numbers:numbers)
4. Start the bot and send it a message
5. Note your chat ID (use @userinfobot or visit `https://api.telegram.org/bot<token>/getUpdates`)

### 2. Set environment variables

```bash
# Create .env in implementation directory
cat > .env << EOF
TELEGRAM_BOT_TOKEN=123456789:abcdef...
TELEGRAM_CHAT_ID=987654321
EOF
```

### 3. Test Telegram alerts

```bash
# Via curl
curl -X POST http://localhost:18990/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "nullclaw-kube",
    "severity": "warning",
    "category": "test",
    "title": "Test Alert",
    "description": "This is a test alert from Vigil"
  }'
```

## Connect nullclaw-kube to Vigil

### 1. Get Vigil's Tailscale IP

```bash
# On Vigil Pi
tailscale ip -4

# Example output: 100.XX.XX.XX
```

### 2. Update nullclaw-kube config

Edit `/root/.config/nullclaw/config.json` on nullclaw-kube:

```json
{
  "vigil": {
    "endpoint": "http://100.XX.XX.XX:18990",
    "postgres": {
      "host": "100.XX.XX.XX",
      "port": 5432,
      "database": "postgres",
      "user": "nullclaw",
      "password": "nullclaw"
    },
    "redis": {
      "host": "100.XX.XX.XX",
      "port": 6379
    }
  }
}
```

### 3. Register nullclaw-kube with Vigil

```bash
# Via aieos-mcp tool
npx -y tsx src/index.ts --mcp-tool register_instance \
  --id nullclaw-kube \
  --type nullclaw \
  --endpoint http://nullclaw-kube:18791 \
  --environment kubernetes
```

### 4. Test event logging

```bash
# From nullclaw-kube
curl -X POST http://100.XX.XX.XX:18990/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "nullclaw-kube",
    "agent_id": "main",
    "event_type": "action",
    "category": "test",
    "severity": "info",
    "title": "Test event from nullclaw-kube",
    "description": "Testing Vigil event logging"
  }'
```

## Monitoring

### Check Fleet Health

```bash
# Get fleet health summary
curl http://localhost:18990/api/v1/health/summary

# Should return:
# {
#   "instances": [...],
#   "alerts_unresolved": 0,
#   "alerts": []
# }
```

### View Recent Events

```bash
# Get events for nullclaw-kube
curl http://localhost:18990/api/v1/events/nullclaw-kube?limit=10

# Get critical events only
curl http://localhost:18990/api/v1/events/nullclaw-kube?severity=critical&limit=10
```

### View Agent Decisions

```bash
# Get all decisions for nullclaw-kube
curl http://localhost:18990/api/v1/decisions/nullclaw-kube?limit=10

# Get decisions for specific agent
curl http://localhost:18990/api/v1/decisions/nullclaw-kube?agent_id=nullclaw-kube_main&limit=10
```

## Troubleshooting

### Service won't start

```bash
# Check logs
docker compose -f docker-compose-vigil.yml logs event-logger

# Restart service
docker compose -f docker-compose-vigil.yml restart event-logger
```

### Database connection failed

```bash
# Check PostgreSQL is healthy
docker compose -f docker-compose-vigil.yml ps postgres

# Check logs
docker logs vigil-postgres

# Verify credentials
docker exec -it vigil-postgres psql -U nullclaw -d postgres -c "SELECT 1"
```

### Redis not connecting

```bash
# Check Redis is healthy
docker compose -f docker-compose-vigil.yml ps redis

# Test connection
docker exec -it vigil-redis redis-cli ping

# Should return: PONG
```

### Events not appearing

```bash
# Check logs for errors
docker logs vigil-event-logger --tail 50

# Verify tables exist
docker exec -it vigil-postgres psql -U nullclaw -d postgres -c "\dt"

# Test direct query
docker exec -it vigil-postgres psql -U nullclaw -d postgres -c "SELECT COUNT(*) FROM events"
```

## Next Steps

After Vigil is running:

1. **Phase 2**: Add health check cron jobs to nullclaw-kube
2. **Phase 2**: Deploy daily report generator
3. **Phase 2**: Deploy HTTP health dashboard
4. **Phase 3**: Add agent systemd services for autorestart
5. **Phase 4**: Add anomaly detection and capacity planning

See `IMPLEMENTATION_PLAN.md` for full roadmap.
