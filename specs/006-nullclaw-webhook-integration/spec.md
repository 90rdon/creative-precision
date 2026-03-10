# NullClaw Webhook Integration & Persona Management

## Vision

The AI assessment chat connects with the expert agent in nullclaw-kube via `/webhook`. All AI interactions, self-spawn processes, mock agents, and learning agents live inside nullclaw-kube. The simulator agent runs simulated chat interactions like a live human user to test the expert's output and documents interactions so the system can learn. nullclaw-kube is the brains behind all AI processes and thinking, with different personas available.

**Critical:** nullclaw-kube is self-contained. All expert, simulator, and learning agents run within nullclaw-kube. The proxy server is just a thin transport layer — all "thinking" happens inside nullclaw-kube.

### Core Intent

1. **Assessment Chat → Expert Agent via /webhook**: Real human users connect to the expert personality through nullclaw-kube's webhook routing
2. **Simulator → Expert via /webhook**: Simulated user personas test the expert through the same endpoint
3. **NullClaw-Kube as Central Brain**: All AI thinking and personality routing happens here
4. **Interaction Documentation**: Every interaction is logged for system learning and improvement

## Status

**Phase: Planning**

---

## Scope

### Current State (What We Have)

| Component | Has | Missing |
|-----------|-----|---------|
| Mock Gateway | `/webhook` endpoint, session storage | Hardcoded EXPERT_SYSTEM prompt, not connected to real nullclaw-kube |
| Simulator | 3 personas (Skeptical CTO, CAIO, Saboteur), Postgres logging | Uses Gemini directly, NOT calling mock-gateway/nullclaw-kube via webhook |
| NullClaw Client | Connects to nullclaw-kube:18790 | Uses `/v1/responses`, hardcoded `expert` agent ID |
| NullClaw Workspace | AGENTS.md defines Executive Diagnostician persona | Static config, no dynamic routing for multiple personalities |

### What's Missing

1. **Webhook Routing Layer in nullclaw-kube**
   - Route requests to different personas based on agentId
   - Accept `/webhook` requests with session_id and message
   - Return expert responses in standardized format
   - Persist conversation history per session

2. **Simulator Moves to nullclaw-kube**
   - Move simulator.ts from proxy-server into nullclaw-kube
   - Simulator personas spawn within nullclaw-kube
   - All simulation runs execute inside nullclaw-kube
   - Expert and simulator communicate internally via nullclaw-kube routing

3. **Persona Management**
   - AGENTS.md becomes source of truth for personas
   - Dynamic persona loading from workspace
   - Support for multiple expert personalities (diagnostician, analyst, synthesizer, etc.)

4. **System Learning Loop**
   - All analysis and learning happens inside nullclaw-kube
   - Post-game analysis identifies weak points
   - Automated prompt tuning based on simulation results
   - Learning agents spawn within nullclaw-kube

5. **End-to-End Agent Orchestration**
   - Expert agent handles all conversation logic
   - Simulator agent spawns mock personalities
   - Learning agent analyzes results and suggests improvements
   - All agents communicate internally via nullclaw-kube fabric

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (Assessment UI)                           │
│                                  (Real Human Users)                              │
└────────────────────────────┬────────────────────────────────────────────────────┘
                             │
                             │ POST /api/assessment/message
                             │
