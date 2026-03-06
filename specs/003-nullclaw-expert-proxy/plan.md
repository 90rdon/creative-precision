# Implementation Plan: NullClaw Expert Assessment Proxy

**Branch**: `003-nullclaw-expert-proxy` | **Date**: 2026-03-01 | **Spec**: [specs/003-nullclaw-expert-proxy/spec.md](spec.md)
**Input**: Feature specification from `specs/003-nullclaw-expert-proxy/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Connect AI assessment on the site pages directly to the NullClaw Expert agent via a Node.js proxy server. The architecture is a "Dumb Frontend, Smart Backend" proxy bridging the web browser purely to the NullClaw intelligence.

## Technical Context

**Language/Version**: Node.js v22 (LTS), TypeScript 5.8
**Primary Dependencies**: React (Frontend), Express/Fastify (Proxy), NullClaw HTTP API, Telegram Bot API, Supabase Client
**Storage**: In-Memory object or Redis mapping key-value for sessions, Supabase (PostgreSQL) for chat history
**Testing**: Vitest for unit tests of proxy routing logic
**Target Platform**: Web (Vite) + Node (Backend)
**Project Type**: Fullstack React app communicating with Proxy Backend coordinating external APIs
**Performance Goals**: <500ms initial TTFB (Time To First Token) for chat proxying
**Constraints**: Stateless web frontend, completely session-dependent backend
**Scale/Scope**: < 100 concurrent VIP users (V0.1 alpha launch)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Authentic Partnership**: Addressed. Eliminates robotic transitions. The user lands straight into the smart Expert intelligence.
- **Value Before Pitch**: Addressed. Delivers instant strategic insight without logging in.
- **Dumb Frontend, Smart Prompt**: Addressed. The frontend simply plays out HTTP responses, all logic lives in the Agent prompt via the Proxy.
- **Continuous GTM Synthesis**: Telemetry tracking signals logic added via the background Telegram alerting Admin path.

## Project Structure

### Documentation (this feature)

```text
specs/003-nullclaw-expert-proxy/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── api/             # Existing backend logic for proxy
│   ├── nullclaw/    # Integration logic with NullClaw API
│   │   └── proxy.ts # New proxy routing
│   └── telegram/
│       └── bot.ts   # HTTP Callouts to Admin
├── components/      # React UI
│   └── chat/        # Updating chat to accept fetch streaming instead of basic SDK usage
└── data/            # Local mappings or Redis client
```

**Structure Decision**: Monorepo standard split. Extending current `src/api` with proxy methods and tweaking the existing `src/components/chat` to consume streaming REST responses properly instead of SDK calls.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| In-Memory Session Storage | We need rapid prototyping. PostgreSQL setup delay is too high right now | Storing raw thread IDs on the client side is insecure. Simple memory map string-to-string handles V0.1 loads perfectly. |
| Supabase Dependency | Need permanent storage for tracking and audit. | File-based logging is too difficult to query and dashboard later. |
