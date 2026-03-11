# Spec 006 — Master Status & Gap Analysis
# Last Updated: 2026-03-10

---

## The Vision (North Star)

nullclaw-kube is the central brain for ALL AI activity in the Creative Precision system.
Three agents. One flywheel. Self-improving.

```
HUMAN EXECUTIVE
    |
    | (assessment chat via proxy-server /webhook)
    v
EXPERT AGENT (nullclaw-kube)
  — Quiet Expert persona (SOUL.md = immutable)
  — Talks to real CEOs, CTOs, VPs
  — Diagnoses AI friction, delivers unhinged value
  — Never pitches. Never prescribes.
    |
    | (same /webhook endpoint, synthetic personas)
    v
SIMULATOR AGENT (nullclaw-kube)
  — Adversarial red-team
  — Synthesizes dynamic executive personas from learning state
  — Fires them at the Expert every 6 hours autonomously
  — Scores each turn against Quiet Expert criteria
  — Finds weaknesses before real executives do
    |
    | (logs scores, flags, transcripts to Postgres)
    v
SYNTHESIZER AGENT (nullclaw-kube)
  — Pulls telemetry and insights from Postgres
  — Identifies friction points and patterns
  — Every 12h: generates intelligence reports
  — Outputs to Engineer for action
    |
    | (reads patterns, proposes changes)
    v
ENGINEER AGENT (nullclaw-kube)
  — Reads Synthesizer reports and Simulator failures
  — Proposes changes: Tier 1 (SOUL.md, major) or Tier 2 (tweaks, auto-apply)
  — Tier 1 stages for admin approval
  — Tier 2 applies immediately with revert tracking
    |
    +---> LOOP REPEATS FOREVER
```

**Key principle:** Proxy-server is transport only. All thinking, routing, persona management,
learning, and adaptation happen inside nullclaw-kube.

---

## Current State — What's Actually Built

### Transport Layer (Proxy Server) — COMPLETE

| File | Status | Notes |
|------|--------|-------|
| `proxy-server/src/api/nullclaw/client.ts` | Done | Calls `/webhook` on nullclaw-kube, not Gemini directly |
| `proxy-server/src/socket/chat.ts` | Done | Bridges frontend socket to NullClawClient |
| `proxy-server/src/db/index.ts` | Done | Postgres pool connected (migrated from Supabase) |
| `proxy-server/src/services/sessionService.ts` | Done | Archives sessions to Postgres |

### Expert Agent Workspace (nullclaw-kube) — COMPLETE

| File | Status | Notes |
|------|--------|-------|
| `workspace-expert/SOUL.md` | Done | Immutable Quiet Expert core |
| `workspace-expert/IDENTITY.md` | Done | Active config, market context |
| `workspace-expert/AGENTS.md` | Done | Updated to Postgres (Supabase refs removed) |
| `workspace-expert/HEARTBEAT.md` | Done | Expert has no heartbeat (respond-only) |
| `agents/expert/agent/agent.json` | Done | Heartbeat: none |
| `agents/expert/agent/system.md` | Done | Operating instructions |
| `agents/expert/agent/identity.json` | Done | Persona metadata format |
| Webhook Router | Built | Cannot verify if currently running |

### Simulator Agent (nullclaw-kube) — COMPLETE

| File | Status | Notes |
|------|--------|-------|
| `agents/simulator/agent/system.md` | Done | Full 7-step autonomous cycle documented |
| `agents/simulator/agent/agent.json` | Done | Heartbeat every 6h configured |
| `agents/simulator/agent/identity.json` | Done | Persona metadata (adversarial traits) |
| `agents/simulator/tools/simulator_tools.ts` | **WIRED** | Real implementation, calls CLI simulator |

### Synthesizer Agent (nullclaw-kube) — COMPLETE

