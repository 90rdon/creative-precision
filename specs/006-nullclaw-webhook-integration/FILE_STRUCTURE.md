# Spec 006 — File Structure Summary

## Canonical Location

**Source of Truth**: `/Users/9_0rdon/creative-precision/website/src/backend/nullclaw/`

All agent configurations, tools, and workspaces live here. The k8s pod mounts this to `/nullclaw-data`.

## Directory Layout

```
website/src/backend/nullclaw/
│
├── config.json                      # Main config, agents.list[] registration
│
├── agents/                          # All agent configurations
│   ├── expert/
│   │   └── agent/
│   │       ├── agent.json            # Heartbeat: none
│   │       ├── system.md             # Operating instructions
│   │       └── identity.json         # Persona: Quiet Expert (NEW)
│   │
│   ├── simulator/
│   │   └── agent/
│   │       ├── agent.json            # Heartbeat: 6h
│   │       ├── system.md             # 7-step autonomous cycle (UPDATED paths)
│   │       └── identity.json         # Persona: Red Team (NEW)
│   │   └── tools/
│   │       └── simulator_tools.ts    # Real implementation (UPDATED paths)
│   │
│   ├── synthesizer/
│   │   └── agent/
│   │       ├── agent.json            # Heartbeat: 12h
│   │       ├── system.md             # Intelligence gathering
│   │       └── identity.json         # Persona: Analyst (NEW)
│   │   └── tools/
│   │       └── gtm_tools.ts          # NEW: fetch-sessions, insights, etc.
│   │
│   ├── engineer/
│   │   └── agent/
│   │       ├── agent.json            # Heartbeat: 24h
│   │       ├── system.md             # 2-tier change management
│   │       └── identity.json         # Persona: Optimization engine (NEW)
│   │   └── tools/
│   │       └── engineer_tools.ts     # NEW: propose-change, write-report
│   │
│   └── main/
│       ├── agent/
│       │   ├── agent.json            # Heartbeat: 24h
│       │   ├── system.md             # Orchestrator instructions (UPDATED paths)
│       │   ├── identity.json         # Persona: Coordinator (NEW)
│       │   └── models.json
│       └── sessions/                # Main agent sessions
│
├── workspace-expert/                 # Expert-specific workspace
│   ├── SOUL.md                       # Core persona (immutable)
│   ├── IDENTITY.md                   # Market context, conversational arc
│   ├── AGENTS.md                     # Prime directives
│   ├── HEARTBEAT.md                  # No tasks (respond-only)
│   ├── USER.md                       # Target audience definition
│
├── workspace-simulator/              # Simulator reports
│   └── SIMULATOR_REPORT.md           # Heartbeat output
│
├── workspace-synthesizer/           # Synthesizer reports
│   └── SYNTHESIZER_REPORT.md        # Heartbeat output
│
├── workspace-engineer/              # Engineer reports and proposals
│   ├── ENGINEER_REPORT.md            # Heartbeat output
│   └── PROPOSED_TIER1_*.md          # Staged changes (admin approval)
│
├── webhook-router/                   # Optional router service
│   └── src/
│       └── index.ts                 # Webhook routing logic
│
└── agents/                          # (Deprecated path - kept for compatibility)
    └── ... (links to the actual agents above)
```

## Runtime Paths (in nullclaw-kube pod)

The k8s pod mounts `website/src/backend/nullclaw/` → `/nullclaw-data`. Inside the pod:

|Canonical Path|Runtime Path|Purpose|
|---------------|--------------|---------|
|`website/src/backend/nullclaw/`|`/nullclaw-data/`|Base directory|
|`agents/{agent}/agent/agent.json`|`/nullclaw-data/agents/{agent}/agent/`|Heartbeat config|
|`agents/{agent}/agent/system.md`|`/nullclaw-data/agents/{agent}/agent/`|Operating instructions|
|`agents/{agent}/agent/identity.json`|`/nullclaw-data/agents/{agent}/agent/`|Persona metadata|
|`agents/{agent}/tools/*.ts`|`/nullclaw-data/agents/{agent}/tools/`|Agent tools|
|`scripts/simulator/simulator-runner.ts`|`/nullclaw-data/scripts/simulator/`|CLI simulator main|
|`scripts/simulator/tools/create-persona.ts`|`/nullclaw-data/scripts/simulator/tools/`|Persona synthesis|
|`workspace-{agent}/`|`/nullclaw-data/workspace-{agent}/`|Agent workspace|

