# NullClaw Memory Architecture and 3-Tier Communication Layer

## Vision

A complete agentic system with 5-layer memory hierarchy, 3-tier human communication, and full decision traceability.

## Status

**Phase: Planning**

---

## Scope

### Decision Matrix: Local Postgres vs Neon

| Factor | Local Postgres (Vigil Pi) | Neon | Decision |
|--------|--------------------------|------|----------|
| Cost | $0 | Free tier (~0.5GB) or $~19/mo for 1GB+ | **Local** |
| Availability | Fleet-wide via Tailscale | Accessible from anywhere | **Local (Tailscale)** |
| Branching | Manual dumps | Native branching | Not a blocker |
| Backups | Neon cloud backup (fleet-state) | Built-in point-in-time recovery | **Neon for fleet-state backup** |
| Scaling | Scales via fleet expansion | On-demand compute/storage | **Local (fleet scales)** |

**Final Decision:** Central storage on Vigil Pi, Neon backup for fleet-state redundancy.

### Fleet Architecture

Vigil on Pi is the fleet orchestrator and central storage provider. Fleet-wide coordination via Tailscale network.

```
Vigil on Pi (Fleet Master)
├── aieos-mcp Server (13 tools)
│   ├── Fleet operations (list, status, deploy, update, scale)
│   ├── Monitoring (metrics, health, logs)
│   ├── Control (start, stop, restart instances)
│   ├── Memory (query, consolidate across fleet)
│   └── Approvals (workflow management)
├── Central Storage
│   ├── PostgreSQL (events, decisions, instances, agents)
│   ├── Qdrant (vector memory)
│   └── Redis (cache, pub/sub, queues)
└── Neon Backup
    └── Fleet state redundancy (30-day retention, instant restore)

nullclaw-kube (Worker Instance)
├── Main agent (heartbeat enforcement)
├── Event logger (local + async sync to Vigil)
├── Agents: Expert, Synthesizer, Simulator, Engineer
└── Reports to Vigil via aieos-mcp

Worker Pis (Worker Instances)
└── Same pattern as nullclaw-kube

K8s Workers (Distributed Instances)
└── Fleet coordination via Vigil
```

**Network Access:**
- All instances connect to Vigil via Tailscale
- Central storage accessible via `tailnet` IPs
- Fleet state synced to Neon from Vigil

**Event Logging Strategy:**
- Dual: local storage per instance + async sync to Vigil
- Local: fast operations, no network dependency
- Sync: fleet-wide visibility via Vigil central storage

### 5-Layer Memory Architecture

```
L1: Working Memory (In-process)
        ↓ Every 10s
L2: Short-Term Memory (SQLite)
        ↓ Hourly
L3: Medium-Term Memory (PostgreSQL + pgvector)
        ↓ Daily
L4: Long-Term Memory (Qdrant)
        ↓ Weekly
L5: Semantic Memory (Permanent)
```

1. **L1: Working Memory (In-process)**
   - Duration: seconds
   - Trigger to L2: Every 10s

2. **L2: Short-Term Memory (SQLite)**
   - Duration: hours-days
   - Trigger to L3: Hourly

3. **L3: Medium-Term Memory (PostgreSQL + pgvector)**
   - Duration: days-weeks
   - Trigger to L4: Daily

4. **L4: Long-Term Memory (Qdrant)**
   - Duration: months-years
   - Trigger to L5: Weekly

5. **L5: Semantic Memory (Permanent)**
   - Duration: permanent
   - Update: Pattern extraction

### Redis Infrastructure Layer

Redis is infrastructure that **supports** the 5-layer hierarchy. It provides access acceleration and coordination, not storage.

| Redis Role | Function | Example Use |
|------------|----------|-------------|
| **Cache (L0 Layer)** | Fast in-memory access to hot data | Agent status lookup, request count caching |
| **Pub/Sub** | Real-time event broadcasting | Cross-instance sync, health change notifications, alert broadcasts |
| **Queues** | Consolidation pipeline orchestration | L1→L2 queue, L2→L3 queue, alert processing queue |
| **Session State** | Temporary multi-step workflow data | Conversation context, decision chains |