| File | Status | Notes |
|------|--------|-------|
| `agents/synthesizer/agent/system.md` | Done | Intelligence gathering loop defined |
| `agents/synthesizer/agent/agent.json` | Done | Heartbeat every 12h configured |
| `agents/synthesizer/agent/identity.json` | Done | Persona metadata (analyst traits) |
| `agents/synthesizer/tools/gtm_tools.ts` | **NEW** | fetch-sessions, fetch-insights, log-market-signal |

### Engineer Agent (nullclaw-kube) — COMPLETE

| File | Status | Notes |
|------|--------|-------|
| `agents/engineer/agent/system.md` | Done | 2-tier change management defined |
| `agents/engineer/agent/agent.json` | Done | Heartbeat every 24h configured |
| `agents/engineer/agent/identity.json` | Done | Persona metadata (optimization traits) |
| `agents/engineer/tools/engineer_tools.ts` | **NEW** | propose-change, log-change, write-report |

### CLI Simulator (scripts/simulator/) — LARGELY COMPLETE

| File | Status | Notes |
|------|--------|-------|
| `simulator-runner.ts` | Done | Calls `/webhook`, drives multi-turn conversations |
| `icp-personas.ts` | Done | 9 static ICP personas across 3 ICPs |
| `scoring-rubric.ts` | Done | Per-turn scoring against Quiet Expert dimensions |
| `analysis.ts` | Done | Post-simulation pattern analysis, generates suggestions |
| `metrics.ts` | Done | Learning metrics dashboard |
| `daemon.ts` | Done | Continuous background execution |
| `scheduler.ts` | Done | Cron-based scheduling |
| `cli.ts` | Done | Full CLI: run, batch, daemon, schedule, analyze, suggest, insights, metrics |
| `tools/create-persona.ts` | Done | Fixed syntax error |
| `migrations/001_autonomous_learning.sql` | Done | Confirmed applied Postgres tables |

---

## Closed Gaps — Completed

### GAP 1: Autonomous Simulator Tools Not Wired Up [CLOSED 2026-03-10]

**Resolved:** `simulator_tools.ts` now has real implementation:
- `runSimulation()` calls the CLI simulator-runner
- `updateLearningState()` properly updates weakness_vector with real data
- `getLearningState()` fetches current state from Postgres
- `storeDynamicPersona()` inserts synthesized personas
- `logSimulatorJob()` records simulation results
- `createPersona()` invokes LLM synthesis

### GAP 2: `create-persona.ts` Syntax Error [CLOSED 2026-03-10]

**Resolved:** Fixed malformed template literal in `buildSynthesisPrompt`. Dynamic persona synthesis operational.

### GAP 4: Adopter Agent Doesn't Exist [CLOSED 2026-03-10]

**Resolution:** Adopter functionality split between Synthesizer and Engineer:
- **Synthesizer**: Pulls data, identifies patterns → outputs intelligence
- **Engineer**: Reads intelligence → proposes changes (Tier 1/2) → applies or stages
- Empty `adopter/` directory deleted

### GAP 5: AGENTS.md References Supabase [CLOSED 2026-03-10]

**Updated:** Postgres connection string with correct credentials.

---

## Open Gaps — Remaining Work

### GAP 1A: Engineer Tools Not Executable in Runtime

**Status:** Tools exist but need to be mounted in runtime at `/root/.nullclaw/agents/{agent}/tools/`

**K8s Issue:** Volume mounts only cover `/nullclaw-data` (workspace), not `/root/.nullclaw`

**Required:**
- Update k8s init command or volume mount to populate tool paths
- Or update agent system.md to call tools from canonical path (`/nullclaw-data/agents/...`)

---

### GAP 2: Webhook Router Verification [UNKNOWN STATE]

Cannot verify:
- Is webhook-router service running on port 18790?
- Does it correctly route `agent_id: 'expert'`?
- Does it handle `agent_id: 'simulator'`?
- Does it maintain session history?

**Action needed:** End-to-end test from assessment chat → webhook → nullclaw-kube response.

---

### GAP 3: HEARTBEAT.md is Empty [PARTIAL]

