## Decision: Socket.io for Duplex Communication

### Rationale
- **SSE vs. WebSocket**: While SSE is great for one-way streaming, the requirement for "duplex-like communication" where backend changes are pushed instantly to the frontend makes **WebSockets** (specifically **Socket.io**) the better choice.
- **Bi-directional**: Allows the frontend to send a message and the backend to "emit" chunks of the response, state changes, or even "thinking" indicators without the client polling or opening new request cycles.
- **Resilience**: Socket.io provides automatic reconnections and fallback transports if a WebSocket connection is blocked by a proxy, which is common in corporate executive environments.
- **Real-time Synchronization**: Any configuration or state changes on the server (like the AI moving through stages) can be pushed to the client instantly.

## Decision: Vite Dev Proxy + Express with Socket.io

### Rationale
- **Development**: The Vite server must be configured to proxy WebSocket connections (`ws: true`) to the Node.js backend.
- **Production**: Socket.io integrates cleanly with the existing Express server architecture.
- **Architecture**: Move from a request-response `/api/chat` to a persistent socket namespace.

## Decision: Tiered Session Memory (Redis + Supabase/DB)

### Rationale
- **Performance vs. Persistence**: To achieve "Executive speed" while maintaining a "Constant Thought Partner" relationship, we need a two-tier storage layer.
- **Tier 1 (Hot Data)**: **Redis** will hold current active WebSocket sessions (transcripts, model states). This allows sub-millisecond lookups for duplex communication without hitting the primary DB on every message chunk.
- **Tier 2 (Cold/Archival Data)**: **Supabase (PostgreSQL)** will store completed or "quiet" sessions forever. 
- **The "Quiet Protocol"**: When a WebSocket disconnects or a 30-minute inactivity threshold is reached, the backend will serialize the Redis session and synchronously push it to the Database for long-term record-keeping.
- **State Hydration**: On a new JWT-authenticated handshake, the server will check Tier 1 first, then Tier 2 to rebuild the user's conversational context seamlessly.

### Rationale
- We need to build the React application into static assets and then copy them into a Node.js runtime environment that runs the Express proxy.
- **Stage 1**: Build React app using Vite (`npm run build`).
- **Stage 2**: Lightweight Node-alpine image, copy `dist/`, install only production dependencies, and run `index.js` (the proxy + static server).

## Decision: Gemini Streaming over Proxy

### Rationale
To maintain the "Executive" feel (perceived speed), we must not buffer the Gemini response. 
The proxy will:
1. Receive a POST request with chat history.
2. Call Gemini API.
3. Stream the response chunks directly to the client as they arrive from Google.
