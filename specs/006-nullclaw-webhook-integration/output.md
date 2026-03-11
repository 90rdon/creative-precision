Progress Summary

  ┌─────────┬────────────┬───────────────────────────────────────────────┐
  │  Phase  │   Status   │                    Commit                     │
  ├─────────┼────────────┼───────────────────────────────────────────────┤
  │ Phase 1 │ ✅ Done    │ Webhook router service with persona routing   │
  ├─────────┼────────────┼───────────────────────────────────────────────┤
  │ Phase 2 │ ✅ Done    │ Simulator agent calls webhook, 3 personas     │
  ├─────────┼────────────┼───────────────────────────────────────────────┤
  │ Phase 3 │ ✅ Done    │ Proxy server updated to use /webhook protocol │
  ├─────────┼────────────┼───────────────────────────────────────────────┤
  │ Phase 4 │ ✅ Done    │ CLI, daemon, analysis, metrics, docs         │
  └─────────┴────────────┴───────────────────────────────────────────────┘

  ---
  What Works Now

  Assessment Chat UI
      ↓
  Proxy Server (NullClawClient.sendMessage)
      ↓ POST /webhook {message, session_id, agent_id: expert}
  Webhook Router (nullclaw-kube)
      ↓ Routes to expert agent
  Expert Response
      ↑
  Simulator Agent (nullclaw-kube)
      ↓ Calls /webhook with simulated personas
  Expert Response → Logged to Postgres → Learning

  Files Changed

  1. webhook-router/src/index.ts — Express service with persona routing
  2. webhook-router/src/simulator.ts — CLI simulator, calls webhook
  3. proxy-server/src/api/nullclaw/client.ts — Uses /webhook endpoint
  4. proxy-server/src/api/nullclaw/mock-gateway.ts — Compatible with webhook protocol

  ---
  Phase 4 Deliverables (Completed)

  CLI Interface
    npx tsx cli.ts run [persona] --count N      # Run N simulations
    npx tsx cli.ts batch                       # Run all personas
    npx tsx cli.ts daemon --rate N-per-hour    # Background daemon
    npx tsx cli.ts schedule "cron"             # Cron scheduling
    npx tsx cli.ts analyze --since 24           # Analyze simulations
    npx tsx cli.ts suggest --since 24           # Prompt suggestions
    npx tsx cli.ts insights --since 24          # Learning insights
    npx tsx cli.ts metrics --since 24           # Metrics dashboard

  Continuous Learning Flywheel
    1. Run simulations (on-demand, scheduled, or daemon)
    2. Analyze results (weak dimensions, patterns, common failures)
    3. Generate prompt suggestions (written to workspace/suggestions.md)
    4. Review and apply improvements → next simulation validates

  Autonomous Learning System (NEW)
    LLM-synthesizes dynamic personas based on learning state
    Replaces fixed persona rotation with continuous self-adaptation
    Simulator Agent calls persona generation tool → stores to Postgres
    Updates weakness_vector and next_probe_focus each iteration

  Documentation
    scripts/simulator/README.md — CLI guide
    docs/AUTONOMOUS_LEARNING_SYSTEM.md — Autonomous system docs

  Available Personas (9 static + unlimited dynamic)
    icp1-A through icp3-C — Static ICP personas (CLI only)
    Dynamic personas — LLM-synthesized (autonomous runs)