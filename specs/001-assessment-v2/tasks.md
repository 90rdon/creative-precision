# Tasks: AI Assessment Build Out (v2)

**Input**: Design documents from `.specify/memory/Claude-plan.md` and `.specify/memory/plan.md`

## Phase 1: Type System Foundation (US1)

**Goal**: Establish the fundamental types for the 7-Moment Journey, Results Schema, and Telemetry events.

- [x] T001 [US1] Define `MomentStage`, update `AnalysisResult` with 4-section schema, and add telemetry types (`SessionData`, `AssessmentEvent`) in `src/types.ts`

---

## Phase 2: System Prompt Rewrite (US2)

**Goal**: Encode the 7-Moment conversational flow and behavioral posture into the Gemini system prompt.

- [x] T002 [US2] Rewrite `initialGreeting` and `systemInstruction` with the 7-moment matrix in `src/constants.ts`
- [x] T003 [US2] Define `CLOSE_SIGNAL_PHRASES` array for detection in `src/constants.ts`

---

## Phase 3: Telemetry Infrastructure (US3)

**Goal**: Set up tracking and analytics foundation (Graceful degradation).

- [x] T004 [US3] Add `@supabase/supabase-js` dependency in `package.json`
- [x] T005 [P] [US3] Create Supabase client and export telemetry methods (`initSession`, `updateSession`, `trackEvent`) in `src/services/telemetryService.ts`

---

## Phase 4: Results Generation & Prompt (US4) 🎯 PARTIAL MVP FIX NEEDED

**Goal**: Update the Gemini interaction to enforce the new structured JSON output and ensure accurate template matching.

- [x] T006 [P] [US4] Update `generateResults` prompt to enforce 4-section output and `responseSchema` in `src/services/geminiService.ts`
- [x] T007 [US4] Implement strict exact-matching rules for the `template_recommendation` (Governance Fabric, Strategic Review, Experimental Framework) in `src/services/geminiService.ts`

---

## Phase 5: Voice Chat Interface Updates (US5) 🎯 PARTIAL MVP FIX NEEDED

**Goal**: Bring the UI to v2 standards, detect the 7-Moment close signal, and safely transition without audio/voice collisions.

- [x] T008 [US5] Implement Moment 7 close signal detection and 3s auto-transition logic in `src/components/ChatInterface.tsx`
- [x] T009 [US5] Add `onTrackEvent` telemetry calls for messages sent and assessment completion in `src/components/ChatInterface.tsx`
- [x] T010 [US5] Explicitly halt STT (`stopListening`) and clear pending TTS queues (`audioQueueRef.current = []`) during the "Synthesis" auto-transition to prevent audio collisions in `src/components/ChatInterface.tsx`

---

## Phase 6: Results Page Redesign (US6)

**Goal**: Switch from a 2x2 grid to a beautifully padded editorial scroll presentation of the reflection.

- [x] T011 [US6] Complete redesign of the layout to the 4-section editorial scroll format in `src/components/Results.tsx`
- [x] T012 [P] [US6] Implement text-based Strategic Brief "Download" and "Share" copy-link functionality in `src/components/Results.tsx`
- [x] T013 [P] [US6] Add `onTrackEvent` telemetry events for viewing results, PDF downloads, and lifeline clicks in `src/components/Results.tsx`

---

## Phase 7: App Wiring & Polish (US7)

**Goal**: Tie the chat, results, and telemetry together in the main state machine.

- [x] T014 [US7] Wire up `initSession`, `beforeunload` abandonment tracking, and prop-drilled event handlers in `src/App.tsx`
