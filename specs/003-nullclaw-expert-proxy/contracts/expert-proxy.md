# Interface Contract: NullClaw Expert Assessment Proxy

## 1. Web to Proxy Interface

The React frontend communicates with the Node.js proxy server via HTTP endpoints.

### 1.1 `POST /api/assessment/init`

Called exactly once when the web page loads (or when `localStorage` has no session) to start a new NullClaw expert thread.

**Request Body (JSON):**
```json
{
  "browserSessionId": "abc-123-optional-if-reconnecting" // If null, the proxy creates fresh.
}
```

**Response Body (JSON):**
```json
{
  "status": "success",
  "sessionId": "abc-123", // Stored in localStorage by client
  "openClawThreadId": "thread_xyz123",
  "message": "Initialized" // Implicitly triggers Telegram notification behind the scenes
}
```

### 1.2 `POST /api/assessment/message` (Stream Mode)

Called every time the user sends a message. The proxy expects the `sessionId` so it knows which NullClaw thread to forward it to.

**Request Body (JSON):**
```json
{
  "sessionId": "abc-123", // Mandatory mapping key
  "content": "Our pipeline is completely stalled at marketing."
}
```

**Response (SSE / Chunked Text Stream):**
The proxy will pipe the response directly from the NullClaw API back as a raw readable stream (Server-Sent Events or Fetch Stream), allowing the frontend to animate the token generation.

## 2. Proxy to NullClaw Interface

The Node.js proxy forwards requests securely to the NullClaw local or remote instance. Let's assume a standard REST integration.

### 2.1 Start Thread
- **Proxy does**: `POST /api/threads` (creating an NullClaw conversation container).
- **Proxy receives**: `thread_id` (Stores mapping of Browser Session ID -> Thread ID).

### 2.2 Send Message & Stream
- **Proxy does**: `POST /api/threads/:thread_id/messages` appending the user's message.
- **Proxy does**: `POST /api/threads/:thread_id/runs` asking NullClaw to stream a response.
- **Proxy receives**: A readable stream of tokens which it pipes straight back to the React client responding to the `POST /api/assessment/message` request above.

## 3. Proxy to Telegram API (Admin Alerts)

### 3.1 Send Message (Bot API)
- **Proxy does**: `POST https://api.telegram.org/bot<TOKEN>/sendMessage`
- **Payload**:
  ```json
  {
    "chat_id": "<ADMIN_CHAT_ID>",
    "text": "🚨 **New VIP Assessment Started**\n\nSession: abc-123 \nStatus: Initializing Expert Mode...",
    "parse_mode": "MarkdownV2"
  }
  ```
- **Execution**: Non-blocking (asynchronous fire-and-forget in Node).
