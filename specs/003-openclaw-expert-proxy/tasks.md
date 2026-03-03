---
description: "Task list for OpenClaw Expert Assessment Proxy"
---

# Tasks: OpenClaw Expert Assessment Proxy

**Input**: Design documents from `/specs/003-openclaw-expert-proxy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the OpenClaw proxy integration.

- [x] T001 Initialize backend routing structure for OpenClaw proxy in `server/src/api/openclaw/proxy.ts` (Note: Updated path from top-level src to server/src)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Implement in-memory session mapping manager (browserSessionId -> openClawThreadId) in `server/src/api/openclaw/sessionManager.ts`
- [x] T003 [P] Implement basic Telegram notification sender in `server/src/api/telegram/bot.ts`
- [x] T004 Build generic OpenClaw HTTP API client wrapper in `server/src/api/openclaw/client.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Seamless Expert AI Assessment (Priority: P1) 🎯 MVP

**Goal**: Executive lands on the site and converses seamlessly with the OpenClaw expert agent via the proxy.

**Independent Test**: Load the assessment site, type a message, and verify a response from the OpenClaw agent streams back visually without reloading.

### Implementation for User Story 1

- [x] T005 [US1] Implement `POST /api/assessment/init` endpoint mapping browser session to an OpenClaw thread in `server/src/api/openclaw/proxy.ts`
- [x] T006 [US1] Implement `POST /api/assessment/message` endpoint forwarding user message to OpenClaw in `server/src/api/openclaw/proxy.ts`
- [x] T007 [US1] Add SSE / Fetch streaming response logic to `POST /api/assessment/message` inside `server/src/api/openclaw/proxy.ts`
- [x] T008 [P] [US1] Refactor `src/components/chat/ChatInterface.tsx` (Note: in `src/components/ChatInterface.tsx`) to handle `localStorage` session persistence (`browserSessionId`)
- [x] T009 [US1] Update `src/components/chat/ChatInterface.tsx` (Note: in `src/components/ChatInterface.tsx`) to utilize Fetch API with streaming responses instead of generic SDK methods

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Streaming chat should work.

---

## Phase 4: User Story 2 - Admin Lead Notification (Priority: P2)

**Goal**: Keep the Admin constantly informed via Telegram when high-value leads initiate an assessment.

**Independent Test**: Trigger a new session in the web app and verify a fast Telegram ping with session ID details shows up for the Admin.

### Implementation for User Story 2

- [x] T010 [P] [US2] Construct formatting utility for `AdminAlert` payload in `server/src/api/telegram/formatters.ts`
- [x] T011 [US2] Update `POST /api/assessment/init` in `server/src/api/openclaw/proxy.ts` to asynchronously dispatch the Telegram alert via `server/src/api/telegram/bot.ts` without blocking the HTTP response

**Checkpoint**: User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and edge cases

- [x] T012 [P] Implement thinking/typing UI indicator ("The Expert is analyzing...") in `src/components/ChatInterface.tsx`
- [x] T013 Add error handling and timeout fallbacks for OpenClaw gateway connection in `server/src/api/openclaw/proxy.ts`
- [x] T014 Run validation of `quickstart.md` locally to finalize feature implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - relies on the `init` endpoint from US1 being present, but logic is independent.

### Parallel Opportunities

- Foundation tasks T003 and T002 can be implemented in parallel.
- Frontend modifications in US1 (T008) can happen alongside backend routing changes (T005, T006).
- Telegram formatting (T010) and UI polling (T012) can run parallel to their respective backend flows.
