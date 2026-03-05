# Creative Precision: Strategic Project Summary & Synthesis

## 1. Project Purpose, Mission, and Goal
**Project Name:** Creative Precision
**Mission:** To provide a high-signal, zero-pressure diagnostic AI assessment experience for C-suite leaders and executives, helping them identify structural and organizational bottlenecks in their AI adoption journeys.
**Core Goal:** To act as a "Quiet Expert" that delivers an undeniable, "unhinged value" synthesis to executives, entirely free of typical sales jargon. The goal is to provide profound, boardroom-ready insights that naturally lead to a high-intent diagnostic CTA, rather than a hard pitch.

## 2. Marketing DNA & Persona
The entire system is intentionally built around a distinct, high-end, and restrained marketing DNA:
- **The "Quiet Expert" Persona:** The frontline AI (Expert Agent / "Reflect") embodies a consultant who relies on penetrating questions rather than prescriptive answers.
- **Anti-Sales Vocabulary:** Explicitly banned from using words like "synergy," "leverage" (as a verb), "transform," "solution," or "deliverable."
- **Executive Framing:** Operates with extreme brevity (2–4 sentences per turn). It never reveals it is an AI unless explicitly asked.
- **The "Un-Pitch":** Sales language and CTAs are strictly prohibited during the conversational flow. The CTA only appears in the final synthesis, framed as "three paths, zero pressure" (The Diagnostic Call CTA).
- **Dynamic & Authentic Engagement:** The chat avoids rigid scripts. It flows naturally based on the user's responses, utilizing semantic intent detection to navigate topics and waiting for explicit, affirmative user permission before closing the chat to synthesize the report.

## 3. Detailed Approach & Architecture
**Technical Paradigm:** "Dumb Frontend, Smart Prompt" via a Secure Proxy Server.
- **Frontend:** Vite + React + TypeScript acting solely as a renderer. Sessions are maintained via browser `localStorage` to survive page reloads.
- **Backend/Proxy:** Node.js v22 (LTS) designed for deployment on **GCP Cloud Run**. It serves as a secure bridge utilizing bi-directional WebSockets (Socket.io) with JWT-based authentication to prevent unauthorized connection abuse.
- **Intelligence:** Google Gemini API (`@google/genai`) acting as the core LLM engine, completely hidden behind the server to protect proprietary prompts and API keys.
- **Tiered Memory System:**
  - **Redis:** Used for low-latency active session state.
  - **Supabase (PostgreSQL):** Used for long-term telemetry logging and chat history archival (triggered on disconnect + inactivity).

**The Dynamic Diagnostic Conversation Protocol:**
Conversations are configured declaratively in the codebase (via `SOUL.md` and dynamic arrays) rather than hardcoded. The LLM manages the conversational flow across topics:
1. **Stage 1 — Ambition:** Opens with warmth to understand the executive's highest hope for AI.
2. **Stage 2 — Reality:** Pushes into the gap where vision meets friction.
3. **Stage 3 — The System:** Forces a structural lens on human and organizational dynamics.
- **The Explicit Exodus:** The LLM actively asks the user if they are ready for the synthesis (e.g., "Are you ready for me to synthesize our conversation..."). It relies on LLM Semantic Intent Detection rather than brittle string/keyword matching to safely transition to the final report.

**Final Output Schema:**
Returns a JSON object upon session completion containing:
- `synthesis`: Personalized reflection in the user's exact words.
- `bottleneck_diagnosis`: The named structural pattern holding them back.
- `boardroom_insight`: ONE penetrating question the executive should take to their leadership team.
- `diagnostic_call_cta`: The non-pressured closing offer.

## 4. Continuous Monitor, Track, and Learning Adoption Framework (GTM Intelligence Loop)
Creative Precision operates a self-optimizing multi-agent architecture powered by **NullClaw** to continuously adapt to market signals and user friction without farming user data. This orchestrates the "Daily GTM Pulse."

**The Multi-Agent Ecosystem:**
- **The Expert (Reflect):** The frontline conversational interface. As soon as a high-intent session begins, the proxy fires an asynchronous alert to the Admin via Telegram.
- **The Simulator (Red Team):** Generates adversarial personas and complex synthetic scenarios to stress-test the Expert's conversational intelligence, surfacing potential attack vectors and messaging gaps before real users do.
- **The Synthesizer:** Runs async background tasks to analyze real user transcripts extracting `sentiment_score`, `identified_market_trend`, and `gtm_feedback_quote`. It bridges the gap between internal assumptions and empirical user reality.
- **The Engineer (Optimization Engine):** Operates on a 24-hour heartbeat to read Synthesizer and Simulator reports and execute the codebase change management system.

**The 2-Tier Change Management System (Human Veto Safeguard):**
The system distinguishes between safe auto-tuning and core identity shifts:
- **Tier 2 (Minor Changes - Auto-Apply):** Fine-tuning pacing, phrase lists, adversarial personas, or heartbeat frequencies based on Supabase telemetry. The Engineer applies these directly and logs them for revert capability.
- **Tier 1 (Major Changes - Admin Approval Required):** Alterations to the core `SOUL.md` constitution, the 3-Stage Journey, output schemas, or Telegram notification protocols. The Engineer stages a markdown diff and alerts the project lead (Gordon Chan/9_0rdon) via a Telegram bot. **No changes are committed without human authorization.**

**Data Flow & Scheduling Sequence:**
1. **Direct Logging (`assessment_events`):** Frontend UI metrics (clicks, drop-offs, time spent) stream to Supabase.
2. **Synthesis Pipeline (`executive_insights`):** Post-assessment, NullClaw synthesizes the raw transcripts.
3. **Daily Executive Report:** The system aggregates the last 24 hours of intelligence (combining telemetry and Simulator red-team friction) and delivers a consolidated GTM Intelligence Report to the Admin via Telegram by 8:00 AM daily.
