# Event Logger Service

## Purpose

Central event logging service for the NullClaw fleet. Receives events from instances, logs them to central PostgreSQL on Vigil, and provides fleet-wide access to decision traceability.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Event Logger Service                        │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   HTTP API  │  │  WebSocket  │  │  MCP Tools  │          │
│  │ (REST /log) │  │ (Pub/Sub)   │  │ (Fleet logs) │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                              │     │
│         ↓                ↓                              ↓     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PostgreSQL (Vigil)                       │  │
│  │  • events table                                      │  │
│  │  • decisions table                                    │  │
│  │  • health_checks table                               │  │
│  │  • alerts table                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                                  │
│         ↓                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Redis Pub/Sub                            │  │
│  │  • events:alerts channel                              │  │
│  │  • events:health channel                              │  │
│  │  • queue:consolidation:*                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### POST /api/v1/events

Log an event to central storage.

**Request:**
```json
{
  "instance_id": "nullclaw-kube",
  "agent_id": "main",
  "event_type": "action",
  "category": "orchestration",
  "severity": "info",
  "title": "Daily intelligence cycle started",
  "description": "Manual trigger: 'Run intelligence cycle now'",
  "metadata": {
    "trigger": "manual",
    "timestamp": "2026-03-08T14:30:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "uuid",
  "created_at": "2026-03-08T14:30:00Z"
}
```

### POST /api/v1/decisions

Log a decision with full context and trace ID.

**Request:**
```json
{
  "instance_id": "nullclaw-kube",
  "agent_id": "expert",
  "event_id": "event-uuid",
  "decision_type": "tool_use",
  "decision_context": {
    "input": "What should I do about AI governance?",
    "state": { "stage": 2, "context": "..." },
    "tools_available": ["web_search", "read_file"],
    "considered_options": ["Research frameworks", "Ask clarifying question"]
  },
  "decision_logic": "Based on the executive's question about AI governance...",
  "decision_outcome": {
    "tool": "web_search",
    "parameters": { "query": "AI governance frameworks 2026" },
    "execution_time_ms": 250
  },
  "result": "success",
  "confidence": 0.85
}
```

### POST /api/v1/health/check

Record a health check from an instance.

**Request:**
```json
{
  "instance_id": "nullclaw-kube",
  "service": "postgresql",
  "status": "healthy",
  "details": {
    "connections": 5,
    "query_avg_ms": 2.3
  }
}
```

### POST /api/v1/alerts

Create or update an alert.

**Request:**
```json
{
  "instance_id": "nullclaw-kube",
  "severity": "critical",
  "category": "agent_crash",
  "title": "Expert agent crashed",
  "description": "Agent 'expert' status = 'error' for >30s"
}
```

### GET /api/v1/health

Get current system health across fleet.

**Response:**
```json
{
  "instances": [
    {
      "id": "nullclaw-kube",
      "status": "online",
      "services": {
        "postgresql": "healthy",
        "qdrant": "healthy",
        "redis": "healthy"
      }
    }
  ],
  "alerts_unresolved": 0
}
```

## MCP Integration with aieos-mcp

The event logger adds the following MCP tools to aieos-mcp:

| Tool | Description |
|------|-------------|
| `log_event` | Log an event to central storage |
| `log_decision` | Log a decision with trace ID |
| `report_health` | Report instance health status |
| `create_alert` | Create an alert for escalation |
| `get_fleet_health` | Get fleet-wide health summary |
| `list_instance_events` | Query events for a specific instance |
| `list_instance_decisions` | Query decisions for a specific instance/agent |

## Local Event Buffer

On each worker instance (nullclaw-kube, etc.), events are buffered locally before async sync to Vigil:

```
Event → Local Buffer (SQLite) → Async Sync → Vigil PostgreSQL
                  ↑                                  ↓
                  └──── Retry on failure ───────────────┘
```

This ensures:
- Fast local operations (no network latency)
- No loss on network failure (retry queue)
- Fleet-wide visibility via Vigil

## Implementation Checklist

- [ ] Create FastAPI/Express server scaffold
- [ ] Set up PostgreSQL connection pool
- [ ] Implement event logging endpoint (`/api/v1/events`)
- [ ] Implement decision logging endpoint (`/api/v1/decisions`)
- [ ] Implement health check endpoint (`/api/v1/health/check`)
- [ ] Implement alert endpoint (`/api/v1/alerts`)
- [ ] Add WebSocket support for real-time pub/sub
- [ ] Integrate with Redis for pub/sub channels
- [ ] Add MCP tools to aieos-mcp for fleet access
- [ ] Deploy to Vigil Pi via Docker
- [ ] Add local event buffer to nullclaw-kube
