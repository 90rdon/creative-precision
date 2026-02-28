# Feature Specification: Secure Gemini API Proxy & GCP Cloud Run Deployment

**Feature Branch**: `002-proxy-gcp-deploy`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "proceed with the proxy, and build a gcp cloud run deploy in mind. but before we make changes and implementation, lets buld this via a new spec"

## Summary

The core of this feature is to secure the **Gemini API Key** and protect the proprietary **"Creative Precision" diagnostic logic** by refactoring the application into a server-side proxy architecture. All system instructions, synthesis prompts, and diagnostic schemas will be moved to the backend to prevent scrapers or users from duplicating the methodology.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure API Key Handling (Priority: P1)

As a developer, I want all Gemini API calls to be proxied through a server-side endpoint so that the API key is never exposed to the frontend browser environment or source code.

**Why this priority**: Protecting the Gemini API key is a critical security requirement. Leaking the key allows unauthorized usage and potential service suspension.

**Independent Test**: Can be tested by inspecting the browser's Network tab and verifying that no calls are made directly to `generativelanguage.googleapis.com`, but rather to a local relative path like `/api/chat`.

**Acceptance Scenarios**:

1. **Given** a valid API key in `.env`, **When** the chat assessment is initiated, **Then** all generative AI calls are routed through a server-side proxy.
2. **Given** a compiled production bundle, **When** searching for the API key value, **Then** no occurrences are found in the client-side JavaScript.

---

### User Story 2 - Seamless Executive Experience (Priority: P2)

As an executive user, I want the assessment chat to function securely and reliably without any visible change in behavior, even as the backend architecture evolves.

**Why this priority**: Maintains the "Quiet Expert" trust-based relationship. Infrastructure changes shouldn't degrade the perceived speed or reliability of the assessment.

**Independent Test**: Performing a full assessment from Ambition to Results using the proxied architecture.

**Acceptance Scenarios**:

1. **Given** the proxy is active, **When** I send a message, **Then** I receive a response with the same latency and quality as the direct connection.
2. **Given** the proxy is active, **When** the synthesis phase is triggered, **Then** the JSON results are generated and displayed correctly.

---

### User Story 3 - GCP Cloud Run Readiness (Priority: P3)

As a DevOps engineer, I want the application and proxy to be containerized and deployable to GCP Cloud Run so that we have a scalable and secure production environment.

**Why this priority**: Essential for the transition from local development to a public "V0.1" launch on a professional infrastructure.

**Independent Test**: Building the Docker image and running it locally to verify all application features work inside the container.

**Acceptance Scenarios**:

1. **Given** the project root, **When** I run the build command, **Then** a Docker image is created containing both the frontend assets and the proxy server.
2. **Given** the Docker image is running, **When** environment variables for the API key are provided, **Then** the service starts and handles assessment requests correctly.

---

### Edge Cases

- **Large Transcripts**: What happens when the chat history exceeds typical HTTP header or body limits in the proxy?
- **Streaming Timeout**: How does the system handle long-running generation requests via the proxy?
- **Key Rotation**: How quickly can the system pick up a new API key without a full rebuild?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a server-side proxy endpoint (e.g., `/api/chat`) for all Gemini API interactions.
- **FR-002**: Frontend MUST communicate ONLY with the server-side proxy, never directly with Google's API.
- **FR-003**: System MUST securely load the API key from environment variables on the server only.
- **FR-004**: System MUST support local development via a Vite proxy or a local Node.js server.
- **FR-005**: System MUST include a Dockerfile suitable for deployment to GCP Cloud Run.
- **FR-006**: System MUST support bi-directional, duplex streaming via WebSockets (Socket.io) instead of traditional HTTP requests.
- FR-007**: System MUST provide static file serving for the React frontend from the same server instance.
- **FR-008**: System MUST isolate and protect all proprietary AI instructional logic (prompts/schema) within the server-side environment.
- **FR-009**: System MUST authenticate persistent WebSocket connections using a JWT-based handshake to prevent unauthorized proxy usage.
- **FR-010**: System MUST implement tiered session memory: Redis for active low-latency access, and database persistence (Supabase) for long-term history recovery.

## Clarifications

### Session 2026-02-28
- Q: How should the WebSocket connection be authenticated? → A: JWT-based handshake (Token in query/header).
- Q: Should the backend server persist the chat state? → A: Tiered memory: Redis for active sessions, Database for long-term persistence and full history recovery.
- Q: What event should trigger the transition to Long Persistence? → A: Hybrid: Immediate on Disconnect + 30m Inactivity Timeout.

### Key Entities

- **Gemini Proxy**: The server-side component (Node.js/Express or similar) that attaches the API key and forwards requests.
- **Client Messenger**: The updated `ChatInterface` and `geminiService` that point to local relative URLs.
- **Environment Context**: The secure container environment (local or Cloud Run) where secrets are stored.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0% of frontend JavaScript bundles contain the literal string value of the `GEMINI_API_KEY`.
- **SC-002**: 100% of chat interactions (Ambition, Reality, Friction) function correctly through the proxy.
- **SC-003**: Generating a production-ready container image takes less than 5 minutes on a standard developer machine.
- **SC-004**: System handles up to 50 concurrent assessment chat sessions on a base Cloud Run instance (2GiB RAM / 1 vCPU).
