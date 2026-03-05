# Continuous GTM Synthesis

## Principles
1. **Intelligent Tracking without Data Farming**: We monitor behavior (drop-offs, share clicks) and conversation sentiment strictly to improve the product and GTM narrative, never to sell data.
2. **Two-Tier System**: 
   - NullClaw runs background tasks to adapt the general marketing vectors, tool parameters, or conversation styles implicitly.
   - Any proposed changes to the core `SOUL.md` require explicit human review via the **Daily GTM Intelligence Report**.

## Architecture & Data Flow

1. **User Interaction**: Users go through the AI assessment via the frontend. The `GuardedProxy` ensures safety and limits interaction scope.
2. **Direct Logging (`assessment_events`)**: The frontend telemetry (button clicks, time on page) drops straight into Supabase via standard API calls.
3. **Synthesis & Strategy Pipeline (`executive_insights`)**: Once an assessment is finished, the GuardedProxy spawns an async NullClaw task. 
   - NullClaw analyzes the transcript.
   - It extracts `sentiment_score`, `identified_market_trend`, and a raw `gtm_feedback_quote` (the user's exact phrasing of their pain).
   - This data is logged to Supabase for analysis.
4. **Market Sensing (`market_signals`)**: NullClaw uses background tools to scrub the web and news, contextualizing the internal insights with external sentiment, keeping its conversational capability hyper-relevant.

## Operating the Loop
Every morning, run the automated generator script (WIP) to aggregate the previous 24 hours of logs. NullClaw will synthesize the `executive_insights` and `market_signals` into a consolidated markdown report on whether the `SOUL.md` or landing page copy needs adjusting.

**Delivery**:
- **To Admin**: The consolidated report and any critical alerts are pushed to the **Telegram bot**.
- **To Users**: The results of these refinements are implicitly delivered through updated landing page copy and improved conversational logic in the web-based `assessment.html`.
