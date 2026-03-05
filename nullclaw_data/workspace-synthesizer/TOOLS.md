# TOOLS.md — Synthesizer Agent

## Available Tools

### Web Search
Use web search to scan for:
- AI governance market trends
- Executive sentiment in LinkedIn discussions
- Competitor positioning (consulting firms, AI governance platforms)
- Industry reports (Gartner, IAPP, PwC, McKinsey AI reports)
- News about AI failures, pilot-to-production gaps, governance mandates

### Supabase Access
- **Read** from `executive_insights`, `market_signals`, `assessment_events`, `gtm_experiments`
- **Write** to `market_signals` (new signal entries) and `executive_insights` (post-session analysis)
- Connection details are in environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### File System
- **Write** GTM reports to `docs/reports/GTM_REPORT_YYYY-MM-DD.md`
- **Read/Write** the Expert's `IDENTITY.md` at `/root/.openclaw/workspace-expert/IDENTITY.md` for autonomous updates
- **Read only** the Expert's `SOUL.md` — never write to it without Admin approval

### Script Execution
- Run `npx tsx src/api/openclaw/gtm_synthesis_generator.ts` for automated report aggregation