The expert agent's heartbeat is empty (correctly - respond-only). But Simulator, Synthesizer,
and Engineer have heartbeats that should log activity to workspace reports.

**Required:**
- Simulator: Write to `workspace-simulator/SIMULATOR_REPORT.md`
- Synthesizer: Write to `workspace-synthesizer/SYNTHESIZER_REPORT.md`
- Engineer: Write to `workspace-engineer/ENGINEER_REPORT.md`

---

## What to Work On Next — Sequenced

### Step 1: End-to-End Verification

1. **Test webhook path**:
   ```bash
   curl -X POST http://localhost:18790/webhook -H "Content-Type: application/json" -d '{
     "message": "test message", "session_id": "test-123", "agent_id": "expert"
   }'
   ```

2. **Verify expert agent responds** (not mock/data fallback)

3. **Check webhook-router health**:
   ```bash
   curl http://localhost:18790/health
   ```

### Step 2: Mount Tools in Runtime

**Option A**: Update k8s init command to copy:
```bash
# In nullclaw command, add:
mkdir -p /root/.nullclaw/agents
cp -r /nullclaw-data/agents/* /root/.nullclaw/agents/
```

**Option B**: Update system.md paths to canonical:
- Change from: `/root/.nullclaw/agents/simulator/tools/...`
- Change to: `/nullclaw-data/agents/simulator/tools/...`

**Recommendation**: Option B - no init container changes needed.

### Step 3: Verify Full Flywheel

1. Run one CLI simulation: `cd scripts/simulator && npx tsx cli.ts run icp1-A`

2. Verify scores logged to Postgres `simulator_jobs`

3. Verify learning_state updated

4. Check Synthesizer heartbeat pulls the data (12h wait or manual trigger)

5. Check Engineer heartbeat proposes changes (24h wait or manual trigger)

---

## Architecture Reference

```
Frontend (Assessment UI)
    | POST /api/assessment/message (WebSocket)
    v
Proxy Server (transport only, port 3000)
    | POST /webhook {message, session_id, request_id, agent_id: 'expert'}
    v
nullclaw-kube (port 18790)
    |
    +-- Config Files
    |   config.json                 # Main config, agents.list[] registration
    |   agents/{id}/agent.json      # Heartbeat config
    |   agents/{id}/system.md       # Operating instructions
    |   agents/{id}/identity.json   # Persona metadata (traits, constraints)
    |
    +-- Webhook Router
    |   Routes on agent_id:
    |   'expert'       -> Expert Agent (SOUL.md + IDENTITY.md)
    |   'simulator'    -> Simulator Agent (system.md)
    |
    +-- Expert Agent (heartbeat: none)
    |   Responds to human assessments
    |   Session history maintained per session_id
    |
    +-- Simulator Agent (heartbeat: 6h)
    |   Reads learning_state from Postgres
    |   Calls create-persona -> generates dynamic persona
    |   Calls simulator-runner -> drives conversation vs Expert
    |   Scores turns against Quiet Expert criteria
    |   Updates learning_state in Postgres
    |   Logs to simulator_jobs, dynamic_personas
    |
    +-- Synthesizer Agent (heartbeat: 12h)
    |   Pulls telemetry from Postgres (sessions, events)
    |   Pulls insights from Postgres (executive_insights)
    |   Identifies drop-off patterns, recurring themes
    |   Outputs SYNTHESIZER_REPORT.md
    |
    +-- Engineer Agent (heartbeat: 24h)
    |   Reads SYNTHESIZER_REPORT.md
    |   Reads simulator failure patterns
    |   Proposes changes: Tier 1 (staged) or Tier 2 (auto-apply)
    |   Writes ENGINEER_REPORT.md
    |   Tier 1 proposals to PROPOSED_TIER1_YYYY-MM-DD.md
    |
    v
Postgres (100.85.130.20:5432/nullclaw)
    Tables:
    - assessment_sessions             (real + simulated transcripts)
    - assessment_events               (telemetry, simulation events)
    - executive_insights              (synthesis output per session)
    - simulator_jobs                  (one row per simulation, scores)
    - learning_state                  (weakness_vector, iteration_count)
    - dynamic_personas                (LLM-synthesized personas)
    - market_signals                  (external intel, optional)
```

