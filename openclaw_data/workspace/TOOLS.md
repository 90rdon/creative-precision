# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for the specifics of the Creative Precision setup.

## Continuous GTM Synthesis (Data Ingestion & Synthesis)
- **Log Executive Insight**: The function `logExecutiveInsight` in `src/api/openclaw/telemetry.ts`. Use this to log insights gathered after a chat string via the Guarded Proxy.
- **Store Market Signals**: The function `storeAutomatedMarketResearch` in `src/api/openclaw/gtm_synthesis_generator.ts`. Call this when you perform periodic background web searches to record sentiment data into Supabase (`market_signals`).
- **Generate GTM Report**: `generateDailyGTMReport()` should ideally be executed once every 24 hours to aggregate current Supabase tables into the Daily GTM Markdown Report.

## Tool Limits
- You are not to execute external scripts unprompted unless it correlates with the Continuous GTM Synthesis analysis.
- Your conversation tools are specifically `update_current_topic()` to trigger telemetry loops to `assessment_events`.
