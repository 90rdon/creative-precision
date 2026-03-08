#!/bin/bash
#
# Nullclaw Memory System - Local Quick Start
# ==========================================
#
# Setup and start all services locally.
# Zero cloud costs.
#

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Directory setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log_step "Creating required directories..."

mkdir -p data/postgres data/qdrant data/redis

log_info "Directories created"

# Check Docker
log_step "Checking Docker installation..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed."
    echo "Please install Docker Desktop for Mac from: https://www.docker.com/get-started"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: docker-compose is not installed."
    echo "Please install: brew install docker-compose"
    exit 1
fi

log_info "Docker: $(docker --version)"
log_info "Docker Compose: $(docker-compose --version)"

# Start services
log_step "Starting memory services..."

docker-compose -f docker-compose-local.yml up -d

log_info "Services starting..."

# Wait for services to be healthy
log_step "Waiting for services to be ready..."

local max_attempts=30
local attempt=1

# Wait for PostgreSQL
while [ $attempt -le $max_attempts ]; do
    if docker exec nullclaw-postgres pg_isready -U nullclaw 2>/dev/null; then
        log_info "PostgreSQL is ready!"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

# Wait for Qdrant
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:6333/healthz > /dev/null 2>&1; then
        log_info "Qdrant is ready!"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

# Wait for Redis
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker exec nullclaw-redis redis-cli ping 2>/dev/null | grep -q PONG; then
        log_info "Redis is ready!"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

echo ""

# Show status
log_step "Service Status:"
docker-compose -f docker-compose-local.yml ps

echo ""
log_info "=== Local Memory System Started ==="
echo ""
echo "Services available at:"
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │ PostgreSQL:  postgresql://nullclaw:nullclaw@localhost:5432/nullclaw │"
echo "  │ Qdrant:     http://localhost:6333 (console)        │"
echo "  │ Redis:      localhost:6379                         │"
echo "  │ pgAdmin:    http://localhost:5050                   │"
echo "  │             Login: nullclaw@local / nullclaw       │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""
echo "Commands:"
echo "  View logs:      ./status.sh logs"
echo "  Stop services:  ./stop.sh"
echo "  Test with psql: psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw"
echo ""
echo "Cost: $0/month (all local!) "
echo ""
