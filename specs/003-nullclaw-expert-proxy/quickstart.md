# Quickstart: Testing the NullClaw Expert Assessment Proxy

This feature bridges the React frontend to the NullClaw agent backend using a Node.js proxy server.

### Prerequisites (Local Env)
- Node.js running (`npm run dev`) for both frontend and proxy.
- NullClaw running locally (accessible via its HTTP API endpoint).
- A `.env` file containing your Telegram Bot Token and Admin Chat ID.

### Steps to Verify

1. **Start the local cluster**:
   Make sure all services are running: `npm run dev` in your main creative-precision codebase.
   Ensure NullClaw is running and reachable.

2. **Trigger the UI**:
   Navigate to the assessment page (e.g. `localhost:3000/assessment`).
   Start the assessment. Or, if it triggers automatically on load, monitor the network tab in your browser.

3. **Check the Proxy Mapping (Session)**:
   Verify the browser made a `POST /api/assessment/init` request.
   Check your browser's Developer Tools -> Application -> `localStorage`. There should be an active `sessionId`.
   Verify the Node proxy logged that it successfully retrieved an `openClawThreadId`.

4. **Verify Admin Telegram Alert**:
   Check your Telegram "Admin" group or direct message.
   You should instantly see a message: `🚨 New VIP Assessment Started...`

5. **Test Seamless Streaming**:
   Type a message into the assessment chat window.
   Watch the network tab for a payload streaming back via Server-Sent Events or Fetch chunks.
   Observe the characters visually updating in the React chat bubble in real-time.
   Refresh the page. Wait for the state to reload. It should fetch your `sessionId` from `localStorage` and reconstruct the chat history from the same NullClaw thread.
