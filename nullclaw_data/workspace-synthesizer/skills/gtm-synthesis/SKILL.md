---
name: gtm-synthesis
description: Use the Node.js CLI to interact with the Supabase telemetry tables for Continuous GTM Synthesis.
---

# Supabase Telemetry & GTM Synthesis Guide

You have access to a custom Node.js CLI script that acts as your bridge to the Supabase database. You must use this CLI to aggregate session data, read executive insights, and record new market signals as part of your daily Continuous GTM Synthesis tasks.

## Commands

### 1. Fetching Assessment Sessions
To see how recent executive chat sessions went (including drop-offs, completed assessments, and durations):
```bash
npx tsx --env-file=.env src/api/openclaw/gtm_tools.ts fetch-sessions 24
```
*Note: The number '24' represents the last 24 hours. You can adjust this to fetch older data.*

### 2. Fetching Executive Insights
To read the deep analysis notes left by the underlying processing service after a session:
```bash
npx tsx --env-file=.env src/api/openclaw/gtm_tools.ts fetch-insights 24
```
*Note: This data is critical for identifying qualitative patterns in what executives actually responded to.*

### 3. Logging a Market Signal
When you perform web research and discover a new trend in AI governance or executive sentiment, log it directly into the `market_signals` table:
```bash
npx tsx --env-file=.env src/api/openclaw/gtm_tools.ts log-market-signal "Topic Name" 8 "The actual key insight you found" "How this impacts our GTM or the Expert's conversation angles" "https://optional.source.url"
```

## How to use this data
When your daily Cron Job (id: `daily-gtm-synthesis`) fires, you should:
1. `fetch-sessions` and `fetch-insights` to understand what happened yesterday.
2. Conduct web research using your `search_web` capabilities.
3. `log-market-signal` for any actionable intelligence you found.
4. Generate the `GTM_REPORT_YYYY-MM-DD.md` in `docs/reports/`.
5. Propose or automatically apply (if within your autonomy bounds) updates to the `workspace-expert/IDENTITY.md` file based on this data.
