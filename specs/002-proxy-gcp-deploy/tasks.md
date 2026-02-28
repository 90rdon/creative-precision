---
description: "Task list for Refactoring to Gemini Proxy and GCP Cloud Run Deployment"
---

# Tasks: Secure Gemini Proxy & GCP Cloud Run Deployment

**Input**: Design documents from `/specs/002-proxy-gcp-deploy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create the `server/` directory and initialize a basic Node.js project in `server/package.json`
- [x] T002 [P] Configure TypeScript for the backend in `server/tsconfig.json`
- [x] T003 [P] Create a root-level `docker-compose.yml` with `redis` and `postgres` containers for local testing
- [x] T004 [P] Create a `.env.example` documenting `GEMINI_API_KEY`, `REDIS_URL`, and `SUPABASE_URL`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for the proxy and static serving

- [x] T005 Create the base Express server in `server/src/index.ts` with Socket.io integration and static serving from `dist/`
- [x] T006 [P] Configure `vite.config.ts` to proxy WebSocket connections (`ws: true`) to `localhost:3000` during development
- [x] T007 Implement the Socket.io event handler for `chat-message` in `server/src/socket/chat.ts`
- [x] T008 [P] Initialize the `ioredis` client and `supabase-js` client in `server/src/db/`
- [x] T009 Implement the "Quiet Session" service to move inactive sessions from Redis to Supabase
- [x] T010 Implement JWT token generation and Socket.io handshake verification middleware

**Checkpoint**: Foundation ready - duplex communication, tiered storage, and security infrastructure are in place.

---

## Phase 3: User Story 1 - Secure Duplex Logic Proxy (Priority: P1) 🎯 MVP

**Goal**: Move Gemini API keys and proprietary "Creative Precision" logic to the server, using WebSockets for bi-directional streaming.

**Independent Test**: Can be verified by monitoring the WebSockets tab in DevTools and seeing chunks emitted from the server in real-time.

### Implementation for User Story 1

- [x] T011 [US1] Migrate `src/constants.ts` (system instructions) to `server/src/gemini/prompts.ts`
- [x] T012 [US1] Implement real-time Gemini streaming inside a Socket.io event loop in `server/src/gemini/stream.ts`
- [x] T013 [US1] Implement the `request-results` synthesis event on the server using the protected synthesis prompt
- [x] T014 [US1] Implement backend-to-frontend state pushes (e.g., "AI is thinking...") via `socket.emit`
- [x] T015 [US1] Securely initialize the `@google/genai` client on the server using the backend API key

---

## Phase 4: User Story 2 - Seamless Executive Experience (Priority: P2)

**Goal**: Refactor the frontend into a "Dumb" pass-through to the local proxy.

**Independent Test**: The full assessment chat functions identically to the previous version, but all network traffic stays local to the proxy.

### Implementation for User Story 2

- [x] T016 [US2] Refactor `src/services/geminiService.ts` to use `socket.io-client` instead of direct HTTP calls.
- [x] T017 [US2] Update `ChatInterface.tsx` and `Results.tsx` to handle `chat-chunk` and `results-synthesis` events.
- [x] T018 [US2] Remove all `@google/genai` and `constants.ts` imports from the frontend components in `src/` to ensure bundle size reduction and IP protection
- [x] T019 [US2] Verify that the "let me synthesize" signal correctly triggers the backend `request-results` WebSocket event.

---

## Phase 5: User Story 3 - GCP Cloud Run Readiness (Priority: P3)

**Goal**: Containerize the full-stack application and prepare deploy scripts.

**Independent Test**: Build the Docker image and run it with `docker run -p 3000:3000 -e GEMINI_API_KEY=...` and verify the app works.

### Implementation for User Story 3

- [x] T020 [US3] Create a multi-stage `Dockerfile` (Build React -> Build Node -> Node-Alpine Production)
- [x] T021 [P] [US3] Create `scripts/deploy-cloud-run.sh` for one-command deployment to GCP
- [x] T022 [P] [US3] Add a `healthcheck` endpoint to `server/src/index.ts` for Cloud Run readiness probes
- [x] T023 [US3] Final end-to-end verification of the containerized app running locally via `docker-compose up`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T024 [P] Clean up root `node_modules` and `package.json` of backend-only dependencies
- [x] T025 Run local integration tests using `supertest` on the proxy endpoints
- [x] T026 Final validation of `quickstart.md` steps for future developers
- [x] T027 Performance audit of streaming chunks through the proxy layer
- [x] T028 Audit the production bundle for proprietary prompt strings or API key leaks.

---

## Dependencies & Execution Order

1. **Setup (Phase 1)** -> **Foundational (Phase 2)** (Total Blockers)
2. **User Story 1 (P1)**: The Proxy must be functional before the Frontend can be refactored (US2).
3. **User Story 2 (P2)**: Depends on US1 completion.
4. **User Story 3 (P3)**: Can be worked on in parallel with US2 if the basic Story 1 proxy is working.

## Implementation Strategy

### MVP First (User Story 1 & 2 Only)

The primary goal is to hide the API key and logic. 
1. Get the Node server running.
2. Point the Frontend to it.
3. Test if the bot still speaks.
4. **Success!**

### Incremental Delivery

- **Step 1**: Proxying.
- **Step 2**: Logic Migration (prompts to backend).
- **Step 3**: Deployment (Docker/GCP).
