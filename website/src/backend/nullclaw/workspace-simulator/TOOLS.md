# TOOLS.md — Simulator Agent

## Available Tools

### Simulation Engine
Run the Node.js simulation script from the server directory. This script uses the Google GenAI SDK to spin up "Actor" prompts that talk directly to the Expert's "Prompt" architecture without needing a browser.
```bash
cd server && npx ts-node src/api/nullclaw/simulator.ts run --persona="CTO under pressure" --branching=true
```

### Supabase
The simulation script automatically handles connecting to Supabase and logging the `assessment_events` and `executive_insights` with the `is_simulated: true` flag.

### Synthesizer Reports
Read the latest Synthsizer reports in `docs/reports/` to determine if you should "Exploit" a known vulnerability rather than "Explore" a random new persona.
