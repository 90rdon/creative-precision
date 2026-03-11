# Implementation Plan: NullClaw Fleet Architecture

## Phase 1: Foundation (Vigil Central Storage)

### 1.1 Database Setup (Vigil Pi)

**Tasks:**
1. Run fleet schema on Vigil's PostgreSQL
   ```bash
   # Via docker exec on Vigil
   docker exec -it vigils_postgres_1 psql -U postgres -d postgres -f /tmp/fleet_schema.sql
   ```

2. Register nullclaw-kube in instances table
   ```sql
   INSERT INTO instances (id, name, environment, endpoint)
   VALUES ('nullclaw-kube', 'nullclaw-kube', 'kubernetes', 'http://nullclaw-kube:18791');
   ```

3. Register nullclaw-kube agents
   ```sql
   INSERT INTO agents (id, instance_id, name, role) VALUES
     ('nullclaw-kube_main', 'nullclaw-kube', 'main', 'orchestrator'),
     ('nullclaw-kube_expert', 'nullclaw-kube', 'expert', 'assessment'),
     ('nullclaw-kube_synthesizer', 'nullclaw-kube', 'synthesizer', 'analysis'),
     ('nullclaw-kube_engineer', 'nullclaw-kube', 'engineer', 'optimization'),
     ('nullclaw-kube_simulator', 'nullclaw-kube', 'simulator', 'testing');
   ```

**Deliverable:** Central storage with fleet tables ready.

---

### 1.2 Event Logger Service (Vigil Pi)

**Tasks:**
1. Create FastAPI/Express service
2. Implement endpoints:
   - POST /api/v1/events
   - POST /api/v1/decisions
   - POST /api/v1/health/check
   - POST /api/v1/alerts
   - GET /api/v1/health
3. Add PostgreSQL connection pooling (pg/pg-pool)
4. Add Redis pub/sub integration
5. Containerize with Docker
6. Deploy to Vigil Pi

**Deliverable:** Running event-logger service on Vigil.

---

### 1.3 aieos-mcp Fleet Integration

**Tasks:**
1. Add MCP tools to aieos-mcp:
   - `log_event`
   - `log_decision`
   - `report_health`
   - `create_alert`
   - `get_fleet_health`
   - `list_instance_events`
   - `list_instance_decisions`
2. Update aieos-mcp store to call event-logger endpoints
3. Add local event buffer (SQLite) for offline support
4. Test on nullclaw-kube

**Deliverable:** aieos-mcp can log events/decisions to Vigil.

---

### 1.4 Telegram Alerting (Vigil Pi)

**Tasks:**
1. Create Telegram bot service
2. Subscribe to Redis `events:alerts` channel
3. Critical severity → immediate push
4. Warning severity → batch every 15 min
5. Deploy to Vigil Pi

**Deliverable:** Telegram alerts working for fleet events.

---

## Phase 2: Observability (nullclaw-kube + Vigil)

### 2.1 Health Check Service

**Tasks:**
1. Create cron job on nullclaw-kube: `/usr/local/bin/health-report.sh`
2. Report status every 30s to Vigil
3. Include: CPU, memory, disk, response time

**Deliverable:** Fleet health data flowing to Vigil.

---

### 2.2 Daily Report Generator

**Tasks:**
1. Create daily report service on Vigil
2. Cron job: 09:00 daily
3. Query events table for last 24h
4. Generate markdown report
5. Push to Telegram

**Deliverable:** Daily reports via Telegram.

---

### 2.3 HTTP Dashboard

**Tasks:**
1. Create health dashboard service on Vigil
2. HTTP endpoint: `http://vigil:18890/health`
3. Views:
   - Fleet instances overview
   - Agent status per instance
   - Service health per instance
   - Unresolved alerts list

**Deliverable:** Real-time health dashboard.

---

### 2.4 Decision Tracing

**Tasks:**
1. Update all nullclaw-kube agents to log decisions
2. Call `log_decision` MCP tool after each action
3. Include: context, reasoning, action, outcome
4. Generate trace URL for each decision

**Deliverable:** >95% of decisions logged with trace IDs.

---

## Phase 3: Automation

### 3.1 Agent Autostart (nullclaw-kube)

**Tasks:**
1. Create systemd services for each agent:
   - nullclaw-agent-main.service
   - nullclaw-agent-expert.service
   - nullclaw-agent-synthesizer.service
   - nullclaw-agent-engineer.service
   - nullclaw-agent-simulator.service
2. Set auto-restart on failure
3. Report status on start/stop to Vigil

**Deliverable:** Agents auto-restart on crash.

---

### 3.2 Agent Schedule Enforcement

**Tasks:**
1. On nullclaw-kube, register cron jobs via Main agent:
   ```bash
   # Agent system.md jobs
   synthesizer-morning    0 7 * * *
   synthesizer-evening    0 19 * * *
   simulator-0600        0 6 * * *
   simulator-1200        0 12 * * *
   simulator-1800        0 18 * * *
   simulator-0000        0 0 * * *
   engineer-daily        30 7 * * *
   ```
2. Each job sends heartbeat to agent
3. Report completion to Vigil

**Deliverable:** Scheduled jobs running autonomously.

---

### 3.3 Predictive Alerts

**Tasks:**
1. Analyze event patterns on Vigil
2. Detect trends: error rate spikes, latency increases
3. Alert before crash if >3x baseline sustained 5 min

**Deliverable:** Proactive alerts for issues.

---

## Phase 4: Intelligence

### 4.1 Anomaly Detection

**Tasks:**
1. Build anomaly detection service on Vigil
2. Models: error rate, latency, resource usage
3. Flag unusual patterns

**Deliverable:** Anomalies detected and flagged.

---

### 4.2 Capacity Planning

**Tasks:**
1. Track resource usage per instance
2. Predict when scaling needed
3. Suggest horizontal scaling (add instances)

**Deliverable:** Capacity reports with projections.

---

### 4.3 Cost Optimization

**Tasks:**
1. Track LLM token usage per agent
2. Calculate cost per decision
3. Suggest optimization for expensive patterns

**Deliverable:** Cost optimization recommendations.

---

### 4.4 Trend Analysis

**Tasks:**
1. Extract trends from events/decisions
2. Weekly synthesis
3. Identify patterns to improve system

**Deliverable:** Trend analysis insights.

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Alert delivery time | < 30s | Telegram timestamp - alert created_at |
| Decision trace completeness | > 95% | Count decisions / total agent actions |
| Report generation time | < 30s | Report generated_at - cron trigger |
| Dashboard refresh rate | Every 30s | Health check API response time |
| System uptime | > 99.5% | Instance status from Vigil |

---

## Deployment Order

1. **Vigil setup** (Week 1):
   - Database schema
   - Event logger service
   - aieos-mcp updates
   - Telegram bot

2. **nullclaw-kube integration** (Week 1):
   - Connect to Vigil via Tailscale
   - Register instance via aieos-mcp
   - Start reporting events/health

3. **Observability** (Week 2):
   - Health check cron job
   - Daily report generator
   - HTTP dashboard
   - Decision tracing

4. **Automation** (Week 3):
   - Agent systemd services
   - Schedule enforcement
   - Predictive alerts

5. **Intelligence** (Week 4):
   - Anomaly detection
   - Capacity planning
   - Cost optimization
   - Trend analysis