## Agent Personas Summary

| Agent | Role | Heartbeat | Tools | Output |
|-------|------|-----------|-------|--------|
| **Expert** | Quiet Expert - Frontline Assessment | None | — | Responds to humans |
| **Simulator** | Red Team - Adversarial Testing | 6h | simulator_tools.ts | SIMULATOR_REPORT.md |
| **Synthesizer** | Intelligence Analyst - Pattern Detection | 12h | gtm_tools.ts | SYNTHESIZER_REPORT.md |
| **Engineer** | Optimization Engine - Change Management | 24h | engineer_tools.ts | ENGINEER_REPORT.md |
| **Main** | Orchestrator - Health Monitor | 24h | — | DAILY_INTELLIGENCE_REPORT |

## Tool Exports Summary

### simulator_tools.ts
```typescript
- runSimulation()      // Run simulation via CLI
- scoreTurn()          // Score expert response
- getLearningState()   // Fetch from Postgres
- updateLearningState()// Update weakness_vector
- storeDynamicPersona()// Insert into DB
- logSimulatorJob()    // Record results
- createPersona()      // LLM persona synthesis
```

### gtm_tools.ts
```typescript
- fetchSessions(hours)       // Get assessment events
- fetchInsights(hours)       // Get executive insights
- fetchSimulatorJobs(hours) // Get simulation results
- logMarketSignal()         // Store external intel
- writeReport(content)      // Output to workspace
- updateIntelligenceCycle() // Log synthesis summary
- getDropOffPatterns(hours)  // Analyze drop-off rates
- fetchLearningState()      // Get learning state
```

### engineer_tools.ts
```typescript
- proposeChange(options)  // Tier 1 (stage) or Tier 2 (apply)
- logChange()            // Record in DB
- writeReport(report)     // Output ENGINEER_REPORT.md
- readWorkspaceFile()     // Read config/docs
- getSimulatorResults()  // Fetch recent runs
```

## Changes Made (2026-03-10)

### Created Files
- `agents/expert/agent/identity.json` — Expert persona metadata
- `agents/simulator/agent/identity.json` — Simulator persona metadata
- `agents/synthesizer/agent/identity.json` — Synthesizer persona metadata
- `agents/engineer/agent/identity.json` — Engineer persona metadata
- `agents/main/agent/identity.json` — Main agent persona metadata
- `agents/synthesizer/tools/gtm_tools.ts` — Synthesizer toolkit
- `agents/engineer/tools/engineer_tools.ts` — Engineer toolkit

### Updated Files
- `agents/simulator/tools/simulator_tools.ts` — Rewired with real implementation
- `agents/simulator/agent/system.md` — Updated paths to `/nullclaw-data/`
- `agents/main/agent/system.md` — Updated paths to `/nullclaw-data/`
- `specs/006-nullclaw-webhook-integration/MASTER_STATUS.md` — Updated status

### Removed Files
- `agents/adopter/` — Empty directory removed (functionality split)
- `nullclaw_data` symlink — Removed (canonical is `website/src/backend/nullclaw/`)

### K8s Updates
- `k8s/nullclaw-kube.yaml` — Updated hostPath to canonical location

## Identity.json Format

All `identity.json` files follow this schema:

```json
{
  "name": "Agent Name",
  "role": "One-line description of purpose",
  "psychological_profiling": {
    "behavioral_traits": [...],
    "conflict_resolution": [...],
    "ethical_boundaries": [...]
  },
  "linguistic_constraints": {
    "vocabulary": [...],
    "tone": [...],
    "forbidden_phrasings": [...]
  },
  "motivations": [...],
  "formatting_rules": "...",
  "systemic_dna": "..."
}
```

This format matches the nullclaw-atlas identity.json structure while maintaining compatibility with the existing `{agent.json + system.md}` pattern in nullclaw-kube.
