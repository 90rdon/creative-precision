# GTM Intelligence Loop — Setup, Run & Test Guide

**Feature Branch**: `004-continuous-gtm-loop`  
**Last Updated**: 2026-03-02  
**Status**: Active Development

---

## Overview

This document is the single source of truth for setting up, running, and testing the
**Continuous GTM Intelligence Loop** — the autonomous, self-improving multi-agent system
powering Creative Precision.

### The 5-Agent System

| Agent | Role | Heartbeat | Reacts To |
|-------|------|-----------|-----------|
| **Main** | Orchestrator — macro-health watchdog | `24h` | Nothing (initiates) |
| **Synthesizer** | Reads Supabase telemetry → produces friction report | `12h` | Main, cron |
| **Simulator** | Red Team adversarial testing via Express API | `6h` | Main, cron |
| **Engineer** | Proposes Tier 1/2 changes, logs to DB | `24h` | Synthesizer + Simulator outputs |
| **Expert** | Frontline: executes live user conversations | None (reactive only) | Web UI / proxy HTTP |

> **Key Rule:** The Node proxy server never orchestrates agents.
> OpenClaw owns all scheduling via native heartbeats and cron jobs.

---

## Prerequisites

Ensure all of these are in place before proceeding.

### 1. Environment Variables (`.env`)

Your project root `.env` must contain these keys:

```bash
# Supabase
SUPABASE_URL=https://qxetgnheojhpcskctort.supabase.co
SUPABASE_ANON_KEY=eyJ...        # From Supabase Dashboard > API Keys > Anon Key
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...  # From API Keys tab
SUPABASE_DB_PASSWORD=<your-db-password>      # From Settings > Database — NOT the API key

# Server
GEMINI_API_KEY=AIza...
REDIS_URL=redis://localhost:6379
PORT=3000

# OpenClaw
OPENCLAW_TOKEN=09b9ddbc...
OPENCLAW_API_ENDPOINT=http://localhost:18790/api/v1
ADMIN_CHAT_ID=-1003873447811   # Telegram group ID for admin alerts

# Telegram
TELEGRAM_BOT_TOKEN=8799043166:AAF...

# AI Providers
NVIDIA_API_KEY=nvapi-...
OPENROUTER_API_KEY=sk-or-v1-...
```

> ⚠️ **`SUPABASE_DB_PASSWORD`** is the Postgres **database password**, not an API key.
> Find it at: **Supabase Dashboard → Settings → Database → Database password**.
> If you've never set it, use "Reset your database password" on the Connection String page.

---

## Step 1: Run Supabase Migrations

We create **8 tables** across 2 migrations. Choose either method — both are idempotent (safe to run multiple times).

### Method A: Supabase Dashboard SQL Editor ✅ (Recommended — no network issues)