---

## Open Decisions

| Decision | Options | Impact |
|----------|---------|--------|
| Tool runtime path | `/root/.nullclaw/agents/` vs canonical | Need either k8s init or path updates |
| Engineer approval gate | File in workspace / Telegram | How admin approves Tier 1 |
| SOUL.md mutability | Engineer only proposes, never applies | Immutable by design |

---

## Files at a Glance

```
specs/006-nullclaw-webhook-integration/
  spec.md                         Original spec
  output.md                       Phase completion log
  MASTER_STATUS.md                This document

scripts/simulator/                CLI Simulator
  cli.ts                          Entry point
  simulator-runner.ts             Core engine, calls /webhook
  icp-personas.ts                 9 static personas
  scoring-rubric.ts               Per-turn scoring
  analysis.ts                     Pattern analysis
  metrics.ts                      Dashboard
  tools/create-persona.ts         LLM persona synthesis

website/src/backend/nullclaw/    Canonic Location
  agents/expert/agent/
    agent.json                    Heartbeat: none
    system.md                     Operating instructions
    identity.json                 Persona: Quiet Expert

  agents/simulator/agent/
    agent.json                    Heartbeat: 6h
    system.md                     7-step autonomous cycle
    identity.json                 Persona: Red Team
    tools/simulator_tools.ts       Real implementation

  agents/synthesizer/agent/
    agent.json                    Heartbeat: 12h
    system.md                     Intelligence gathering
    identity.json                 Persona: Analyst
    tools/gtm_tools.ts            NEW: fetch-sessions, fetch-insights

  agents/engineer/agent/
    agent.json                    Heartbeat: 24h
    system.md                     2-tier change mgmt
    identity.json                 Persona: Optimization
    tools/engineer_tools.ts       NEW: propose-change, write-report

  workspace-expert/               Expert workspace
    SOUL.md                       Core persona (immutable)
    IDENTITY.md                   Market context
    AGENTS.md                     Prime directives
    HEARTBEAT.md                  No tasks (respond-only)
    USER.md                       Target audience

  workspace-simulator/            Simulator workspace
    SIMULATOR_REPORT.md           Output from heartbeat runs

  workspace-synthesizer/          Synthesizer workspace
    SYNTHESIZER_REPORT.md         Output from heartbeat runs

  workspace-engineer/            Engineer workspace
    ENGINEER_REPORT.md            Output from heartbeat runs
    PROPOSED_TIER1_*.md           Staged changes (admin approval)

website/src/backend/proxy-server/
  src/api/nullclaw/client.ts      NullClawClient - calls /webhook
  src/socket/chat.ts              Socket bridge
  src/db/index.ts                 Postgres pool
  src/sessionService.ts           Archives sessions
```

---

## Implementation Notes

### Option B Format: Current + Identity.json Supplementary

**Three files per agent — complementary purposes:**

| File | Purpose |
|------|---------|
| `agent.json` | Heartbeat config (when agent runs autonomously) |
| `system.md` | Operating instructions (what agent does, how) |
| `identity.json` | Persona definition (traits, constraints, vocabulary) |

**Changes completed 2026-03-10:**
- ✅ Added `identity.json` to Expert, Simulator, Synthesizer, Engineer
- ✅ Created `simulator_tools.ts` with full implementation
- ✅ Created `gtm_tools.ts` for Synthesizer
- ✅ Created `engineer_tools.ts` for Engineer
- ✅ Deleted empty `adopter/` directory
- ✅ Removed `nullclaw_data` symlink (canonical is `website/src/backend/nullclaw/`)

**Still needed:**
- Tool runtime mounting in k8s (init command or volume mount)
- End-to-end webhook verification
