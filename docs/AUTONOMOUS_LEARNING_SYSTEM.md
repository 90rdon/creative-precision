# Autonomous Learning System — Documentation

## Overview

The Simulator Agent now dynamically synthesizes adversarial executive personas based on learning state, replacing fixed persona rotation with continuous self-improvement.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          nullclaw-kube Scheduler                           │
│                         (native cron: every 6h)                            │
└──────────────────────────────┬─────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Simulator Agent                                   │
│                                                                            │
│  1. Load learning_state from Postgres                                     │
│  2. Call persona generation tool → LLM synthesizes new adversary           │
│  3. Store to dynamic_personas                                             │
│  4. Execute simulation conversation                                         │
│  5. Score against Quiet Expert criteria                                    │
│  6. Update learning_state (weakness_vector, iteration_count, next_focus) │
│  7. Log results → Engineer Agent                                           │
│                                                                            │
└──────────────────────────────┬─────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            Postgres (Vigil Pi)                             │
│  learning_state                                                             │
│  ├── weakness_vector (dim → score)                                        │
│  ├── tested_scenarios (persona_ids used)                                   │
│  ├── next_probe_focus (what to test next)                                 │
│  └── iteration_count                                                      │
│                                                                            │
│  dynamic_personas (LLM-synthesized)                                        │
│  ├── persona_prompt (full system prompt)                                   │
│  ├── attack_vector                                                       │
│  └── synthesis_context                                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### learning_state Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| weakness_vector | JSONB | Dimension scores (e.g. `{"authenticity": 4.2, "relatability": 3.8}`) |
| tested_scenarios | TEXT[] | Array of persona_ids already deployed |
| next_probe_focus | TEXT | What weakness to target next |
| iteration_count | INTEGER | Simulation cycles completed |
| last_simulation_date | TIMESTAMP | Most recent run |
| created_at | TIMESTAMP | Row creation |
| updated_at | TIMESTAMP | Last update |

### dynamic_personas Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| persona_id | TEXT | Unique identifier |
| persona_prompt | TEXT | Full system prompt |
| attack_vector | TEXT | What this persona tests |
| synthesis_context | TEXT | Why this persona was created |
| iteration_date | TIMESTAMP | When synthesized |
| usage_count | INTEGER | Times deployed |
| created_at | TIMESTAMP | Row creation |
| updated_at | TIMESTAMP | Last update |

## Running the Migration

```bash
# From project root
psql -h 100.85.130.20 -U nullclaw -d nullclaw -f scripts/simulator/migrations/001_autonomous_learning.sql
```

## Tool Interface

### create-persona.ts

```bash
npx tsx tools/create-persona.ts generate \
  --weakness_vector '{"authenticity":4.2,"relatability":3.8}' \
  --tested_scenarios '["sceptical_cfo","overconfident_cto"]' \
  --iteration_count 5 \
  --next_probe_focus "Test non-preachiness under pressure"
```

Returns JSON:

```json
{
  "success": true,
  "persona": {
    "persona_id": "adversarial_vp_innovation_v1",
    "name": "Sarah Chen",
    "title": "VP of Innovation",
    "company": "Streamline Health",
    "industry": "Healthcare Technology",
    "core_fear": "Board will cancel AI initiative if no ROI proof by Q3",
    "persona_prompt": "You are playing...",
    "attack_vector": "Tests whether Expert maintains authenticity under deadline pressure",
    "synthesis_context": "Created because authenticity score (4.2) is lowest dimension",
    "opening_line": "...",
    "surface_narrative": "...",
    "second_layer": "...",
    "behavior_rules": ["..."],
    "topics_creating_friction": ["..."],
    "drop_off_trigger": "...",
    "success_signal": "..."
  }
}
```

## Simulator Agent Behavior

### Autonomous Run (cron-triggered)

1. Load learning_state → get weak dimensions and what's been tested
2. Call `create-persona.ts` → LLM synthesizes new adversary
3. Store to `dynamic_personas` → persists for reference
4. Run simulation → uses `persona_prompt` to drive conversation
5. Score results → 8 criteria
6. Update `learning_state` → reflect new weaknesses
7. Log to Engineer Agent → Tier 1/2 proposals

### Manual Run (CLI)

Developers can use CLI for debugging:

```bash
cd scripts/simulator
npx tsx cli.ts run icp1-A --count 1
```

CLI uses static personas from `icp-personas.ts` for isolated testing.

## Weakness Vector Dimensions

| Dimension | What It Tests | Pass Threshold |
|-----------|---------------|----------------|
| authenticity | Sounds like peer, not consultant | ≥7.0 |
| relatability | Executive would say "yes, exactly" | ≥7.0 |
| listening | Heard 2nd layer, not surface echo | ≥7.0 |
| nonPreachiness | Zero "you should" energy | ≥7.0 |
| invitationEnergy | Ends with open question | ≥7.0 |
| paceControl | Created space, didn't rush | ≥6.0 |
| resistedSolving | No solution before synthesis | ≥7.0 |
| brandCompliance | No em dashes, banned words | ≥8.0 |

## Success Signal Detection

The system detects when a persona's success signal fires by checking ICP responses for:

1. "that's what I've been trying to say" phrase
2. "I hadn't thought about it" indicator
3. "between us" confession marker
4. "I should probably" action marker
5. "didn't realize" realization
6. "is that possible" confirmatory question

## LLM Synthesis Prompt

The persona generation tool builds prompts like:

```
Current Intelligence
- Iteration count: N
- Weakness vector: [dimensions]
- Already tested: [persona_ids]
- Next probe: "focus area"

Create NEW adversary probing untested combinations of weaknesses...
```

## File Locations

```
website/src/backend/nullclaw/
├── agents/
│   ├── simulator/agent/system.md           # Updated agent directive
│   └── tools/
│       └── create-persona.ts               # LLM synthesis tool
└── workspace/simulator/
    └── SIMULATOR_REPORT.md                 # Run log

scripts/simulator/
├── tools/
│   └── create-persona.ts                  # CLI-accessible tool
└── migrations/
    └── 001_autonomous_learning.sql       # DB migration

docs/
└── AUTONOMOUS_LEARNING_SYSTEM.md          # This file
```

## Verification Commands

```bash
# Check tables
psql -h 100.85.130.20 -U nullclaw -d nullclaw -c "\dt learning_state"
psql -h 100.85.130.20 -U nullclaw -d nullclaw -c "\dt dynamic_personas"

# Check initial state
psql -h 100.85.130.20 -U nullclaw -d nullclaw -c "SELECT * FROM learning_state"

# Check personas
psql -h 100.85.130.20 -U nullclaw -d nullclaw -c "SELECT persona_id, attack_vector FROM dynamic_personas"
```

## Next Steps

1. Run migration
2. Update simulator_tools.ts to support dynamic persona execution
3. Test first autonomous run
4. Verify learning_state updates

## Integration Points

- **Postgres**: Stores all state (Vigil Pi: 100.85.130.20)
- **OpenRouter**: LLM for persona synthesis
- **Simulator Agent**: Orchestrates autonomous runs
- **Engineer Agent**: Consumes Tier 1/2 proposals
