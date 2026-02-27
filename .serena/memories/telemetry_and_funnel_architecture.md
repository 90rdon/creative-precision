# Telemetry & Scientific Funnel Architecture

## Current State (V0.1)
- UTM params parsed on load → stored in `utmData` state
- `sessionId` generated per session
- Events currently logged to `console.log` only (not persisted)

## Planned Telemetry Events (5 key signals)
1. `Session_Start_Rate` — Landing page views vs first message sent
2. `Message_Depth_Dropoff` — Which Moment (Ambition/Reality/Friction) they abandon at
3. `Share_Intent_Rate` — Clicks on "Share" / "Copy Link" on Results page
4. `Pre_Commitment_Rate` — Clicks on Lifeline CTA → Calendly calendar booking
5. `Friction_Type_Frequency` — Thematic clustering of anonymized transcripts (weekly LLM analysis)

## Session Object Schema (for Supabase or similar)
```json
{
  "session_id": "string",
  "utm_source": "string",
  "utm_campaign": "string",
  "max_moment_reached": "Ambition|Reality|Friction|Synthesis",
  "friction_theme": "string (AI-extracted)",
  "clicked_lifeline": "boolean",
  "booked_call": "boolean",
  "clicked_share": "boolean"
}
```

## OMTM Phasing
- **Weeks 1-2**: `Completion_Rate` > 30% (does executive finish the diagnostic?)
- **Weeks 3-4**: `Pre_Commitment_Rate` > 5% of completed sessions
- **Weeks 5+**: `Share_Intent_Rate` (viral coefficient)

## A/B Test Variables
- Landing headline: Strategic ("Stop automating the old") vs Pain-focused ("$3M on AI pilots")
- Lifeline CTA: Soft vs Direct framing
- System Prompt Tone: Strategist (ROI/business) vs Operator (team/deployment)
- Lifeline Friction: Immediate calendar vs pre-call form required

## Supabase
- Supabase MCP is connected (`/plugin` authenticated)
- Planned for session logging in Phase 2
