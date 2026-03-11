# Supabase → PostgreSQL Migration

**Date:** March 9, 2026
**Status:** Complete

## Summary

Switched from Supabase to native PostgreSQL on Pi Kube for assessment tracking and simulator telemetry.

## Infrastructure

**Connection Details:**
- **Host:** 100.85.130.20 (Tailscale IP)
- **Port:** 5432
- **Database:** nullclaw
- **User:** nullclaw
- **Password:** nullclaw
- **Connection String:** `postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw`

**Status:** Running on pi (90rdon-berry), confirmed via:
```bash
psql "postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw" -c "\dt"
```

## Schema

Created 6 new tables on Pi Kube Postgres:

| Table | Purpose | Indices |
|-------|---------|---------|
| `assessment_sessions` | Chat transcripts | created_at, status |
| `assessment_events` | Behavioral telemetry | session_id, created_at |
| `executive_insights` | Post-chat analysis | session_id |
| `market_signals` | External research | created_at |
| `gtm_experiments` | Config tracking | created_at |
| `simulator_jobs` | **NEW:** Job observability | session_id, status |

## Code Changes

### Proxy Server (`website/src/backend/proxy-server/`)

**New Files:**
- `src/db/postgres.ts` — Connection pool with query helpers

**Updated Files:**
- `src/db/index.ts` — Exports `pool` instead of `supabase`
- `src/services/sessionService.ts` — Uses Postgres for archival
- `src/socket/chat.ts` — Logs telemetry to Postgres
- `src/gemini/stream.ts` — Logs synthesis to executive_insights
- `package.json` — Removed `@supabase/supabase-js` dependency

### NullClaw Workspace (`website/src/backend/nullclaw/workspace/`)

**Updated Files:**
- `src/api/nullclaw/gtm_synthesis_generator.ts` — Fetches from Postgres instead of Supabase

### Root Config

**Updated Files:**
- `.env` — Added `DATABASE_URL=postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw`

## How It Works

### Simulator Execution

```bash
npx ts-node src/api/nullclaw/simulator.ts run
```

**Logs to:**
1. `simulator_jobs` — Job metadata (persona, strategy, status, turns)
2. `assessment_sessions` — Full transcript
3. `assessment_events` — Simulation metadata (evaluation, weakness)
4. `executive_insights` — Post-run synthesis

**Query Example:**
```sql
SELECT persona_name, status, turns_completed, error_message, completed_at
FROM simulator_jobs
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;
```

### Chat Socket Events

User sends message → stored in Redis → logged to `assessment_events` as telemetry.

**Query Example:**
```sql
SELECT event_type, COUNT(*) FROM assessment_events
GROUP BY event_type
ORDER BY COUNT DESC;
```

### Observability

**Live Job Tracking:**
```sql
-- All in-progress jobs
SELECT id, persona_name, status, EXTRACT(EPOCH FROM (NOW() - started_at)) as elapsed_seconds
FROM simulator_jobs
WHERE status IN ('pending', 'in_progress')
ORDER BY started_at ASC;
```

**Chat Performance:**
```sql
-- Sessions by status
SELECT session_status, COUNT(*) FROM assessment_sessions
GROUP BY session_status;
```

**Synthesis Results:**
```sql
-- Latest insights
SELECT session_id, identified_market_trend, gtm_feedback_quote
FROM executive_insights
ORDER BY created_at DESC
LIMIT 5;
```

## Environment Setup

The proxy server automatically connects to Postgres on startup:
```
DATABASE_URL=postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw
```

Connection pool: max 20 connections, 30s idle timeout, 2s connection timeout.

## Fallbacks

If Postgres is unavailable:
- `gtm_synthesis_generator.ts` falls back to hardcoded market signals
- Telemetry continues to Redis (not persisted)

## Next Steps

1. **Run simulator against expert proxy:**
   ```bash
   cd website/src/backend/proxy-server
   npm run dev
   npx ts-node src/api/nullclaw/simulator.ts run
   ```

2. **Monitor jobs:**
   ```bash
   psql "postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw" \
     -c "SELECT * FROM simulator_jobs ORDER BY created_at DESC LIMIT 5;"
   ```

3. **Generate GTM report:**
   ```bash
   cd website/src/backend/nullclaw/workspace
   npx ts-node src/api/nullclaw/gtm_synthesis_generator.ts
   ```

## Testing

Verify the connection:
```bash
psql "postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw" -c "\dt"
```

Expected output:
```
             List of relations
 Schema |        Name         | Type  | Owner
--------+---------------------+-------+---------
 public | assessment_events   | table | nullclaw
 public | assessment_sessions | table | nullclaw
 public | executive_insights  | table | nullclaw
 public | market_signals      | table | nullclaw
 public | simulator_jobs      | table | nullclaw
 public | gtm_experiments     | table | nullclaw
```
