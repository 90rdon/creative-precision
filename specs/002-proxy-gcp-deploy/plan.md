# Implementation Plan: Secure Gemini Proxy & GCP Cloud Run Deployment

**Branch**: `002-proxy-gcp-deploy` | **Date**: 2026-02-28 | **Spec**: [spec.md](file:///Volumes/9_0rdon-ssd/9_0rdon/Projects/creative-precision/specs/002-proxy-gcp-deploy/spec.md)
**Input**: Feature specification from `/specs/002-proxy-gcp-deploy/spec.md`

## Summary

The core of this feature is to secure the `GEMINI_API_KEY` and protect the proprietary "Creative Precision" logic (system instructions, synthesis prompts, and diagnostic schemas) by transitioning from direct client-side API calls to a server-side proxy architecture. This follows the **"Dumb Frontend"** principle, where the browser is a thin reflection of the AI's logic, and the heavy lifting is handled entirely by a secure Node.js proxy to prevent unauthorized scraping or duplication of the core diagnostic methodology. Furthermore, this adds a **Tiered Memory System** (Redis + Supabase/DB) for robust, high-performance session persistence. This architecture will also serve as a single containerized deployment unit for **GCP Cloud Run**.

## Technical Context

**Language/Version**: Node.js v22 (LTS), TypeScript 5.8
**Primary Dependencies**: 
- **Server**: `express`, `socket.io`, `ioredis`, `@supabase/supabase-js`, `@google/genai`, `dotenv`, `cors`, `helmet` (security)
- **Frontend**: `socket.io-client`, `vite` (ws proxy), `react`
**Storage**: Tiered: Redis (Sessions) + Supabase/PostgreSQL (Archive)
**Testing**: `vitest` (frontend), `supertest` (proxy), `vitest` (backend logic)
**Target Platform**: GCP Cloud Run (Dockerized), Linux/macOS Local
**Project Type**: Full-stack Web Service (Duplex WebSockets + Tiered Persistence)
**Performance Goals**: <20ms duplex latency, <5ms session lookups from Redis
**Constraints**: Zero API keys visible in browser. Secure, persistent server-client link.
**Scale/Scope**: Single Cloud Run instance with auto-scaling (base 2GiB RAM).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Dumb Frontend**: Yes. Client logic is strictly pass-through UI.
- [x] **Security (No Leaks)**: Yes. API key is only accessible on the server.
- [x] **IP Protection**: Yes. Methodology prompts (`systemInstruction`) and Results generation logic are moved to the server to prevent cloning.
- [x] **Authentic Partnership**: Yes. Streaming is forced to ensure the AI feels "alive".
- [x] **Diagnosis over Prescription**: Yes. Synthesis prompt is protected behind the proxy.

## Project Structure

### Documentation (this feature)

```text
specs/002-proxy-gcp-deploy/
├── plan.md              # This file
├── research.md          # Strategy for the proxy and deployment
├── data-model.md        # Payload schemas
├── quickstart.md        # (Generated) Local Dev Setup
├── contracts/           # API Endpoint specifications
└── tasks.md             # Implementation tasks
```

### Source Code

```text
server/                  # NEW: Node.js Proxy Server
├── src/
│   ├── index.ts         # Main Express app + Static server
│   ├── routes.ts        # /api/chat, /api/results, /api/speech
│   └── gemini.ts        # Server-side Gemini integration
├── package.json
└── tsconfig.json

src/                     # React Frontend (Frontend becomes a "view" layer)
├── services/
│   └── geminiService.ts # Refactored: Calls local /api endpoints
├── components/          # Unchanged logic, calls service
└── App.tsx

Dockerfile               # Multi-stage: Build React -> Run Node server
docker-compose.yml       # Local orchestration for testing the container
.env.example             # Documented secret keys
```

**Structure Decision**: A "monolith" container approach. For V0.1, it is highly efficient to have the same Node server serve the static React assets AND act as the API proxy. This simplifies the deployment pipeline to a single Cloud Run service.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [NONE] | | |
