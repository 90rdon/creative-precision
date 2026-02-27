Here is Claude's plan:                                                                                                                                                                                                                                                                                        
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Implementation Plan: Reflect AI Assessment v2 — Full 7-Moment Flow                                                                                                                                                                                                                                            
                                                            
 Context                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                               
 Creative Precision's "Reflect" AI Assessment is an executive diagnostic tool for CEOs/CTOs stuck in AI pilot purgatory. The current implementation has a working chat with voice/TTS but uses a simplified 4-stage conversation flow. The Assessment Spec v1 (in examples/docs/) defines a richer 7-Moment    
 conversational journey with a redesigned results page and scientific telemetry.                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                               
 What prompted this: The foundational docs (soul.md, constitution.md) are philosophically coherent with the spec docs, but the codebase hasn't caught up. The system prompt is too thin (4 stages, 24 lines), the results schema doesn't match the spec's 4-section format, and telemetry is console.log only. 
  We need to bring the product experience up to spec quality — the "$50k insight" standard.

 Intended outcome: A complete, production-quality assessment experience where the AI guides executives through 7 moments of discovery, produces results worth sharing at a board meeting, and tracks the scientific funnel from first click to lifeline pull.                                                  
                                                                                                                                                                                                                                                                                                               
 ---                                                                                                                                                                                                                                                                                                           
 Phase 1: Type System Foundation                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                               
 File: src/types.ts                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                               
 1. Add isStreaming?: boolean to Message interface (fixes existing TypeScript bug — ChatInterface.tsx already uses it)                                                                                                                                                                                         
 2. Add MomentStage type: 'ambition' | 'reality' | 'friction' | 'human_element' | 'measurement_gap' | 'vision' | 'close' | 'results'                                                                                                                                                                           
 3. Replace AnalysisResult with new 4-section schema:                                                                                                                                                                                                                                                          
   - heres_what_im_hearing: string — personalized synthesis in their language                                                                                                                                                                                                                                  
   - pattern_worth_examining: string — named pattern, no mechanism explained                                                                                                                                                                                                                                   
   - question_to_sit_with: string — single provocative question (highest-value deliverable)                                                                                                                                                                                                                    
   - the_close: { sit_with_it, keep_thinking, real_conversation } — three pathways, no pitch                                                                                                                                                                                                                   
   - template_recommendation?: { tier, name, reason } — optional, appears AFTER all value                                                                                                                                                                                                                      
 4. Add SessionData and AssessmentEvent types for Supabase telemetry                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                               
 ---                                                                                                                                                                                                                                                                                                           
 Phase 2: System Prompt Rewrite (THE BRAIN)                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                               
 File: src/constants.ts                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                               
 This is the most critical change. The current prompt is a 24-line sketch. The new prompt encodes the full 7-Moment journey as behavioral rules the AI follows invisibly.                                                                                                                                      
                                                                                                                                                                                                                                                                                                               
 New initialGreeting:                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                               
 "Most AI conversations start with what you're building. I'd rather start with what you're hoping it does. What's the biggest thing you're hoping AI will do for your organization?"                                                                                                                           
                                                                                                                                                                                                                                                                                                               
 (This IS Moment 1's question. Softer than current opener which jumps to friction.)                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                               
 New systemInstruction structure:                                                                                                                                                                                                                                                                              

 A. Identity & Posture
 - You are Reflect — a strategic thinking partner (not consultant, not coach, not vendor)
 - ANTI-FLUFF: Push back on buzzwords. "What does 'transformative' mean in your specific context?"
 - GUIDE NOT GURU: "I don't know everything. Let's figure this out."
 - Speak to ROI, margins, competitive risk — never abstract AI hype
 - Conversational, not corporate. Like a peer over coffee.

 B. The 7-Moment Journey (managed invisibly — never announce moments)

 ┌────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┬──────────────────────────────┐
 │         Moment         │                                       Core Question                                       │                                  Key Follow-up                                  │                       Guardrail                        │       Move-on Trigger        │
 ├────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┼──────────────────────────────┤
 │ 1. Ambition            │ "What's the biggest thing you're hoping AI will do?"                                      │ "When you picture success 18 months out, what metric has moved?"                │ —                                                      │ Specific outcome named       │
 ├────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┼──────────────────────────────┤
 │ 2. Reality             │ "How would you describe the gap between that vision and where things stand?"              │ Push for what was tried, what stalled                                           │ —                                                      │ Gap is clear                 │
 ├────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┼──────────────────────────────┤
 │ 3. Friction            │ "When your org tries to move AI from experiment to production — where does it get stuck?" │ Force distinctions: "Is it the reviews or the lack of a framework for reviews?" │ NO HINTS about governance/frameworks/solutions         │ Structural bottleneck named  │
 ├────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┼──────────────────────────────┤
 │ 4. Human Element       │ "How is your workforce responding to AI? Where energy, where resistance?"                 │ "What does silence mean?" (NOBODY ELSE ASKS THIS)                               │ —                                                      │ Human dynamics surfaced      │
 ├────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┼──────────────────────────────┤
 │ 5. Measurement Gap     │ "When your board asks 'is our AI investment working?' — what's your honest answer?"       │ "What would you need to see to feel confident?"                                 │ Reveal circular ROI dependency, don't solve it         │ Measurement gap acknowledged │
 ├────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┼──────────────────────────────┤
 │ 6. Vision (Magic Wand) │ "If you had a magic wand and could fix one thing overnight — what would it be?"           │ "What's standing between you and that right now?"                               │ NO INTERPRETATION of their answer                      │ Constraint named             │
 ├────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┼──────────────────────────────┤
 │ 7. Close               │ "Thank you. Give me a moment to synthesize what you've shared."                           │ —                                                                               │ Include phrase "let me synthesize" (detection trigger) │ Auto-transition to results   │
 └────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────┴──────────────────────────────┘

 C. Behavioral Rules
 - ONE question at a time. Never multi-part.
 - PAS pattern embedded: diagnose pain before offering clarity
 - User must feel THEY discovered the insight (Cialdini reciprocity)
 - Reflect patterns, never prescribe solutions
 - If executive gives short/dismissive answers, acknowledge and ask a sharper version
 - Average conversation: 10-14 messages (5-7 exchanges)

 D. Close Signal
 Define CLOSE_SIGNAL_PHRASES constant for ChatInterface detection: ['let me synthesize', 'give me a moment to synthesize', 'i have what i need']

 ---
 Phase 3: Results Generation Update

 File: src/services/geminiService.ts

 Update generateResults():

 1. Replace the prompt to produce the new 4-section schema
 2. Results prompt must instruct the AI to:
   - Section 1: Use the executive's exact words. Mirror, don't interpret.
   - Section 2: Name the pattern without explaining the mechanism. Create curiosity.
   - Section 3: Synthesize ONE question from their specific answers. "$50k insight" standard.
   - Section 4: Three pathways — sit with it / keep thinking / real conversation. No pitch language.
 3. Add responseSchema to the Gemini config for structured JSON enforcement (prevents malformed output)
 4. Include template tier information in the prompt for optional template_recommendation matching: 
   - Match "Governance Fabric" if friction is structural or regulatory.
   - Match "Strategic Review" if ambition and vision are misaligned with baseline reality.
   - Match "Experimental Framework" if stuck in "pilot purgatory" without valid data loops.

 ---
 Phase 4: Chat Interface Updates

 File: src/components/ChatInterface.tsx

 1. Auto-detect Moment 7 close signal: After streaming completes, check if model message contains close signal phrase → auto-transition to results after 3s delay
 2. Remove "Generate Assessment" button: Replace with subtle fallback link visible after 12+ messages (escape hatch)
 3. Add telemetry props: Accept sessionId and onTrackEvent callback, emit events at: message_sent, ai_responded, assessment_complete
 4. DO NOT refactor voice/TTS pipeline logic, but DO ensure the "Synthesis" auto-transition (Step 1) programmatically disables active STT listeners and cancels pending TTS queues to prevent audio collisions during the 3s window.

 ---
 Phase 5: Results Page Redesign

 File: src/components/Results.tsx

 Complete redesign from grid layout to editorial scroll experience:

 "Your Reflection" header
 ---
 Section 1: "Here's What I'm Hearing"  (serif, large, quoted feel)
 ---
 Section 2: "A Pattern Worth Examining" (left accent bar, subtle card)
 ---
 Section 3: "A Question to Sit With"    (LARGEST type, centered, hero element)
 ---
 Section 4: "What Now?" (three pathways)
   [Sit With It]     [Keep Thinking]     [Real Conversation]
   Take to team      LinkedIn follow     Calendar link (not a pitch)
 ---
 Optional: Template Recommendation (subtle, AFTER all value)
 ---
 Footer: Share / Download / New Session

 Key details:
 - "Question to Sit With" gets largest visual weight — it's the most shareable element
 - Share copies the question + URL with ?utm_source=viral_share
 - Download generates a text-based Strategic Brief of all 4 sections
 - CTA is soft: "Not a pitch, not a demo — just a thinking partner"
 - Update fallback result to match new schema
 - Accept sessionId and onTrackEvent props, track: results_viewed, lifeline_clicked, share_clicked, pdf_downloaded

 ---
 Phase 6: Supabase Telemetry

 6a: New file src/services/telemetryService.ts

 - Install @supabase/supabase-js
 - Create Supabase client from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 - Exports: initSession(), updateSession(), trackEvent()
 - All calls fire-and-forget (no await in UI flow), wrapped in try/catch
 - Graceful degradation: if env vars missing, all functions silently no-op

 6b: Create database tables (via Supabase MCP)

 - assessment_sessions table (session_id PK, UTM fields, max_moment_reached, completion_status, message_count, friction_theme, clicked_lifeline, clicked_share, booked_call, downloaded_pdf, duration_seconds)
 - assessment_events table (id UUID, session_id FK, event_type, event_data JSONB, created_at)
 - RLS enabled, anon insert/update policies only (no client-side reads)

 6c: Wire into App.tsx

 - Call initSession() on mount with UTM data
 - Create handleTrackEvent() callback, pass to ChatInterface and Results
 - Add beforeunload listener: update session as 'abandoned' if not completed
 - Track session duration via useRef(Date.now())

 ---
 Execution Order

 Phase 1 (types.ts)        ← Do first, no dependencies
   ↓
 Phase 2 (constants.ts)  \
 Phase 3 (geminiService)   } Can run in parallel (separate files)
 Phase 6a-b (telemetry)  /
   ↓
 Phase 4 (ChatInterface)   ← Depends on Phase 2 close signal design
 Phase 5 (Results.tsx)      ← Depends on Phase 3 new schema
   ↓
 Phase 6c (App.tsx wiring)  ← Depends on 4, 5, 6a

 ---
 Files to Modify

 ┌──────────────────────────────────┬──────────────────────────────────────────────────────┬────────────────────┐
 │               File               │                        Change                        │      Priority      │
 ├──────────────────────────────────┼──────────────────────────────────────────────────────┼────────────────────┤
 │ src/types.ts                     │ New AnalysisResult, isStreaming fix, telemetry types │ Phase 1            │
 ├──────────────────────────────────┼──────────────────────────────────────────────────────┼────────────────────┤
 │ src/constants.ts                 │ Full 7-Moment system prompt + initial greeting       │ Phase 2 (critical) │
 ├──────────────────────────────────┼──────────────────────────────────────────────────────┼────────────────────┤
 │ src/services/geminiService.ts    │ New results prompt + responseSchema                  │ Phase 3            │
 ├──────────────────────────────────┼──────────────────────────────────────────────────────┼────────────────────┤
 │ src/components/ChatInterface.tsx │ Close signal detection, remove button, telemetry     │ Phase 4            │
 ├──────────────────────────────────┼──────────────────────────────────────────────────────┼────────────────────┤
 │ src/components/Results.tsx       │ Complete redesign to 4-section editorial format      │ Phase 5            │
 ├──────────────────────────────────┼──────────────────────────────────────────────────────┼────────────────────┤
 │ src/services/telemetryService.ts │ NEW: Supabase client + event tracking                │ Phase 6a           │
 ├──────────────────────────────────┼──────────────────────────────────────────────────────┼────────────────────┤
 │ src/App.tsx                      │ Wire telemetry, pass props, beforeunload handler     │ Phase 6c           │
 ├──────────────────────────────────┼──────────────────────────────────────────────────────┼────────────────────┤
 │ package.json                     │ Add @supabase/supabase-js dependency                 │ Phase 6a           │
 └──────────────────────────────────┴──────────────────────────────────────────────────────┴────────────────────┘

 ---
 Verification Plan

 1. Type check: npm run lint (tsc --noEmit) passes with no errors
 2. Dev server: npm run dev starts without errors
 3. 7-Moment flow test: Start assessment, verify AI follows all 7 moments in natural order
 4. Close signal test: Verify auto-transition to results when AI says "let me synthesize"
 5. Results schema test: Verify all 4 sections render with correct editorial layout
 6. Fallback test: Verify results display graceful fallback if Gemini returns malformed JSON
 7. Telemetry test: Check Supabase tables for session creation, event logging, UTM capture
 8. Voice regression test: Verify TTS and speech recognition still work end-to-end
 9. Share/Download test: Verify copy-link and text download functionality
 10. No-Supabase test: Remove env vars, verify app works without telemetry (graceful degradation)

 ---
 Risks & Mitigations

 ┌─────────────────────────────────────┬───────────────────────────────────────────────────────────────────────┐
 │                Risk                 │                              Mitigation                               │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ Close signal detection is fragile   │ Multiple phrase variants + fallback link after 12 messages            │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ Long system prompt degrades quality │ Test incrementally; Gemini handles long prompts well                  │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ Voice/TTS regression                │ Don't touch the voice pipeline (self-contained in ChatInterface)      │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ Supabase env vars missing in prod   │ Telemetry gracefully no-ops if client not initialized                 │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ AI synthesis feels generic          │ "$50k insight" standard in prompt; test with real executive scenarios │
 └─────────────────────────────────────┴───────────────────────────────────────────────────────────────────────┘

 Out of Scope (Future)

 - API key security (backend proxy) — noted, separate effort
 - PDF Strategic Brief (formatted, 4-page) — text download for now
 - LinkedIn OAuth — V2
 - 48-hour follow-up email — V2
 - Persistent accounts / retake-and-compare — V2