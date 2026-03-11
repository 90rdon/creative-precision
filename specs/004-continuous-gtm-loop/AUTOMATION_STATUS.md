# Automation Status — Continuous GTM Loop
**Updated**: 2026-03-09

---

## What Was Built Today

### `/scripts/simulator/icp-personas.ts`
9 fully written ICP personas across 3 archetypes × 3 friction variants (A=cooperative, B=skeptical, C=adversarial). Each persona has:
- Backstory, title, company, industry
- Surface narrative vs. second layer (what they're really thinking)
- Behavioral rules for the virtual agent
- Drop-off trigger: **"must feel like getting value or I'll leave"** — universal rule added
- Success signal: what "Expert got through" looks like

### `/scripts/simulator/scoring-rubric.ts`
8-dimension scoring rubric (0–10 each, weighted composite):
- **Authenticity** (20%) — peer, not consultant
- **Relatability** (20%) — "yes, exactly" test
- **Listening** (18%) — 2nd-layer detection
- **Non-preachiness** (15%) — zero "should" energy
- **Invitation energy** (12%) — open door close
- **Pace control** (7%) — didn't rush
- **Resisted solving** (5%) — no premature fix-it
- **Brand compliance** (3%) — no em dashes, no banned words

LLM-based evaluator prompt (structured JSON output). Flag system for critical issues (PITCH, PREACHINESS, HALLUCINATION, etc.) and positive signals (GOOD_REFLECTION, STRONG_INVITATION).

### `/scripts/simulator/simulator-runner.ts`
Full orchestration engine:
- Drives ICP virtual agent (OpenRouter LLM)
- Sends to Expert via nullclaw gateway (POST /webhook)
- Scores each Expert turn in real-time via Evaluator LLM
- Detects ICP disengagement, second-layer breakthrough, success signal
- Logs to local JSON (`simulator-logs/`) AND PostgreSQL if `DATABASE_URL` set
- CLI: `npx tsx simulator-runner.ts <persona_id> <strategy> <max_turns>`
- Batch: `npx tsx simulator-runner.ts batch <strategy> <max_turns>`
- Mock mode: falls back to mock Expert response if gateway unreachable

### `/aieos-mcp/` — Full MCP Server
12 tools for fleet management and near-real-time tracking:
- `list_instances`, `get_instance_status`, `register_instance`
- `list_personas`, `configure_persona`
- `define_relationship`
- `get_agent_state`, `save_agent_state`
- `list_simulation_jobs`, `get_simulation_insights`
- `log_event`
- `get_fleet_dashboard`

JSON-file persistence (no external DB required). Ships pre-configured with nullclaw-kube and the 6 default agent relationships (simulator→expert monitors, synthesizer synthesizes from both, etc.).

### Scheduled Task: `gtm-simulation-loop`
Runs daily at 7:05 AM. Strategy rotates by day of week (standard → adversarial → roi_pressure → silent_resistance → jargon_wall → trust_build). Produces markdown intelligence report and logs to aieos-mcp.

---

## Automation Level: What's Fully Automatic

| Step | Automated? | Notes |
|------|-----------|-------|
| ICP virtual agent drives conversation | YES | OpenRouter LLM |
| Expert responds | YES | nullclaw gateway |
| Each turn scored in real-time | YES | Evaluator LLM pass |
| ICP disengagement detected | YES | Keyword + behavioral |
| Second-layer breakthrough detected | YES | Flag system |
| Results logged locally | YES | simulator-logs/*.json |
| Daily loop scheduled | YES | 7:05 AM cron |
| Strategy rotation | YES | Day-of-week logic |
| Fleet dashboard | YES | aieos-mcp tool |
| Synthesizer reads insights | PARTIAL | Synthesizer on nullclaw-kube needs to call `get_simulation_insights` |
| Engineer applies approved changes | MANUAL | Requires Admin approval per SOUL.md |
| SOUL.md modifications | NEVER AUTOMATIC | Admin veto always required (spec FR-004) |
| Telegram report delivery | PENDING | Needs Telegram bot token wired to reporter script |

---

## The 3 Gaps to Full Automation

### Gap 1: Network Access (Tailscale required)
The simulator runner and aieos-mcp need to reach:
- `https://nullclaw-cloud.tail4bf23a.ts.net` (nullclaw gateway)
- `postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw` (Vigil Pi DB)

**From this Claude Cowork VM**: Both are blocked (Tailscale network).
**From nullclaw-kube itself or your Mac**: Fully accessible.

**Fix**: Run `npx tsx scripts/simulator/simulator-runner.ts` from a machine on your Tailscale network. The scheduled task (which runs on your Mac) will have this access.

### Gap 2: aieos-mcp not yet installed in Claude
The aieos-mcp server is built and ready. It needs to be registered as an MCP server in Claude's config so the daily loop task and the Synthesizer agent can call its tools.

**Fix — add to your Claude MCP config:**
```json
{
  "aieos": {
    "command": "npx",
    "args": ["tsx", "/path/to/creative-precision/aieos-mcp/src/index.ts"],
    "env": {
      "NULLCLAW_TOKEN": "09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83"
    }
  }
}
```

### Gap 3: Synthesizer + Engineer not yet wired to the loop
The Synthesizer on nullclaw-kube has its SOUL.md defined but doesn't yet know to:
1. Call `get_simulation_insights` on aieos-mcp
2. Read `simulator-logs/` for new data
3. Produce the daily GTM Report autonomously

**Fix**: Add a cron hook to the Synthesizer's workspace (CRON.md or equivalent) that fires after the simulation batch completes. This is a nullclaw-side config update (15 minutes of work).

---

## What You Can Run Right Now (No Network Required)

```bash
cd /path/to/creative-precision

# Single persona, standard mode, 4 turns (mock Expert responses)
npx tsx scripts/simulator/simulator-runner.ts icp1-A standard 4

# Adversarial ICP (Derek — the most defensive)
npx tsx scripts/simulator/simulator-runner.ts icp1-C adversarial 6

# Full batch, all 9 personas, roi_pressure strategy
npx tsx scripts/simulator/simulator-runner.ts batch roi_pressure 5

# Start aieos-mcp server (for tool access from Claude)
cd aieos-mcp && npm install && npx tsx src/index.ts
```

Results land in `simulator-logs/`.

---

## Next Steps to Close the Gaps

1. **Run `npm install`** in `aieos-mcp/` on your Mac
2. **Register aieos-mcp** in Claude Desktop MCP config
3. **Wire Synthesizer cron** on nullclaw-kube to call `get_simulation_insights` post-batch
4. **Test end-to-end** with gateway live: `npx tsx simulator-runner.ts icp1-A standard 6`
5. **Telegram integration**: add bot token to the daily loop reporter

---

## The Loop When Fully Closed

```
7:05 AM cron (Mac)
  ↓
simulator-runner.ts (batch, rotating strategy)
  ↓ [9 simulations × 6 turns = ~54 Expert turns scored]
simulator-logs/ + aieos-mcp (log_event)
  ↓
Synthesizer cron fires (nullclaw-kube)
  ↓ [reads insights, compares to SOUL, drafts IDENTITY.md changes]
Daily GTM Report → Telegram
  ↓
Admin reviews (< 5 min)
  ↓
Engineer applies approved changes
  ↓
Updated Expert goes into next day's loop
```

Total loop time: ~12 minutes. Human review time: ~5 minutes. Everything else: automatic.