**Relationship to Memory Layers:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     5-LAYER MEMORY HIERARCHY                        │
│                                                                     │
│  L1: Working → L2: Short → L3: Medium → L4: Long → L5: Semantic     │
│      (seconds)    (days)    (weeks)    (years)    (permanent)       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Redis Infrastructure
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                          REDIS ROLES                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Cache     │  │  Pub/Sub    │  │    Queues   │                 │
│  │  (L0 Layer) │  │  (Events)   │  │ (Workflows) |                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Distinction:**
- **Storage decisions** (what to keep vs discard) live in the 5-layer hierarchy
- **Redis** makes access faster and enables coordination across services
- Redis is "access acceleration" not a storage layer

### 3-Tier Human Communication

#### Tier 1: Alerts (Real-Time, Reactive)

Triggers requiring immediate human attention:

| Alert Type | Severity | Triggers | Action |
|------------|----------|----------|--------|
| Agent Crash | Critical | Agent status = 'error' for >30s | Alert agent, auto-restart, log alert |
| Database Failure | Critical | 3 consecutive failed health checks | Alert, try failover, notify admin |
| Memory Corruption | Critical | Integrity check fail | Alert, pause affected agent, advise |
| Unusual Error Rate | Warning | >10% errors in 5-min window | Alert, flag for investigation |
| Degraded Performance | Warning | p95 latency > 3x baseline | Alert, suggest scaling |
| Security Anomaly | Critical | Unauthorized access attempt | Alert, lock down, notify admin |
| Resource Exhaustion | Warning | CPU/memory > 90% for 5min | Alert, suggest action |
| Data Integrity | Error | Orphaned records, constraint violations | Alert, suggest repair |
| LLM Cost Spike | Warning | Hourly cost > 3x baseline | Alert, flag unusual usage |

**Alert Delivery:** Telegram bot push (immediate)

#### Tier 2: Periodic Reports (Cadence-Based, Digestive)

**Daily Report Format:**
```markdown
# Daily Report — [Date]

## System Status
- Instances Online: X/Y
- Agents Active: X/Y
- Overall Health: Healthy / Degraded / Down

## Key Events
[Top 10 events by impact]

## Metrics Summary
- Session count: X
- Total decisions: X
- CPU avg/max: X%
- Memory avg/max: X GB
- Database size: X GB
- Vector DB size: X GB

## Anomalies Detected
[Unusual patterns, spikes, drops]

## Cost Summary
- LLM usage: $X.YY

## Recommendations
[Based on patterns and trends]
```

**Weekly Trends Analysis:**
```markdown
# Weekly Report — Week of [Date to Date]

## Executive Summary

## Trends Analysis
| Metric | This Week | Last Week | Change | Trend |
|--------|-----------|-----------|--------|-------|
| Sessions | X | Y | ±Z% | 📈/📉 |

## Health Trends
- Which instances had downtime
- Which agents had issues

## Capacity Planning
- Current utilization vs capacity
- When to scale up/down

## Retrospective
- What went well
- What failed
- Lessons learned
```

