# Data Model: NullClaw Expert Assessment Proxy

Based on FR-004 and the Key Entities from the spec, the system needs to track active assessment sessions associating a front-end browser with an NullClaw execution context.

## 1. AssessmentSession (In-Memory / Redis)

Tracks active visitors connecting to the Expert proxy to ensure page reloads don't break the conversation.

| Field | Type | Description | Required | Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Unique internal identifier (Primary Key equivalent in KV store) | Yes | Auto-generated |
| `browserSessionId` | `string` | The persistent ID stored in the user's `localStorage` | Yes | Unique index |
| `openClawThreadId` | `string` | The ID of the conversation thread on the NullClaw backend | Yes | External reference |
| `createdAt` | `datetime` | When the user first landed and triggered the session | Yes | Immutable |
| `lastActive` | `datetime` | Used for garbage collection / expiring old unused proxy sessions | Yes | Updated on every message |

## 2. AdminAlert Event (Payload to Telegram)

The data structure constructed and fired off asynchronously when a new `AssessmentSession` is instantiated.

| Field | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `session_id` | `string` | The `browserSessionId` (anonymized lead identifier) | Yes |
| `timestamp` | `datetime` | When the session was initialized | Yes |
| `source` | `string` | E.g., "Web Assessment v2" | Yes |
| `status` | `string` | E.g., "Expert Session Started" | Yes |

## 3. ChatMessage (Supabase PostgreSQL)

Persisted historical record of all chat interactions between users and the NullClaw Expert Agent.

| Field | Type | Description | Required | Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Unique identifier for the message | Yes | Primary Key |
| `session_id` | `string` | The `browserSessionId` linking this message to a specific visitor | Yes | Indexed |
| `role` | `string` | "user" or "assistant" | Yes | |
| `content` | `text` | The text content of the message | Yes | |
| `created_at` | `timestamp` | When the message was processed by the proxy | Yes | Default: now() |
