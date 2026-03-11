# Spec 006 — Agent & Tools Testing Report

---

## Test Summary

Date: 2026-03-10

---

## Infrastructure Status

### K8s/Containers

| Component | Status | Notes |
|-----------|--------|-------|
| nullclaw-postgres | RUNNING | Docker container pgvector:pg16 on port 5432 |
| nullclaw-qdrant | RUNNING | Docker container on port 6333 |
| nullclaw-redis | RUNNING | Docker container on port 6379 |
| nullclaw-kube | UNKNOWN | Running in Lima aarch64 VM (SSH no-access) |
| webhook-router | UNKNOWN | Port 18790 responding but 404 |

### Lima Container

```
NAME      STATUS     SSH                 ARCH    CPUS    MEMORY   DISK
nullclaw    Running    127.0.0.1:51065    aarch64  2       4GiB     20GiB
```

---

## Database Tests

### Connection: SUCCESS
- Database: `postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw`
- Connection: Open on port 5432

### Tables Present: ✓ ALL TABLES EXIST

The following tables exist and are accessible:

```
public.agents                          ✓
public.alarts                          ✓
public.assessment_events             ✓
public.assessment_sessions           ✓
public.daily_reports                  ✓
public.decisions                     ✓
public.dynamic_personas              ✓
public.events                        ✓
public.executive_insights             ✓
public.gtm_experiments               ✓
public.health_checks                  ✓
public.instances                     ✓
public.learning_state                ✓
public.market_signals                 ✓
public.memories                      ✓
public.memory_embeddings             ✓
public.simulator_jobs                ✓
```

---

## Learning State: ACTIVE

Current state from database:

| Key | Value |
|-----|-------|
| ID | 4d8b255b-e4b0-4847-96f0-b508de25ddbe |
| iteration_count | 2 |
| weakness_vector | `{"listening": 5.5, "second_layer_excavation": 5.5}` |
| next_probe_focus | "Second layer excavation — expert mirrors surface without probing real concern" |
| tested_scenarios | 2 persona IDs (CAIO, Skeptical CTO) |

---

## Simulator Jobs: 2 RUNS COMPLETED

| ID | Persona Name | Status | Turns |
|----|--------------|--------|-------|
| a3ae55cb... | Skeptical CTO | completed | 3 |
| 6bc54d43... | Overwhelmed CAIO | completed | 4 |

---

## Agent Registration: 10 AGENTS ACTIVE

| ID | Name | Role | Status |
|----|------|------|--------|
| atlas_engineer | engineer | Engineer | active |
| atlas_expert | expert | Expert Analyst | active |
| atlas_main | main | System Administrator | active |
| kube_expert | expert | Expert Analyst | active |
| kube_main | main | System Administrator | active |
| vigil_engineer | engineer | Engineer | active |
| vigil_expert | expert | Expert Analyst | active |
| vigil_main | main | System Administrator | active |
| vigil_simulator | simulator | Simulator | active |
| vigil_synthesizer | synthesizer | Synthesizer | active |

---

## Tool Testing Limitations

### Cannot Test

| Tool | Limitation | Reason |
|------|------------|--------|
| `simulator_tools.ts` | Need `pg` module | Not installed in dev environment |
| `gtm_tools.ts` | Need `pg` module | Not installed in dev environment |
| `engineer_tools.ts` | Need `pg` module | Not installed in dev environment |
| CLI simulator | Node/tsx version mismatch | Host v22.18 vs tsx v0.25 |

### Would Require Runtime Testing

- All tools depend on `pg` module from npm/dependencies
- Tools can only be tested inside nullclaw-kube runtime
- Local testing requires runtime environment (Lima/container)

---

## Path Verification

### Canonical vs Runtime Paths

| Component | Canonical | Runtime (expected) | Status |
|-----------|-----------|----------------------|--------|
| Base dir | `/Users/9_0rdon/creative-precision/website/src/backend/nullclaw` | `/nullclaw-data` | Mounted ✓ |
| Agent configs | `agents/{agent}/agent/` | `/nullclaw-data/agents/{agent}/agent/` | Needs mount |
| Tools | `agents/{agent}/tools/` | `/nullclaw-data/agents/{agent}/tools/` | Needs mount |
| Scripts | `scripts/simulator/` | `/nullclaw-data/scripts/simulator/` | Needs mount |

### K8s Volume Mount

Current k8s config mounts `/nullclaw-data` but we need to verify tools are accessible.

---

## Webhook Router

### Status: PARTIAL

- Port 18790: Responding but returns HTML UI
- `/health`: Not an endpoint (404)
- `/v1/responses`: Not testable without actual gateway running

### What We Can't Test Without Running nullclaw-kube