1. Open [https://supabase.com/dashboard/project/qxetgnheojhpcskctort/sql/new](https://supabase.com/dashboard/project/qxetgnheojhpcskctort/sql/new)
2. Open the file [`supabase/migrations/COMBINED_RUN_IN_DASHBOARD.sql`](../supabase/migrations/COMBINED_RUN_IN_DASHBOARD.sql)
3. Paste the entire contents into the SQL Editor
4. Click **Run** (▷)
5. You should see: `Success. No rows returned.`

### Method B: CLI Migrator (requires correct DB password in `.env`)

> ⚠️ **IPv4 note**: The direct Supabase connection is IPv6-only. The script automatically
> uses the Session Pooler (IPv4 compatible, port 5432). Ensure `SUPABASE_DB_PASSWORD` is set.

```bash
# From project root
cd server && npm run migrate
```

Expected output:
```
🔑  Project ref: qxetgnheojhpcskctort

🔌 Attempting connection via Session Pooler (us-west-1, port 5432)...
   Connected.

Found 2 migration file(s):
  → 20260301000000_init_telemetry_schema.sql
  → 20260302000000_agent_changes.sql

Running: 20260301000000_init_telemetry_schema.sql ...
  ✅ applied.
Running: 20260302000000_agent_changes.sql ...
  ✅ applied.

🎉 All migrations applied successfully.
```

### Verify Tables Exist

After running, confirm these **8 tables** exist in Supabase under **Table Editor**:

| Table | Purpose |
|-------|---------|
| `assessment_sessions` | Chat session transcripts |
| `assessment_events` | Behavioral telemetry events (real + synthetic) |
| `executive_insights` | Post-chat AI synthesis results |
| `market_signals` | OpenClaw Synthesizer external research |
| `gtm_experiments` | Config version tracking |
| `intelligence_cycles` | Log of each full orchestration loop run |
| `agent_changes` | Engineer's Tier 1/2 change ledger |
| `simulator_runs` | Log of every synthetic adversarial session |

---

## Step 2: Install Server Dependencies

```bash
cd server && npm install
```

This ensures `pg`, `socket.io-client`, and all other deps are present.

---

## Step 3: Verify OpenClaw Agent Configs

Each agent's config files should be present at the paths referenced in `openclaw.json`.

```bash
# From project root — check all agent config files exist
ls openclaw_data/agents/main/agent/      # agent.json, system.md, models.json
ls openclaw_data/agents/expert/agent/    # agent.json, system.md
ls openclaw_data/agents/synthesizer/agent/ # agent.json, system.md
ls openclaw_data/agents/simulator/agent/ # agent.json, system.md
ls openclaw_data/agents/engineer/agent/  # agent.json, system.md
```

> All `agent.json` files define the heartbeat schedule. OpenClaw reads these when the
> gateway starts. Any changes to `agent.json` require a **gateway restart**.

### Heartbeat Schedule Summary

```
Main        → every 24h  (macro-health check, coordinates others)
Synthesizer → every 12h  (reads Supabase, builds friction report)
Simulator   → every 6h   (runs adversarial synthetic sessions)
Engineer    → every 24h  (proposes changes from combined intel)
Expert      → no heartbeat (reactive only)
```

---

## Step 3.5: Cron Jobs — No Manual Setup Required

OpenClaw has a **native `cron` tool** that agents use at runtime to register, list, and fire scheduled jobs. There is no `jobs.json` file to copy.

The **Main agent** is responsible for registering all sibling cron jobs on its **first heartbeat** using `cron add`. After that, the jobs persist in the gateway automatically.

### What gets registered (by Main on first boot)

| Job ID | Agent | Time (CST) | Purpose |
|--------|-------|-----------|---------|
| `synthesizer-morning` | synthesizer | 7:00 AM | Morning telemetry synthesis |
| `synthesizer-evening` | synthesizer | 7:00 PM | Evening telemetry synthesis |
| `simulator-0600` | simulator | 6:00 AM | Red Team run #1 |
| `simulator-1200` | simulator | 12:00 PM | Red Team run #2 |
| `simulator-1800` | simulator | 6:00 PM | Red Team run #3 |
| `simulator-0000` | simulator | 12:00 AM | Red Team run #4 |
| `engineer-daily` | engineer | 7:30 AM | Daily optimization loop |

> **Sequence matters**: Synthesizer (7:00 AM) → Engineer (7:30 AM) → Main (8:00 AM)
> Each downstream agent has fresh data when it wakes.

### Verify cron jobs are registered

After the Main agent's first heartbeat fires, you can check registrations via the OpenClaw gateway HTTP API:

```bash
node -e "
const http = require('http');
const req = http.request({
  hostname: 'localhost', port: 18790,
  path: '/api/v1/cron/jobs',
  headers: { 'Authorization': 'Bearer 09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83' }
}, res => { let d=''; res.on('data', c => d+=c); res.on('end', () => console.log(JSON.stringify(JSON.parse(d), null, 2))); });
req.end();
"
```

### Manually trigger Main's first heartbeat (skip the 24h wait)

```bash
node -e "
const http = require('http');
const body = JSON.stringify({ content: 'Run your first-boot setup: check cron list, register all sibling cron jobs if missing, then run your daily intelligence loop.' });
const req = http.request({
  hostname: 'localhost', port: 18790,
  path: '/api/v1/agents/main/message',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, res => { let d=''; res.on('data', c => d+=c); res.on('end', () => console.log(d)); });
req.write(body); req.end();
"
```

---

## Step 4: Start the Node Proxy Server

The proxy server is required for:
- Serving the website assessment chat (Expert agent interface)
- Receiving Simulator synthetic sessions via WebSocket

```bash
# Terminal 1: Start the proxy server
cd server && npm run dev
# or: npx ts-node src/index.ts

# Verify health:
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

---

## Step 5: Start the OpenClaw Gateway

```bash
# On the Kubernetes host (openclaw-kube via Lima)
sudo -u openclaw-service openclaw-gateway start

# Or if using local OpenClaw:
openclaw gateway start
```

Once the gateway is running, heartbeats will fire automatically per the schedule above.

---

## Testing

### Test A: Manual Tool Invocations (from project root)

These simulate what OpenClaw agents call during their heartbeat loops.

```bash
# Synthesizer: Fetch last 24h of telemetry events
npx tsx src/api/openclaw/gtm_tools.ts fetch-sessions 24

# Synthesizer: Fetch executive insights from last 24h
npx tsx src/api/openclaw/gtm_tools.ts fetch-insights 24

# Synthesizer: Log a sample market signal
npx tsx src/api/openclaw/gtm_tools.ts log-market-signal \
  "Enterprise AI Adoption" 8 \
  "CIOs cite governance gaps as #1 blocker" \
  "Direct alignment with Creative Precision messaging"

# Engineer: Propose a Tier 2 (auto-apply) change
npx tsx src/api/openclaw/engineer_tools.ts propose-change 2 \
  "Soften Expert intro tone" \
  "Simulator reported 2/5 personas found opening too direct"

# Engineer: Propose a Tier 1 (admin approval required) change
npx tsx src/api/openclaw/engineer_tools.ts propose-change 1 \
  "Update SOUL.md core value proposition" \
  "Synthesizer identified consistent messaging gap around EU AI Act compliance"
```

### Test B: Simulator Synthetic Session

> Requires the Node proxy server to be running on port 3000.

```bash
# Run a synthetic adversarial session as a skeptical CFO
npx tsx src/api/openclaw/simulator_tools.ts run-simulation \
  "Skeptical CFO — challenges ROI of AI governance" \
  "We already spent $2M on an AI initiative last year. Why would governance change that outcome?"
```

**What to verify:**
1. Expert agent responds via the proxy
2. A new row appears in `assessment_events` with `payload.isSynthetic = true`
3. A new row appears in `simulator_runs` (if the Simulator agent is documenting its runs)

### Test C: Intelligence Cycle (Full Loop — Manual Trigger)

Until the cron/heartbeat fires naturally, you can trigger the full loop manually by
messaging the **Main** or **Synthesizer** agent directly in OpenClaw Telegram or the
control UI:

```
@main: Run intelligence cycle now
```

or via the OpenClaw HTTP API:
```bash
curl -X POST http://localhost:18790/api/v1/agents/main/message \
  -H "Authorization: Bearer 09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83" \
  -H "Content-Type: application/json" \
  -d '{"content": "Run a full GTM intelligence cycle now and summarize findings."}'
```

**What to verify:**
1. A new row in `intelligence_cycles` with `status = 'running'`
2. `synthesizer_summary` and `simulator_summary` fields populate
3. One or more rows appear in `agent_changes`
4. `intelligence_cycles.status` updates to `'completed'`
5. Tier 1 changes → Telegram notification received by Admin
6. Tier 2 changes → `status = 'applied_automatically'` in DB immediately

---

## Synthetic vs. Real Session Identification

All data in Supabase is tagged to distinguish live user sessions from synthetic simulator runs:

| Indicator | Location | Value |
|-----------|----------|-------|
| `isSynthetic: true` | `assessment_events.payload` | Set by `simulator_tools.ts` |
| `session_id` prefix | `simulator_runs.session_id` | Always starts with `synthetic-` |
| `simulator_runs` table | Dedicated table | All synthetic runs logged here |

To query only real user events in Supabase:
```sql
SELECT * FROM assessment_events
WHERE payload->>'isSynthetic' IS DISTINCT FROM 'true'
ORDER BY created_at DESC;
```

---

## Tier 1 vs. Tier 2 Change Reference

| | Tier 1 (Major) | Tier 2 (Minor) |
|-|----------------|----------------|
| **Examples** | Changes to `SOUL.md`, core Expert persona, standard protocol | Prompt tone tweaks, CTA copy, intro phrasing |
| **Applied by** | Admin only (after Telegram review) | Engineer agent, automatically |
| **DB Status** | `pending_approval` | `applied_automatically` |
| **Admin Alert** | ✅ Yes — Telegram notification sent | ❌ No alert (silent) |
| **Logged in DB** | ✅ Always | ✅ Always |

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `npx tsx migrate.ts` → "SUPABASE_DB_PASSWORD not set" | Missing env var | Add to `.env`: `SUPABASE_DB_PASSWORD=<your-db-password>` — get from Supabase Settings → Database |
| Pooler → "Tenant or user not found" | Wrong DB password | Reset password at Supabase Dashboard → Settings → Database |
| `EHOSTUNREACH` on direct connection | IPv6 only — Mac/home network | Use Session Pooler (Method A or B above) or paste SQL in Dashboard |
| Simulator → no response from Expert | Proxy server not running | `cd server && npm run dev` |
| `assessment_events` empty after simulation | Supabase not connected | Check `SUPABASE_ANON_KEY` in server `.env` |
| Heartbeat not firing | Gateway not running | Restart OpenClaw gateway |

---

## File Reference

```
project root/
├── supabase/migrations/
│   ├── 20260301000000_init_telemetry_schema.sql   ← Telemetry tables
│   ├── 20260302000000_agent_changes.sql           ← GTM intelligence tables
│   └── COMBINED_RUN_IN_DASHBOARD.sql              ← Paste this in Supabase SQL Editor
│
├── server/
│   └── migrate.ts                                 ← CLI migration runner
│
├── src/api/openclaw/
│   ├── gtm_tools.ts         ← Synthesizer tools (fetch-sessions, log-signal)
│   ├── engineer_tools.ts    ← Engineer tools (propose-change, log to DB)
│   ├── simulator_tools.ts   ← Simulator tools (run-simulation via proxy)
│   └── telemetry.ts         ← Supabase client for frontend/tools
│
└── openclaw_data/agents/
    ├── main/agent/           ← agent.json (24h heartbeat), system.md
    ├── expert/agent/         ← agent.json (no heartbeat), system.md
    ├── synthesizer/agent/    ← agent.json (12h heartbeat), system.md
    ├── simulator/agent/      ← agent.json (6h heartbeat), system.md
    └── engineer/agent/       ← agent.json (24h heartbeat), system.md
```