┌────────────────────────────▼────────────────────────────────────────────────────┐
│                              Proxy Server (Transport Only)                      │
│                       (website/src/backend/proxy-server)                        │
│                                                                                  │
│  Thin transport layer — no AI thinking. Just carries requests to/from nullclaw    │
└────────────────────────────┬────────────────────────────────────────────────────┘
                             │
                             │ POST /webhook
                    ┌────────▼─────────────────┐
                    │  nullclaw-kube             │
                    │  (Port 18790)             │
                    │                           │
                    │  ┌─────────────────────┐ │
                    │  │   Webhook Router    │ │
                    │  │   (Incoming → Persona││
                    │  │    Routing)          │ │
                    │  └─────────────────────┘ │
                    │                           │
                    │  ┌──────────────────────┐│
                    │  │   Expert Agent       ││
                    │  │   (Executive         ││
                    │  │    Diagnostician)    ││
                    │  └──────────────────────┘│
                    │      ↕                  │
                    │  ┌──────────────────────┐│
                    │  │   Simulator Agent    ││
                    │  │   (Spawns Mock       ││
                    │  │    User Personas)    ││
                    │  └──────────────────────┘│
                    │                           │
                    │  ┌──────────────────────┐│
                    │  │   Learning Agent     ││
                    │  │   (Analyzes,         ││
                    │  │    Generates         ││
                    │  │    Improvements)     ││
                    │  └──────────────────────┘│
                    │                           │
                    │  All agents spawn and     │
                    │  communicate internally  │
                    │  within nullclaw-kube   │
                    └───────────────────────────┘
                             │
                             │ Logs to Postgres
                    ┌────────▼─────────┐
                    │      Postgres     │
                    │  (Vigil Pi)       │
                    │                   │
                    │  simulator_jobs   │
                    │  assessment_...   │
                    │  executive_...    │
                    └───────────────────┘
```

**Key Architectural Principle:**
- **nullclaw-kube is self-contained**: Expert, simulator, learning all live inside
- **Proxy server is transport-only**: No AI thinking, just HTTP forwarding
- **Internal agent communication**: Simulator spawns mock users → interacts with expert → learning agent analyzes results → updates AGENTS.md → nullclaw-kube reloads → loop continues
                    └───────────────────┘
```

### Webhook Protocol

**Request:**
```typescript
{
  message: string,
  session_id: string,
  request_id: string,
  agent_id?: string  // Optional: expert, simulator, etc.
}
```

**Response:**
```typescript
{
  response: string,
  status: 'success' | 'error',
  error?: string
}
```

## The Continuous Learning Flywheel

**This is the core engine that makes the system meaningful.** The simulator doesn't just test once — it runs continuously or on-demand throughout the day, generating interaction data that feeds back to improve the expert.

### How the Flywheel Works

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              CONTINUOUS LEARNING FLYWHEEL                                  │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│  1. SIMULATOR RUNS (Anytime, On-Demand)                                                   │
│     ├─ Cron schedule (e.g., every 6 hours)                                                 │
│     ├─ Manual trigger ("run simulation")                                                   │
│     ├─ Event-based trigger (new personas deployed, prompts updated)                        │
│     └─ Continuous background job (N simulations per hour)                                  │
│                                                                                           │
│  2. INTERACTION DATA LOGGED                                                               │
│     ├─ Full transcripts (assessment_sessions)                                              │
│     ├─ Evaluation scores and weakness identification (simulator_jobs)                      │
│     ├─ Executive synthesis (executive_insights)                                           │
│     └─ Telemetry (time on topic, drop-off rates, friction patterns)                       │
│                                                                                           │
│  3. ANALYSIS ENGINE IDENTIFIES PATTERNS                                                   │
│     ├─ What questions cause drop-off?                                                     │
│     ├─ Where does the expert get preachy?                                                 │
│     ├─ Which personas consistently fail?                                                 │
│     ├─ What tone triggers defensiveness?                                                  │
│     └─ What conversation length yields highest engagement?                                │
│                                                                                           │
│  4. PROMPT IMPROVEMENT SUGGESTIONS GENERATED                                              │
│     ├─ "Add this follow-up question before synthesis"                                     │
│     ├─ "Rephrase this opening to be less prescriptive"                                    │
│     ├─ "Adjust tone for CAIO persona to be more empathetic"                                │
│     └─ "Simplify this section by 40%"                                                     │
│                                                                                           │
│  5. IMPROVEMENTS APPLIED                                                                 │
│     ├─ PR reviewed by human                                                               │
│     ├─ Changes merged to AGENTS.md / system prompt                                        │
│     ├─ nullclaw-kube reloaded with new config                                             │
│     └─ Next simulation tests the improvement                                             │
│                                                                                           │
│  6. LOOP REPEATS FOREVER                                                                  │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Simulator Execution Models

