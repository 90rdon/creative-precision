#!/bin/bash
#
# Memory Service Manager - On-Demand Operation
# =============================================
#
# Start memory services only when needed. Auto-stop after inactivity.
#
# Usage:
#   ./memory.sh start          - Start services
#   ./memory.sh stop           - Stop services
#   ./memory.sh status         - Check status
#   ./memory.sh connect        - Connect with timeout (recommended)
#   ./memory.sh request        - Keep alive during request
#

set -e

MEMORY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$MEMORY_DIR/docker-compose-ondemand.yml"
LOCK_FILE="/tmp/nullclaw-memory.lock"
LAST_ACTIVITY_FILE="$MEMORY_DIR/.last_activity"
TIMEOUT_MINUTES=15  # Auto-stop after 15 minutes idle

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[MEMORY]${NC} $1" >&2; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1" >&2; }

# Update activity timestamp
update_activity() {
    touch "$LAST_ACTIVITY_FILE"
}

# Check if services are running
is_running() {
    docker ps -q -f "name=nullclaw-" | grep -q . 2>/dev/null
}

# Wait for services to be ready
wait_for_services() {
    log_step "Waiting for services to be ready..."

    local attempt=1
    local max_attempts=30

    while [ $attempt -le $max_attempts ]; do
        local ready=0

        # Check PostgreSQL
        if docker exec nullclaw-postgres pg_isready -U nullclaw 2>/dev/null | grep -q "accepting connections"; then
            ready=$((ready + 1))
        else
            echo -n "." >&2
        fi

        if [ $ready -ge 1 ]; then
            echo "" >&2
            log_info "Services ready!"
            return 0
        fi

        sleep 1
        attempt=$((attempt + 1))
    done

    log_warn "Services took too long to start"
    return 1
}

# Start services with automatic timeout handling
start_services() {
    log_step "Starting memory services on-demand..."

    update_activity

    cd "$MEMORY_DIR"

    if docker ps -q -f "name=nullclaw-" | grep -q . 2>/dev/null; then
        log_info "Services already running, extending idle timeout"
        update_activity
        _setup_auto_stop
        return 0
    fi

    docker-compose -f "$COMPOSE_FILE" up -d 2>/dev/null

    if wait_for_services; then
        log_info "Services started successfully"
        _setup_auto_stop
        return 0
    else
        log_warn "Failed to start services"
        return 1
    fi
}

# Stop services
stop_services() {
    log_step "Stopping memory services..."

    cd "$MEMORY_DIR"

    if docker ps -q -f "name=nullclaw-" | grep -q . 2>/dev/null; then
        docker-compose -f "$COMPOSE_FILE" down 2>/dev/null
        log_info "Services stopped"
    else
        log_info "No services running"
    fi
}

# Check status
check_status() {
    if is_running; then
        log_info "Status: RUNNING"
        echo ""
        docker ps -f "name=nullclaw-" | tail -n +2
        echo ""
        echo "Resources:"
        docker stats nullclaw-postgres nullclaw-qdrant nullclaw-redis --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

        # Check idle time
        if [ -f "$LAST_ACTIVITY_FILE" ]; then
            local idle_seconds=$(( $(date +%s) - $(stat -f %m "$LAST_ACTIVITY_FILE") ))
            local idle_minutes=$((idle_seconds / 60))
            if [ $idle_minutes -gt 0 ]; then
                echo ""
                log_info "Idle for $idle_minutes minutes (auto-stop at $TIMEOUT_MINUTES min)"
            fi
        fi
    else
        log_info "Status: NOT RUNNING (on-demand)"
        echo "Services stopped. Use './memory.sh start' to start them."
    fi
}

# Setup auto-stop timer
_setup_auto_stop() {
    # Cancel any existing timer
    local existing_pid
    if [ -f "$LOCK_FILE" ]; then
        existing_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        if [ -n "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
            kill "$existing_pid" 2>/dev/null || true
        fi
    fi

    # Run auto-stop monitor in background
    (
        while is_running; do
            if [ -f "$LAST_ACTIVITY_FILE" ]; then
                local idle_seconds=$(( $(date +%s) - $(stat -f %m "$LAST_ACTIVITY_FILE") ))
                local idle_minutes=$((idle_seconds / 60))

                if [ $idle_minutes -ge $TIMEOUT_MINUTES ]; then
                    log_info "Idle for $idle_minutes minutes, stopping services..."
                    stop_services
                    rm -f "$LOCK_FILE" 2>/dev/null
                    exit 0
                fi
            fi
            sleep 10
        done
        rm -f "$LOCK_FILE" 2>/dev/null
    ) &

    echo "$!" > "$LOCK_FILE"
}

# Connect to database with activity updates
connect_db() {
    start_services
    update_activity

    log_info "Connecting to memory database..."
    log_info "Auto-stop after $TIMEOUT_MINUTES minutes of inactivity"
    log_info "Press Ctrl+C to disconnect"

    psql "postgresql://nullclaw:nullclaw@localhost:5432/nullclaw"

    update_activity
}

# Request mode - start, do work, update activity
request_mode() {
    start_services
    update_activity

    local command="$1"

    if [ -n "$command" ]; then
        log_info "Executing request (services will auto-stop after $TIMEOUT_MINUTES min idle)..."
        eval "$command"
        update_activity
    else
        log_info "Services ready (auto-stop after $TIMEOUT_MINUTES min idle)"
    fi
}

# Main command handler
COMMAND="${1:-status}"

case $COMMAND in
    start|up)
        start_services
        check_status
        ;;

    stop|down)
        stop_services
        ;;

    restart)
        stop_services
        start_services
        check_status
        ;;

    status|stat)
        check_status
        ;;

    connect)
        connect_db
        ;;

    request)
        shift
        request_mode "$@"
        ;;

    keep-alive)
        while true; do
            update_activity
            sleep 30
        done
        ;;

    ping)
        if is_running; then
            echo "UP"
            exit 0
        else
            echo "DOWN"
            exit 1
        fi
        ;;

    ps)
        docker ps -f "name=nullclaw-"
        ;;

    logs)
        service="${2:-}"
        if [ -n "$service" ]; then
            docker logs -f "nullclaw-$service"
        else
            docker-compose -f "$COMPOSE_FILE" logs -f --tail=50
        fi
        ;;

    *)
        echo "Memory Service Manager - On-Demand Operation"
        echo ""
        echo "Usage: ./memory.sh <command>"
        echo ""
        echo "Commands:"
        echo "  start      - Start memory services"
        echo "  stop       - Stop memory services"
        echo "  restart    - Restart memory services"
        echo "  status     - Check service status"
        echo "  connect    - Connect to database (persistence)"
        echo "  request    - Start services + execute command"
        echo "  keep-alive - Extend auto-stop timer"
        echo "  ping       - Check if services are running"
        echo "  ps         - Show running containers"
        echo "  logs       - View service logs"
        echo ""
        echo "Auto-stop after $TIMEOUT_MINUTES minutes of inactivity"
        exit 1
        ;;
esac