1. **Webhook routing** — Does `/webhook` route to correct agent?
2. **Agent invocation** — Can agents be called by agent_id?
3. **Session management** — Does it maintain conversation history?
4. **Tool execution** — Can nullclaw call `npx tsx tools/...`?
5. **Heartbeat execution** — Do 6h/12h/24h cycles fire in nullclaw?

---

## What Needs Testing In Runtime

### Full End-to-End Flow Test

```
Step 1: Start Simulator Heartbeat (manual trigger)
  - Should load learning_state from Postgres
  - Should call createPersona
  - Should call runSimulation
  - Should update learning_state
  - Should log to SIMULATOR_REPORT.md

Step 2: Start Synthesizer Heartbeat (manual trigger)
  - Should pull last 12h sessions
  - Should identify drop-off patterns
  - Should produce SYNTHESIZER_REPORT.md

Step 3: Start Engineer Heartbeat (manual trigger)
  - Should read Synthesizer and Simulator reports
  - Should propose changes (Tier 1/Tier 2)
  - Should produce ENGINEER_REPORT.md

Step 4: Test Expert via Webhook
  - POST /webhook with agent_id='expert'
  - Should get Expert response
  - Should maintain session history
```

### Tool-Specific Tests

| Tool | Test Command | Expected Result |
|------|--------------|----------------|
| simulator_tools.getLearningState() | Invoke in nullclaw | Returns current learning_state |
| simulator_tools.updateLearningState() | Invoke in nullclaw | Updates weakness_vector |
| simulator_tools.createPersona() | Invoke in nullclaw | LLM generates persona |
| simulator_tools.runSimulation() | Invoke in nullclaw | Calls CLI simulator, returns results |
| gtm_tools.fetchSessions() | Invoke in nullclaw | Returns last N hours sessions |
| gtm_tools.fetchInsights() | Invoke in nullclaw | Returns executive insights |
| engineer_tools.proposeChange() | Invoke in nullclaw | Stages or applies change |

---

## What We Successfully Validated

### ✅ Database Integration
- Learning state table exists with data
- Simulator_jobs table with 2 completed runs
- All required schema tables present

### ✅ File Structure
- identity.json files for all 5 agents
- Tool implementations written
- Updated system.md paths to `/nullclaw-data/`

### ✅ Agent Registration
- 10 agents registered in DB (multiple instances: atlas, kube, vigil)
- All showing `status='active'`

### ⚠️  Partial Runtime Access
- Database accessible and queryable
- Lima instance running but SSH access limited
- Webhook endpoint responding but behavior unknown

---

## Recommendations for Full Testing

### Option A: Test Inside nullclaw-kube

1. SSH into Lima container or use k8s exec to enter nullclaw pod
2. Install dependencies (npm, tsx, pg npm module)
3. Run individual tool functions to verify Postgres queries
4. Trigger agent heartbeats manually to observe execution
5. Call webhook endpoint to test router

### Option B: Mock Test Framework

Create a mock harness locally that:
- Simulates Postgres queries with JSON responses
- Mocks tool function calls to test logic
- Provides synthetic nullclaw environment for testing

### Option C: Automated Test Suite

Create `tests/` directory with:

```
tests/
├── tools/
│   ├── test-simulator-tools.ts
│   ├── test-gtm-tools.ts
│   └── test-engineer-tools.ts
├── agents/
│   ├── test-simulator-cycle.ts
│   ├── test-synthesizer-cycle.ts
│   └── test-engineer-cycle.ts
└── integration/
    └── test-webhook-flow.ts
```

---

## Conclusion

**Current state is Ready for Runtime Testing.**

### What's Complete
- File structure (identity.json + tools)
- Database schema and data
- Path configuration updates
- Symlink cleanup

### What Requires In-Runtime Testing
- Tool execution (`npx tsx tools/...`)
- Agent heartbeat cycles
- Webhook routing
- Session persistence
- Tool-Nullclaw bridge

### Next Steps for End-to-End
1. Access nullclaw-kube runtime (SSH into Lima/Container)
2. Install/build dependencies in runtime environment
3. Trigger agent heartbeats manually one-by-one
4. Verify each produces expected output files
5. Test webhook to confirm routing works
6. Run full autonomous cycle and verify closed loop

---

## Test Execution Guide (In Runtime)

```bash
# Inside nullclaw-kube runtime:

# 1. Test Simulator tools access
cd /nullclaw-data/agents/simulator/tools
npx tsx simulator_tools.ts

# 2. Test Postgres connectivity
psql "postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw" \
  -c "SELECT * FROM learning_state LIMIT 1"

# 3. Test Agent invocation (if gateway supports manual trigger)
# Send message to agent_id='simulator' to trigger heartbeat

# 4. Verify output files
cat /nullclaw-data/workspace-simulator/SIMULATOR_REPORT.md
cat /nullclaw-data/workspace-synthesizer/SYNTHESIZER_REPORT.md
cat /nullclaw-data/workspace-engineer/ENGINEER_REPORT.md
```