| Model | Triggers | Frequency | Use Case |
|-------|----------|-----------|----------|
| **On-Demand** | Manual CLI command, API trigger | As needed | Testing new personas, prompt changes |
| **Scheduled** | Cron (e.g., 0, 6, 12, 18:00 daily) | Fixed interval | Continuous dataset generation |
| **Event-Based** | New persona, prompt update, deployment | Instant | Immediate validation after changes |
| **Continuous** | Background N jobs/hour (configurable) | Always | Maximize learning data volume |

### Execution Interface

**CLI:**
```bash
# Run 5 simulations now
npx ts-node src/api/nullclaw/simulator.ts run --count 5

# Run specific persona
npx ts-node src/api/nullclaw/simulator.ts run --persona skeptical-cto

# Run continuous background job
npx ts-node src/api/nullclaw/simulator.ts daemon --rate 10-per-hour
```

**API/Webhook:**
```
POST /api/simulator/run
{
  "persona": "skeptical-cto",  // optional
  "count": 10,                 // optional
  "triggered_by": "manual"    // "manual" | "scheduled" | "event"
}
```

### What Makes This Meaningful

1. **Velocity of Learning**: With on-demand execution, you can run 100 simulations in a day, not 1 per week
2. **Experiment Safety**: Test new prompts against simulator personas before exposing to real users
3. **Pattern Recognition**: Continuous data collection reveals weaknesses that one-off tests miss
4. **Evidence-Based Improvements**: Every prompt change is backed by interaction data, not intuition
5. **Self-Healing System**: The system can suggest its own improvements, getting better over time

### Learning Metrics to Track

| Metric | Source | What It Tells You |
|--------|--------|-------------------|
| Drop-off Rate | simulator_jobs | At what point conversations fail |
| Engagement Score | assessment_events | Average turns before synthesis trigger |
| Preachiness Detection | evaluation analysis | How often expert sounds prescriptive |
| Persona Success Rate | simulator_jobs grouped by persona | Which personas consistently expose weaknesses |
| Response Time / Quality | telemetry | Speed and substance trade-offs |
| Synthesis Trigger Rate | assessment_events | How often expert reaches "ready to synthesize" |

---

## Implementation Strategy

### Phase 1: Webhook Router in nullclaw-kube (Week 1)

**Objective:** Create the webhook routing layer in nullclaw-kube

**Tasks:**
1. [ ] Create `webhook-router.ts` in nullclaw-kube
2. [ ] Load personas from AGENTS.md at startup
3. [ ] Route incoming requests to appropriate agent/persona
4. [ ] Implement `/v1/responses` and `/webhook` endpoints
5. [ ] Add session management (history per session_id)
6. [ ] Add health check endpoint

**Deliverables:**
- Webhook router service running on port 18790
- `/webhook` endpoint accepting standardized requests
- Dynamic persona loading from nullclaw workspace
- Session history persistence
- Health check at `/health`

### Phase 2: Simulator → Webhook Integration (Week 2)

**Objective:** Update simulator to call webhook instead of creating separate Gemini chats

**Tasks:**
1. [ ] Refactor `simulator.ts` to call `/webhook` endpoint
2. [ ] Remove direct Gemini chat instantiation from simulator
3. [ ] Pass simulator persona as agent_id in webhook requests
4. [ ] Ensure simulator interacts with expert same as real users
5. [ ] Verify logging to Postgres still works

**Deliverables:**
- Simulator calls `/webhook` for expert responses
- Consistent behavior between real and simulated chats
- All telemetry still logged to Postgres

### Phase 3: Update Proxy Server Integration (Week 2-3)

**Objective:** Ensure proxy server uses the new webhook routing correctly

**Tasks:**
1. [ ] Update `NullClawClient` to use `/webhook` endpoint
2. [ ] Pass expert agent_id in requests
3. [ ] Update mock-gateway to match new protocol
4. [ ] Test end-to-end with real assessment chat

**Deliverables:**
- Assessment chat → expert via `/webhook`
- Proxy server correctly routes requests
- Mock gateway compatible with new protocol

### Phase 4: System Learning Loop & On-Demand Execution (Week 3-4)

**Objective:** Build the feedback loop from interactions to prompt improvement, plus on-demand/continuous simulator execution

