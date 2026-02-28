# API Contracts: WebSocket Chat Service (Socket.io)

## Namespace: `/`

All assessment chat logic and results synthesis are handled through a persistent WebSocket connection.

### Client-to-Server Events

#### `chat-message`
Sent when the user sends a message.
```json
{
  "messages": [
    { "role": "user", "text": "I want to improve operational efficiency." }
  ]
}
```

#### `request-results`
Sent when the frontend detects the synthesis signal (Stage 3 complete).
```json
{
  "history": [...]
}
```

### Server-to-Client Events

#### `chat-chunk`
Emitted as Gemini generates the response.
```json
{
  "chunk": "Based on...",
  "done": false
}
```

#### `results-synthesis`
Emitted when the strategic reflection is complete.
```json
{
  "heres_what_im_hearing": "...",
  "pattern_worth_examining": "...",
  "question_to_sit_with": "...",
  "the_close": { ... }
}
```

#### `voice-response`
Emitted when audio data is ready for playback.
```json
{
  "audio": "base64_binary_data"
}
```

#### `state-update` (Duplex Focus)
Sent by the backend to push changes or "thinking" indicators.
```json
{
  "type": "thinking" | "stage_transition" | "error",
  "payload": { ... }
}
```
