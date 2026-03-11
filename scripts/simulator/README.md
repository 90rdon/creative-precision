# Simulator Phase 4 — Learning Loop & On-Demand Execution

## Quick Start

Install dependencies (from scripts/simulator/ directory):

```bash
cd scripts/simulator
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```bash
NULLCLAW_GATEWAY_URL=https://nullclaw-cloud.tail4bf23a.ts.net
NULLCLAW_TOKEN=09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83
OPENROUTER_API_KEY=your_openrouter_api_key
DATABASE_URL=postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw
```

## CLI Commands

### Run Simulations

Run 5 simulations for a specific persona:

```bash
npx tsx cli.ts run icp1-A --count 5
```

Run for a different persona:

```bash
npx tsx cli.ts run icp2-B --count 3
```

Run with specific strategy:

```bash
npx tsx cli.ts run icp1-A --strategy adversarial --count 2
```

List all available personas:

```bash
npx tsx cli.ts personas
```

### Batch Mode

Run simulations for all personas:

```bash
npx tsx cli.ts batch
```

Run for ICP 2 personas only:

```bash
npx tsx cli.ts batch --icp 2
```

### Cron Scheduling

Schedule simulations every 6 hours:

```bash
npx tsx cli.ts schedule "0 */6 * * *"
```

Schedule for daily 9am/1pm/5pm:

```bash
npx tsx cli.ts schedule "0 9,13,17 * * *"
```

List scheduled jobs:

```bash
npx tsx cli.ts schedule --list
```

Remove a scheduled job:

```bash
npx tsx cli.ts schedule --remove <job-id>
```

### Continuous Daemon Mode

Start daemon running 10 simulations per hour:

```bash
npx tsx cli.ts daemon --rate 10-per-hour
```

Start daemon every 6 hours:

```bash
npx tsx cli.ts daemon --rate "0 */6 * * *"
```

Stop daemon:

```bash
# Note: This requires extending daemon.ts to support --stop flag
```

### Analysis & Insights

Analyze recent simulations:

```bash
npx tsx cli.ts analyze --since 24
```

Generate prompt improvement suggestions:

```bash
npx tsx cli.ts suggest --since 24
```

View learning insights:

```bash
npx tsx cli.ts insights --since 24
```

View metrics dashboard:

```bash
npx tsx cli.ts metrics --since 24
```

## Available Personas

| ID | Name | ICP |
|----|------|-----|
| icp1-A | Marcus Webb | Velocity-Trapped AI/ML Director |
| icp1-B | Priya Shenoy | Velocity-Trapped AI/ML Director |
| icp1-C | Derek Hollingsworth | Velocity-Trapped AI/ML Director |
| icp2-A | Sandra Toft | Compliance/Risk Leader |
| icp2-B | Rafael Medeiros | Compliance/Risk Leader |
| icp2-C | Constance Fairweather | Compliance/Risk Leader |
| icp3-A | James Okafor | Mid-Market CTO/COO |
| icp3-B | Yvette Larsson | Mid-Market CTO/COO |
| icp3-C | Alan Ng | Mid-Market CTO/COO |

## Simulation Strategies

- `standard` — Linear conversation
- `adversarial` — Red team pressure
- `branching` — Fork at key moment into 3 reactions
- `roi_pressure` — Push hard on ROI/timeline questions
- `silent_resistance` — Short answers, don't volunteer anything
- `jargon_wall` — Corporate speak deflection
- `trust_build` — Start cold, warm up if Expert earns it

## Learning Metrics

The system tracks these metrics automatically:

| Metric | Description | Target |
|--------|-------------|--------|
| Average composite score | Expert performance (0-10) | ≥7.0 |
| Pass rate | Sessions passing Quiet Expert criteria | ≥60% |
| Drop-out rate | Conversations ending early | ≤20% |
| Second layer rate | Found real concern | ≥60% |
| Success signal rate | Persona breakthrough | ≥50% |
| Engagement | Average turns per session | 5-6 |

## Directory Structure

```
scripts/simulator/
├── cli.ts              # Main CLI entry point
├── simulator-runner.ts # Multi-agent orchestration
├── icp-personas.ts     # 9 ICP personas definitions
├── scoring-rubric.ts   # Expert interaction evaluator
├── analysis.ts         # Post-simulation pattern detection
├── metrics.ts          # Learning metrics dashboard
├── daemon.ts           # Continuous background execution
├── scheduler.ts        # Cron-based scheduling
├── package.json        # Simulator package config
└── README.md           # This file
```

## Output Files

- `simulator-logs/*.json` — Individual simulation results
- `simulator-daemon.log` — Daemon activity log
- `simulator-schedules.json` — Scheduled jobs
- `workspace/suggestions.md` — Prompt improvement suggestions

## Troubleshooting

### Gateway unreachable

If you see `Gateway error 502` or similar, the nullclaw-kube gateway may be offline:

```bash
# Check gateway health
curl https://nullclaw-cloud.tail4bf23a.ts.net/health

# Use environment variable to override
export NULLCLAW_GATEWAY_URL=http://localhost:18791
```

### Analysis shows no data

Run a simulation first:

```bash
npx tsx cli.ts run icp1-A --count 10 --since 24
npx tsx cli.ts analyze --since 24
```

### Daemon won't start

Check if already running:

```bash
ls -la simulator-daemon.pid
```

Manually stop if needed:
```bash
kill $(cat simulator-daemon.pid)
rm simulator-daemon.pid
```

## Integration Points

The simulator integrates with:

1. **NullClaw Gateway** — Webhook endpoint at `/webhook`
2. **Postgres** — Stores simulation results and metrics
3. **OpenRouter** — For ICP virtual agent + evaluation LLM passes

## Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CONTINUOUS LEARNING FLYWHEEL                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. RUN SIMULATIONS                                                          │
│     ├─ On demand: npx tsx cli.ts run [persona] --count N                     │
│     ├─ Batch: npx tsx cli.ts batch                                          │
│     ├─ Scheduled: npx tsx cli.ts schedule "cron"                            │
│     └─ Daemon: npx tsx cli.ts daemon --rate N-per-hour                      │
│                                                                             │
│  2. ANALYZE RESULTS                                                          │
│     ├─ npx tsx cli.ts analyze --since 24                                    │
│     ├─ npx tsx cli.ts insights --since 24                                   │
│     └─ Identify weak dimensions, common failures, patterns                 │
│                                                                             │
│  3. GENERATE SUGGESTIONS                                                     │
│     ├─ npx tsx cli.ts suggest --since 24                                    │
│     ├─ Output to workspace/suggestions.md                                   │
│     └─ Human review → Apply to SOUL.md                                     │
│                                                                             │
│  4. ITERATE                                                                  │
│     └─ Next simulation validates improvements                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