**Tasks:**
1. [ ] Create post-simulation analysis job
2. [ ] Identify patterns where expert failed
3. [ ] Generate prompt improvement suggestions
4. [ ] Log suggestions to workspace for review
5. [ ] Create dashboard for insights
6. [ ] Add on-demand execution CLI interface (`--count`, `--persona`)
7. [ ] Add scheduling capability (cron for fixed intervals)
8. [ ] Add event-based trigger (persona update, config change)
9. [ ] Add continuous background execution mode
10. [ ] Expose webhook for triggering simulator runs
11. [ ] Track learning metrics (drop-off rate, engagement, success rate)

**Deliverables:**
- Automated analysis of simulation results
- Prompt improvement suggestions logged
- Dashboard showing learning insights
- CLI interface for on-demand execution
- Scheduled execution capability
- Continuous background daemon mode
- Webhook endpoint for triggering simulation runs
- Learning metrics dashboard and tracking

---

## Dependencies

### Existing Infrastructure
- **nullclaw-kube**: Host for webhook router (Tailscale IP: 100.85.130.20)
- **Postgres on Vigil Pi**: Storage for interactions and telemetry
- **Proxy Server**: Already implemented for assessment chat
- **NullClaw Workspace**: AGENTS.md contains persona definitions

### Required Services
- **nullclaw-kube Webhook Router**: New service for this spec
- **Persona Loader**: Reads AGENTS.md and loads personas at runtime
- **Session Manager**: Maintains conversation history per session
- **Analysis Job**: Post-simulation pattern identification and improvement suggestion generation
- **Learning Dashboard**: View insights, metrics, and improvement suggestions
- **Schedule/Trigger Manager**: Handles cron schedules, event-based triggers, and continuous execution

---

## Success Definition

| Metric | Target |
|--------|--------|
| Webhook response time | < 2 seconds |
| Simulator → Webhook integration | 100% of simulator calls go through webhook |
| Session state persistence | 100% of sessions maintain history across requests |
| Persona loading | All personas loaded from AGENTS.md at startup |
| End-to-end test flow | Assessment chat → webhook → expert response working |
| On-demand execution | CLI and webhook triggers working |
| Scheduled execution | Cron-based simulation runs working |
| Continuous mode | N-per-hour background daemon working |
| Analysis job | Post-simulation analysis generates improvement suggestions |
| Learning metrics tracked | Drop-off rate, engagement score, persona success rate |

---

## Flywheel Readiness Checklist

- [ ] Can run simulations anytime via CLI
- [ ] Can run simulations via webhook trigger
- [ ] Can schedule simulations at fixed intervals
- [ ] Can run continuous background daemon
- [ ] Analysis job runs after each simulation
- [ ] Improvement suggestions logged to workspace
- [ ] Learning metrics tracked and displayed
- [ ] Dashboard shows actionable insights
- [ ] Prompt changes can be tested against simulator before real users

---

## Open Questions

1. **Persona Storage**: Should personas be stored in AGENTS.md, Postgres, or both?
2. **Session Persistence**: Where should session history be stored? Postgres, SQLite, or nullclaw-kube internal?
3. **Model Selection**: Should expert use same model as simulator or a different one?
4. **Learning Rate**: How frequently should prompt improvements be suggested?
5. **Simulation Frequency**: How many simulations per hour in continuous mode? Default schedule?
6. **Analysis Timing**: When to run analysis job? After each simulation, or batch daily?
7. **Improvement Approval**: How to approve and apply prompt suggestions? Fully automated or human-in-the-loop?
8. **Learning Curation**: How to organize and prioritize improvement suggestions?

---

## Notes

### Key Principles
- nullclaw-kube is the central brain for all AI processes
- Webhook routing enables flexible persona management
- Simulators test the same expert as real users
- All interactions logged for learning and improvement

### Design Decisions
- TBA based on implementation feedback

### Integration Points
- **Proxy Server**: `/api/assessment/message` → webhook
- **Simulator**: Direct webhook calls instead of separate chats
- **Postgres**: All interaction and telemetry logging
- **NullClaw Workspace**: AGENTS.md as persona source of truth
