# Research: NullClaw Expert Assessment Proxy

## Decision 1: Proxy Connection Mechanism (WebSocket vs SSE vs Fetch Streaming)
- **Decision**: Server-Sent Events (SSE) or Fetch Streaming for response, standard HTTP POST for sending messages. (Assuming NullClaw exposes streaming via HTTP like OpenAI SDK).
- **Rationale**: WebSockets are bidirectional but can be complex to manage around load balancers and reconnections. Fetch streaming handles LLM token streaming very well out of the box and matches the typical Gemini/OpenAI integration style on modern React frontends.
- **Alternatives considered**: WebSockets (better for true bidirectional real-time, but overkill if the user is submitting discrete messages and waiting for discrete streamed responses). 

## Decision 2: Session Mapping (Storage)
- **Decision**: In-memory mapping or simple Redis store (if deployed horizontally). Given V0.1 scale, an in-memory Map structure in the Node.js process (or lightweight file-backed store if serverless) mapping `browserSessionId` -> `openClawThreadId`.
- **Rationale**: Keeps the architecture simple. If horizontal scaling is needed, Redis is the logical next step, but an in-memory KV or Supabase mapping table works immediately.
- **Alternatives considered**: Storing the `openClawThreadId` directly on the client (risky, exposes internal IDs).

## Decision 3: Telegram Notification
- **Decision**: Standard HTTP POST to `api.telegram.org/bot<TOKEN>/sendMessage`.
- **Rationale**: Extremely simple, doesn't require importing a heavy SDK. Fits right into a background async "fire and forget" task when a session starts.
- **Alternatives considered**: Telegraf library (overkill for just sending outbound push notifications).

## Decision 4: NullClaw Integration
- **Decision**: Use the NullClaw HTTP API (REST) to create sessions and send messages.
- **Rationale**: Standard integration pattern for external agent services. 
- **Alternatives considered**: Direct SDK integration if NullClaw provides a Node.js SDK, but HTTP API is universally supported.
