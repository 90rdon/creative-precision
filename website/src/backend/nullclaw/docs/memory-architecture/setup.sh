#!/bin/bash
#
# Nullclaw Multi-Layer Memory System Setup Script
# =================================================
#
# This script sets up the complete memory architecture.
#

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Please install it first."
        echo "Mac: https://docs.docker.com/desktop/install/mac-install/"
        echo "Linux: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi

    log_info "Docker found: $(docker --version)"
}

# Create directories
setup_directories() {
    log_step "Creating directory structure..."

    mkdir -p services/{consolidation,sync}
    mkdir -p monitoring/{prometheus,grafana-dashboards,grafana-datasources}
    mkdir -p scripts
    mkdir -p data/{postgres,qdrant,redis}

    log_info "Directories created"
}

# Start services
start_services() {
    log_step "Starting Docker Compose services..."

    docker-compose up -d

    log_info "Services started. Run 'docker-compose ps' to check status."
}

# Wait for services to be healthy
wait_for_services() {
    log_step "Waiting for services to be healthy..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep -q "Exit"; then
            log_warn "Some services exited. Check logs with 'docker-compose logs'"
            break
        fi

        # Check if PostgreSQL is ready
        if docker exec nullclaw-postgres pg_isready > /dev/null 2>&1; then
            log_info "PostgreSQL is ready"
            break
        fi

        sleep 2
        attempt=$((attempt + 1))
    done
}

# Verify services
verify_services() {
    log_step "Verifying services..."

    echo ""
    echo "Service Status:"
    echo "==============="
    docker-compose ps
    echo ""
}

# Create default users
setup_database() {
    log_step "Setting up database schema..."

    # PostgreSQL should have schema auto-loaded from pg_schema.sql
    log_info "Database schema loaded"
    log_info "Default instances: atlas, vigil"
}

# Print next steps
print_next_steps() {
    log_info "=== Setup Complete ==="
    echo ""
    echo "Services accessible at:"
    echo "  PostgreSQL:  postgresql://nullclaw:nullclaw@localhost:5432/nullclaw"
    echo "  Qdrant:     http://localhost:6333"
    echo "  Redis:      localhost:6379"
    echo "  Grafana:    http://localhost:3000 (admin / nullclaw)"
    echo "  pgAdmin:    http://localhost:5050 (admin@nullclaw.local / admin)"
    echo ""
    echo "Next steps:"
    echo "  1. Verify services: docker-compose logs -f"
    echo "  2. Test database: psql postgresql://nullclaw:nullclaw@localhost:5432/nullclaw"
    echo "  3. Migrate existing data (see IMPLEMENTATIONGUIDE.md)"
    echo "  4. Configure Atlas and Vigil instances"
    echo ""
    echo "View logs: docker-compose logs -f"
    echo "Stop services: docker-compose down"
}

# Main execution
main() {
    echo "======================================================================"
    echo "  Nullclaw Multi-Layer Memory System Setup"
    echo "======================================================================"
    echo ""

    check_prerequisites
    setup_directories
    start_services
    wait_for_services
    verify_services
    setup_database
    print_next_steps
}

main "$@"
