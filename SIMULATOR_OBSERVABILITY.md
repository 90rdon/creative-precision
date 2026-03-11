# Simulator Observability & Job Tracking

**Quick reference for monitoring simulator execution against the expert proxy.**

## Connection String

```bash
psql "postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw"
```

---

## Live Job Status

**See all active and completed jobs:**

```sql
SELECT
  id,
  persona_name,
  strategy,
  status,
  turns_completed,
  ROUND(EXTRACT(EPOCH FROM (completed_at - started_at))) as duration_seconds,
  error_message,
  completed_at
FROM simulator_jobs
ORDER BY created_at DESC
LIMIT 20;
```

**See only in-progress jobs:**

```sql
SELECT
  id,
  persona_name,
  status,
  ROUND(EXTRACT(EPOCH FROM (NOW() - started_at))) as elapsed_seconds
FROM simulator_jobs
WHERE status IN ('pending', 'in_progress')
ORDER BY started_at ASC;
```

---

## Chat Transcripts

**See all assessment sessions:**

```sql
SELECT
  id,
  session_status,
  (transcript->0)::text as first_message,
  jsonb_array_length(transcript) as message_count,
  created_at
FROM assessment_sessions
ORDER BY created_at DESC
LIMIT 10;
```

**See full transcript for a session:**

```sql
SELECT transcript FROM assessment_sessions WHERE id = 'YOUR_SESSION_ID';
```

---

## Interactions & Events

**Count event types:**

```sql
SELECT
  event_type,
  COUNT(*) as event_count,
  MAX(created_at) as last_event
FROM assessment_events
GROUP BY event_type
ORDER BY event_count DESC;
```

**Events for a specific session:**

```sql
SELECT
  event_type,
  event_data,
  created_at
FROM assessment_events
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY created_at ASC;
```

**Telemetry payload (simulated jobs):**

```sql
SELECT
  id,
  event_data -> 'persona' as persona,
  event_data -> 'evaluation' ->> 'score' as eval_score,
  event_data -> 'evaluation' ->> 'passed' as eval_passed,
  created_at
FROM assessment_events
WHERE event_type = 'simulation_run'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Synthesis Results

**See synthesis outputs:**

```sql
SELECT
  session_id,
  sentiment_score,
  identified_market_trend,
  gtm_feedback_quote,
  created_at
FROM executive_insights
ORDER BY created_at DESC
LIMIT 10;
```

**Detailed analysis notes:**

```sql
SELECT
  session_id,
  analysis_notes,
  created_at
FROM executive_insights
WHERE session_id = 'YOUR_SESSION_ID';
```

---

## Performance & Diagnostics

**Average job duration by persona:**

```sql
SELECT
  persona_name,
  COUNT(*) as job_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))) as avg_duration_sec,
  ROUND(AVG(turns_completed)) as avg_turns
FROM simulator_jobs
WHERE status = 'completed'
GROUP BY persona_name
ORDER BY job_count DESC;
```

**Jobs with errors:**

```sql
SELECT
  id,
  persona_name,
  status,
  error_message,
  created_at
FROM simulator_jobs
WHERE error_message IS NOT NULL
ORDER BY created_at DESC;
```

**Session completion rate:**

```sql
SELECT
  COUNT(CASE WHEN session_status = 'completed' THEN 1 END)::float / COUNT(*) as completion_rate,
  COUNT(DISTINCT id) as total_sessions
FROM assessment_sessions;
```

---

## Real-Time Monitoring

**Watch jobs as they complete (in separate terminal):**

```bash
psql "postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw" \
  --command "SELECT id, persona_name, status, turns_completed, completed_at FROM simulator_jobs ORDER BY created_at DESC LIMIT 5;" \
  --watch=1
```

---

## Exporting Data

**Export simulation results as CSV:**

```bash
psql "postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw" \
  --csv \
  --command "SELECT id, persona_name, strategy, status, turns_completed, completed_at FROM simulator_jobs;" \
  > simulator_jobs.csv
```

**Export chat transcripts:**

```bash
psql "postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw" \
  --command "SELECT id, session_status, created_at, transcript FROM assessment_sessions;" \
  > assessment_sessions.json
```

---

## Dashboard Queries

**Summary snapshot:**

```sql
SELECT
  'Total Jobs' as metric, COUNT(*)::text as value FROM simulator_jobs
UNION ALL
SELECT 'Completed Jobs', COUNT(*)::text FROM simulator_jobs WHERE status = 'completed'
UNION ALL
SELECT 'Failed Jobs', COUNT(*)::text FROM simulator_jobs WHERE status = 'failed'
UNION ALL
SELECT 'Total Sessions', COUNT(*)::text FROM assessment_sessions
UNION ALL
SELECT 'Total Events', COUNT(*)::text FROM assessment_events
UNION ALL
SELECT 'Latest Job', COALESCE(MAX(completed_at)::text, 'Never') FROM simulator_jobs;
```
