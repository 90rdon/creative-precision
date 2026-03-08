#!/bin/bash
# ============================================================
# SQLite → Supabase Migration
# ============================================================
# Migrates existing nullclaw SQLite memories to Supabase.
# Embeddings are NOT migrated (they'll regenerate on next query).
#
# Usage:
#   ./migrate-to-supabase.sh <sqlite_db_path> <supabase_url>
#
# Or called by setup-supabase.sh automatically.
# ============================================================

set -euo pipefail

SQLITE_DB="${1:-}"
SUPABASE_URL="${2:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${CYAN}[MIGRATE]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
# Validate args
# ============================================================
if [ -z "$SQLITE_DB" ] || [ -z "$SUPABASE_URL" ]; then
    echo "Usage: $0 <sqlite_db_path> <supabase_url>"
    exit 1
fi

if [ ! -f "$SQLITE_DB" ]; then
    error "SQLite database not found: $SQLITE_DB"
    exit 1
fi

if ! command -v sqlite3 &>/dev/null; then
    error "sqlite3 required. Install with: brew install sqlite"
    exit 1
fi

if ! command -v psql &>/dev/null; then
    error "psql required. Install with: brew install libpq && brew link --force libpq"
    exit 1
fi

# ============================================================
# Export from SQLite
# ============================================================
TMPDIR_MIGRATION=$(mktemp -d)
trap "rm -rf $TMPDIR_MIGRATION" EXIT

log "Exporting from SQLite: $SQLITE_DB"

# Export sessions
sqlite3 "$SQLITE_DB" <<EOF
.headers off
.mode csv
.output $TMPDIR_MIGRATION/sessions.csv
SELECT id, provider, model,
       datetime(created_at/1000000000, 'unixepoch'),
       datetime(updated_at/1000000000, 'unixepoch')
FROM sessions;
EOF

SESSION_COUNT=$(wc -l < "$TMPDIR_MIGRATION/sessions.csv" | tr -d ' ')
log "Exported $SESSION_COUNT sessions"

# Export memories (skip autosave/conversation noise by default)
sqlite3 "$SQLITE_DB" <<EOF
.headers off
.mode csv
.output $TMPDIR_MIGRATION/memories.csv
SELECT id, key, content, category, session_id,
       datetime(created_at/1000000000, 'unixepoch'),
       datetime(updated_at/1000000000, 'unixepoch')
FROM memories
WHERE category != 'conversation';
EOF

MEMORY_COUNT=$(wc -l < "$TMPDIR_MIGRATION/memories.csv" | tr -d ' ')
log "Exported $MEMORY_COUNT non-conversation memories"

# Export all memories count for info
TOTAL=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM memories;" 2>/dev/null || echo "0")
CONV=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM memories WHERE category='conversation';" 2>/dev/null || echo "0")
warn "Skipping $CONV conversation memories (they'll accumulate fresh in Supabase)"
log "Total in SQLite: $TOTAL | Migrating: $MEMORY_COUNT core memories"

# Export kv store
sqlite3 "$SQLITE_DB" <<EOF
.headers off
.mode csv
.output $TMPDIR_MIGRATION/kv.csv
SELECT key, value FROM kv;
EOF

KV_COUNT=$(wc -l < "$TMPDIR_MIGRATION/kv.csv" | tr -d ' ')
log "Exported $KV_COUNT kv entries"

# ============================================================
# Import to Supabase
# ============================================================
log "Connecting to Supabase..."

# Test connection
psql "$SUPABASE_URL" -c "SELECT 1;" -t &>/dev/null || {
    error "Cannot connect to Supabase. Check URL."
    exit 1
}

# Import sessions
if [ "$SESSION_COUNT" -gt 0 ]; then
    log "Importing sessions..."
    psql "$SUPABASE_URL" -c "\COPY sessions (id, provider, model, created_at, updated_at) FROM '$TMPDIR_MIGRATION/sessions.csv' CSV;" 2>/dev/null || warn "Some sessions may have skipped (duplicates OK)"
    ok "Sessions imported"
fi

# Import memories
if [ "$MEMORY_COUNT" -gt 0 ]; then
    log "Importing $MEMORY_COUNT memories..."
    # Use a temp table to handle conflicts gracefully
    psql "$SUPABASE_URL" <<PSQL
CREATE TEMP TABLE memories_import (LIKE memories);
\COPY memories_import (id, key, content, category, session_id, created_at, updated_at) FROM '$TMPDIR_MIGRATION/memories.csv' CSV;
INSERT INTO memories SELECT * FROM memories_import
    ON CONFLICT (id) DO UPDATE SET
        content    = EXCLUDED.content,
        category   = EXCLUDED.category,
        updated_at = EXCLUDED.updated_at;
DROP TABLE memories_import;
PSQL
    ok "$MEMORY_COUNT memories imported"
fi

# Import kv
if [ "$KV_COUNT" -gt 0 ]; then
    log "Importing kv entries..."
    psql "$SUPABASE_URL" <<PSQL
CREATE TEMP TABLE kv_import (key TEXT, value TEXT);
\COPY kv_import FROM '$TMPDIR_MIGRATION/kv.csv' CSV;
INSERT INTO kv SELECT * FROM kv_import
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
DROP TABLE kv_import;
PSQL
    ok "$KV_COUNT kv entries imported"
fi

# ============================================================
# Verify
# ============================================================
echo ""
log "Verifying migration..."

psql "$SUPABASE_URL" -t <<PSQL
SELECT
    'memories' as table_name, COUNT(*) as count FROM memories
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL SELECT 'kv', COUNT(*) FROM kv;
PSQL

ok "Migration complete. Embeddings will regenerate on first query."
echo ""
echo "Note: Conversation history was not migrated (starts fresh)."
echo "      Core memories, sessions, and kv store were migrated."
