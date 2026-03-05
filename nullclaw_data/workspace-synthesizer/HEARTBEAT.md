# HEARTBEAT.md — Synthesizer Agent

## Daily Tasks (Run at ~8:00 AM via cron)

### 1. Aggregate Yesterday's Sessions
- Query `assessment_events` and `executive_insights` from the last 24 hours
- Identify completion rates, drop-off points, and average session duration
- Note any new patterns in executive responses

### 2. Scan for Market Signals
- Search web for latest AI governance news, executive sentiment, and competitor moves
- Log significant findings to Supabase `market_signals` table
- Focus on: AI fatigue signals, pilot-to-production failure stories, governance mandate updates

### 3. Generate Daily GTM Report
- Synthesize session data + market signals into `docs/reports/GTM_REPORT_YYYY-MM-DD.md`
- Include recommended changes to Expert's `IDENTITY.md` with evidence
- Flag any `SOUL.md` changes for Admin approval

### 4. Update Expert's Market Context (if warranted)
- If new market data materially changes the conversational landscape, update the "Market Context" section of `workspace-expert/IDENTITY.md`
- Log the change in your daily memory file

## State Tracking
Track last check times in `memory/heartbeat-state.json`:
```json
{
  "lastChecks": {
    "sessionAggregate": null,
    "marketScan": null,
    "reportGenerated": null,
    "identityUpdated": null
  }
}
```
