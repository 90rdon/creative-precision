#!/bin/bash
# ============================================================
# Supabase Memory Setup Script
# ============================================================
# Configures nullclaw Atlas to use Supabase as centralized memory.
#
# Usage:
#   ./setup-supabase.sh
#
# What this does:
#   1. Prompts for your Supabase connection details
#   2. Tests the connection
#   3. Updates nullclaw_data/config.json
#   4. Optionally migrates existing SQLite memories
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/nullclaw_data/config.json"
SQLITE_DB="$PROJECT_ROOT/nullclaw_data/workspace/memory.db"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()    { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()     { echo -e "${GREEN}[OK]${NC} $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; }
header() { echo -e "\n${BOLD}$1${NC}"; echo "$(printf '%.0s─' {1..50})"; }

# ============================================================
# Check dependencies
# ============================================================
header "Checking dependencies"

for cmd in psql python3 jq; do
    if command -v "$cmd" &>/dev/null; then
        ok "$cmd found"
    else
        warn "$cmd not found ($([ "$cmd" = "psql" ] && echo "needed for connection test and migration" || echo "needed for config update"))"
    fi
done

# ============================================================
# Collect Supabase credentials
# ============================================================
header "Supabase Connection Details"

echo ""
echo "Find these in: Supabase Dashboard → Settings → Database"
echo ""

# Try to read existing config if already set
EXISTING_URL=""
if [ -f "$CONFIG_FILE" ] && command -v jq &>/dev/null; then
    EXISTING_URL=$(jq -r '.memory.postgres.url // ""' "$CONFIG_FILE" 2>/dev/null || echo "")
fi

if [ -n "$EXISTING_URL" ] && [ "$EXISTING_URL" != "null" ]; then
    echo "Existing Supabase URL found in config."
    read -rp "Use existing URL? [Y/n] " USE_EXISTING
    if [[ "${USE_EXISTING,,}" != "n" ]]; then
        SUPABASE_URL="$EXISTING_URL"
    fi
fi

if [ -z "${SUPABASE_URL:-}" ]; then
    echo "Enter your Supabase connection string."
    echo "Format: postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
    echo ""
    read -rp "Supabase URL: " SUPABASE_URL
fi

if [ -z "$SUPABASE_URL" ]; then
    error "No URL provided. Exiting."
    exit 1
fi

# Ensure SSL is required
if [[ "$SUPABASE_URL" != *"sslmode"* ]]; then
    SUPABASE_URL="${SUPABASE_URL}?sslmode=require"
fi

# ============================================================
# Test connection
# ============================================================
header "Testing Connection"

if command -v psql &>/dev/null; then
    log "Connecting to Supabase..."
    if psql "$SUPABASE_URL" -c "SELECT current_database(), version();" -t 2>/dev/null | head -1; then
        ok "Connection successful!"
    else
        error "Connection failed. Check your URL and password."
        exit 1
    fi
else
    warn "psql not installed - skipping connection test"
    warn "Install with: brew install libpq && brew link --force libpq"
fi

# ============================================================
# Run schema
# ============================================================
header "Running Supabase Schema"

SCHEMA_FILE="$SCRIPT_DIR/schema/supabase-final.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    error "Schema file not found: $SCHEMA_FILE"
    exit 1
fi

if command -v psql &>/dev/null; then
    read -rp "Run schema now? (creates tables if not exists) [Y/n] " RUN_SCHEMA
    if [[ "${RUN_SCHEMA,,}" != "n" ]]; then
        log "Running schema..."
        if psql "$SUPABASE_URL" -f "$SCHEMA_FILE" 2>&1 | grep -v "^$\|NOTICE\|already exists"; then
            ok "Schema applied successfully"
        else
            warn "Schema may have partial errors (usually OK if tables already exist)"
        fi
    fi
else
    warn "psql not available - run schema manually via Supabase SQL Editor"
    echo "  File: $SCHEMA_FILE"
fi

# ============================================================
# Update config.json
# ============================================================
header "Updating Atlas Config"

if [ ! -f "$CONFIG_FILE" ]; then
    error "Config file not found: $CONFIG_FILE"
    exit 1
fi

if ! command -v python3 &>/dev/null; then
    error "python3 required to update config.json"
    exit 1
fi

log "Updating $CONFIG_FILE..."

python3 - "$CONFIG_FILE" "$SUPABASE_URL" <<'PYEOF'
import json, sys

config_path = sys.argv[1]
supabase_url = sys.argv[2]

with open(config_path, 'r') as f:
    config = json.load(f)

# Update memory backend
config['memory']['profile'] = 'centralized'
config['memory']['backend'] = 'postgres'

# Update postgres connection
config['memory']['postgres'] = {
    'url': supabase_url,
    'schema': 'public',
    'table': 'memories',
    'connect_timeout_secs': 30
}

# Update vector store to use pgvector (already in Supabase)
if 'search' in config['memory']:
    config['memory']['search']['store'] = {
        'kind': 'pgvector',
        'sidecar_path': '',
        'qdrant_url': '',
        'qdrant_apiKey': '',
        'qdrant_collection': 'nullclaw_memories',
        'pgvector_table': 'memory_embeddings'
    }

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print(f"  backend: postgres")
print(f"  url: {supabase_url[:60]}...")
print(f"  vector store: pgvector (memory_embeddings table)")
PYEOF

ok "Config updated"

# ============================================================
# Migrate existing SQLite data (optional)
# ============================================================
header "Migrate Existing Memories"

if [ -f "$SQLITE_DB" ]; then
    MEMORY_COUNT=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM memories;" 2>/dev/null || echo "0")
    echo "Found $MEMORY_COUNT memories in SQLite database."
    echo ""

    if [ "$MEMORY_COUNT" -gt 0 ] && command -v psql &>/dev/null; then
        read -rp "Migrate memories to Supabase? [y/N] " DO_MIGRATE
        if [[ "${DO_MIGRATE,,}" == "y" ]]; then
            log "Running migration..."
            bash "$SCRIPT_DIR/migrate-to-supabase.sh" "$SQLITE_DB" "$SUPABASE_URL"
        else
            log "Skipping migration. Run manually: ./migrate-to-supabase.sh"
        fi
    elif [ "$MEMORY_COUNT" -gt 0 ]; then
        warn "psql not available - run migration manually after installing psql"
        echo "  ./migrate-to-supabase.sh"
    fi
else
    log "No existing SQLite database found - starting fresh"
fi

# ============================================================
# Done
# ============================================================
header "Setup Complete"

cat <<EOF

Atlas is now configured to use Supabase as centralized memory.

  Backend:      postgres (Supabase)
  Vector store: pgvector (in Supabase)
  Config:       nullclaw_data/config.json

Next steps:
  1. Restart Atlas for changes to take effect
  2. For Vigil - run this script on the Pi pointing to same Supabase URL
  3. Test with: psql '$SUPABASE_URL' -c "SELECT COUNT(*) FROM memories;"

To verify after restart:
  - Atlas should load memories from Supabase
  - Any new memories will be written to Supabase
  - Vigil can read shared memories from the same database

EOF
