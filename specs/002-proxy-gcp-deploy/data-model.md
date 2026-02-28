## ChatSession (Client-Proxy)
- `history`: `Message[]` (The full conversation transcript)
- `config`: `AppConfig` (Model name, system instructions - optional if hardcoded on server for safety)

## Persistent Entities

### Redis Session (Tier 1: Hot)
- **Key**: `session:{session_id}`
- **Value**: JSON string of `ChatSession`
- **TTL**: 1 hour (auto-expiring for memory efficiency)

### Supabase Session (Tier 2: Cold/Archive)
- **Table**: `assessment_sessions`
- **Columns**:
  - `id`: UUID (Primary Key)
  - `user_id`: UUID (Foreign Key to users)
  - `transcript`: JSONB (The full `Message[]` array)
  - `summary`: Text (AI-generated synthesis)
  - `status`: Enum (`active`, `quiet`, `archived`)
  - `created_at`: Timestamptz
  - `updated_at`: Timestamptz

### Message (Contract)
- `role`: `'user' | 'model'`
- `text`: `string`
- `timestamp`: `number` (optional)