**Report Delivery:**
- Daily: Telegram push at 09:00 (yesterday's report)
- Weekly: Telegram push Monday at 09:00 (last week)

#### Tier 3: System Health (Real-Time Dashboard)

**Health Metrics Per Instance:**
| Instance | Status | CPU | Memory | Disk | Response Time | Last Updated |
|----------|--------|-----|--------|------|---------------|--------------|
| nullclaw-kube | 🟢 Healthy | 45% | 3.2GB/16GB | 45GB/500GB | 45ms | 2s ago |

**Health Metrics Per Agent:**
| Agent | Instance | Status | State | Decisions/Hr | Last Activity |
|-------|----------|--------|-------|--------------|---------------|
| main | nullclaw-kube | 🟢 Active | idle | 0 | 1m ago |
| expert | nullclaw-kube | 🟡 Degraded | error | 0 | 15m ago |

**Service Health:**
| Service | Status | Uptime (30d) | Last Check | Details |
|---------|--------|--------------|------------|--------|
| PostgreSQL | 🟢 Healthy | 99.9% | 5s ago | Connections: 5, Query avg: 2ms |
| Qdrant | 🟢 Healthy | 99.9% | 5s ago | Collections: 1, Points: 0 |
| Redis | 🟢 Healthy | 99.9% | 5s ago | Keys: 124, Memory: 8MB |
| Gateway | 🟢 Healthy | 99.9% | 5s ago | Requests/min: 0 |
| Memory Service | 🟡 Degraded | 98.5% | 5s ago | Consolidation overdue by 12h |

**Dashboard Delivery:** HTTP endpoint at `http://nullclaw-kube:18790/health`

### Agent Roles and Expected Outcomes

| Agent | Primary Function | Triggers Automation | Expected Outcome | Success Metrics |
|-------|------------------|---------------------|------------------|-----------------|
| **main** | Orchestration & Conversation | Human input, new task | Route to correct sub-agent, respond appropriately | Tasks completed, human satisfaction |
| **expert** | Deep Research & Synthesis | Complex queries, market signals | Thorough analysis, actionable insights | Research depth, actionability score |
| **synthesizer** | GTM Content Generation | Daily schedule, insights collected | Compelling messaging, optimized positioning | Content quality, engagement metrics |
| **engineer** | Code & Infrastructure | Deployment requests, issues | Working code, stable systems | Code quality, uptime |
| **simulator** | Scenario Testing | Experiment triggers | Predictions, risk analysis | Prediction accuracy |

### Decision Traceability Schema

```typescript
interface DecisionTrace {
  decision_id: string;
  session_id: string;
  agent_id: string;
  timestamp: string;
  decision_type: 'tool_use' | 'route' | 'memory_retrieval' | 'response';
  context: {
    input: string;
    state: object;
    tools_available: string[];
    considered_options: string[];
  };
  logic: {
    llm_reasoning: string;
    confidence: number;
    model: string;
  };
  action: {
    tool: string;
    parameters: object;
    execution_time_ms: number;
  };
  outcome: {
    result: 'success' | 'failure' | 'partial';
    output: any;
    side_effects: string[];
    errors: any[];
  };
  trace_url: string;
}
```

### Redis Key Patterns

**Cache Keys (L0 Layer)**
| Pattern | TTL | Purpose |
|---------|-----|---------|
| `cache:instance:{id}:status` | 30s | Instance status (healthy, degraded, offline) |
| `cache:agent:{instance}:{agent}:state` | 30s | Agent current state |
| `cache:health:{service}` | 60s | Service health status |
| `cache:metrics:{instance}:{metric}` | 60s | Cached metrics (CPU, memory) |

**Pub/Sub Channels**
| Pattern | Events | Subscribers |
|---------|--------|-------------|
| `events:alerts` | New alerts created | Alert service, Dashboard |
| `events:health` | Health check status changes | Dashboard, Monitoring |
| `events:*` | Broadcast channel for all events | All services |

**Queues**
| Pattern | Use | Processing |
|---------|-----|------------|
| `queue:consolidation:l1_l2` | L1→L2 consolidation jobs | Consolidation service |
| `queue:consolidation:l2_l3` | L2→L3 consolidation jobs | Consolidation service |
| `queue:alerts:process` | Alert processing, routing | Alert service |

**Session State**
| Pattern | TTL | Purpose |
|---------|-----|---------|
| `session:{id}:context` | 1h | Conversation context |
| `session:{id}:decisions` | 1h | Decision chain for session |

### Database Schema

```sql
-- Instance and Agent Registry
CREATE TABLE instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    environment TEXT,
    endpoint TEXT,
    status TEXT DEFAULT 'unknown',
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    instance_id TEXT REFERENCES instances(id),
    name TEXT,
    role TEXT,
    workspace_path TEXT,
    status TEXT DEFAULT 'idle',
    last_activity TIMESTAMP
);

-- Event and Decision Logging
CREATE TABLE events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id TEXT REFERENCES instances(id),
    agent_id TEXT REFERENCES agents(id),
    event_type TEXT NOT NULL,
    category TEXT,
    severity TEXT DEFAULT 'info',
    title TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE decisions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id TEXT REFERENCES instances(id),
    agent_id TEXT REFERENCES agents(id),
    event_id TEXT REFERENCES events(id),
    decision_type TEXT NOT NULL,
    decision_context JSONB,
    decision_logic TEXT,
    decision_outcome JSONB,
    result TEXT,
    confidence REAL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Memory Layers
CREATE TABLE memories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agent_id TEXT REFERENCES agents(id),
    layer TEXT NOT NULL,
    key TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    importance_score REAL DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System Health and Alerts
CREATE TABLE health_checks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id TEXT REFERENCES instances(id),
    service TEXT NOT NULL,
    status TEXT NOT NULL,
    checked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alerts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id TEXT REFERENCES instances(id),
    severity TEXT NOT NULL,
    category TEXT,
    title TEXT NOT NULL,
    description TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Periodic Reports
CREATE TABLE daily_reports (
    report_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    summary TEXT,
    metrics JSONB,
    generated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Strategy

### Phase 1: Foundation (This Week)
1. Create database schema on local Postgres (Pi)
2. Build `event-logger` service
3. Connect existing agents to event logger
4. Implement basic alerting (telegram push)

**Deliverables:**
- Database schema created
- Event logger service running
- Agents wire up to event logger
- Telegram alerts working for critical events

### Phase 2: Observability (Week 2)
1. Build health check service
2. Create daily report generator
3. Build HTTP dashboard
4. Add decision tracing to all agents

**Deliverables:**
- Health checks running every 30s
- Daily reports generating via cron
- Dashboard accessible via HTTP
- All decisions logged with trace IDs

### Phase 3: Automation (Week 3)
1. Implement consolidation pipeline
2. Build memory lifecycle management
3. Add automated remediation (restart agents on crash)
4. Implement predictive alerts (warn before crash)

**Deliverables:**
- L1→L2 consolidation running every 10s
- L2→L3 consolidation running hourly
- Agent auto-restart on crash
- Predictive alerts based on patterns

### Phase 4: Intelligence (Week 4)
1. Add anomaly detection
2. Build predictive capacity planning
3. Implement cost optimization
4. Add trend analysis

**Deliverables:**
- Anomaly detection running
- Capacity reports with projections
- Cost optimization recommendations
- Trend analysis insights

---

## Dependencies

### Fleet Infrastructure
- **Vigil on Pi**: Raspberry Pi fleet master with aieos-mcp server
- **aieos-mcp**: 13 tools for fleet orchestration, monitoring, control, memory, approvals
- **Tailscale**: Private network for fleet-wide communication
- **Neon**: Fleet-state backup (30-day retention, instant restore)

### Storage & Memory
- PostgreSQL 16+ (central storage on Vigil)
- Qdrant (central vector DB on Vigil)
- Redis (central cache/sync on Vigil)

### Services & Integration
- Telegram bot token for alerts
- Tailscale for network access
- Docker Compose for orchestration

## Success Definition

| Metric | Target |
|--------|--------|
| Alert delivery time | < 30 seconds |
| Decision trace completeness | > 95% of agent decisions |
| Report generation time | < 30 seconds |
| Dashboard refresh rate | Every 30 seconds |
| System uptime | > 99.5% |

---

## Notes

### Architecture Decisions
- **Central Storage**: PostgreSQL, Qdrant, Redis on Vigil Pi (fleet-wide access via Tailscale)
- **Neon Backup**: Fleet-state redundancy only (30-day retention, instant restore)
- **Memory Hierarchy**: 5 layers (L1→L5) for efficient storage and retrieval
- **Infrastructure Layer**: Redis for caching, pub/sub, and queues—not a storage layer
- **Communication**: 3-tier (alerts, reports, health) centralized via Vigil
- **Event Logging**: Dual mode (local + async sync to Vigil central storage)

### Integration Points
- **Vigil on Pi**: Fleet master with aieos-mcp server, central storage (PostgreSQL, Qdrant, Redis)
- **nullclaw-kube**: Worker instance with agents (main, expert, synthesizer, engineer, simulator)
- **aieos-mcp**: MCP server for fleet orchestration, monitoring, control, memory, approvals
- **Neon**: Fleet-state backup (30-day retention, instant restore)

### Key Principles
- **Traceability**: All decisions logged with trace URLs
- **Observability**: Real-time health + periodic reports
- **Reactive Automation**: Alerts trigger auto-remediation when appropriate
- **Incremental Implementation**: Phase 1→4 build foundation first, intelligence later
