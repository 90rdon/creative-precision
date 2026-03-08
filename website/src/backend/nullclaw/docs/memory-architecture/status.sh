#!/bin/bash
#
# Nullclaw Memory System - Status Check
# =====================================
#

cd "$(dirname "${BASH_SOURCE[0]}")"

COMMAND=${1:-status}

case $COMMAND in
    status)
        echo "=== Service Status ==="
        docker-compose -f docker-compose-local.yml ps

        echo ""
        echo "=== Storage Usage ==="
        echo "PostgreSQL:"
        du -sh data/postgres 2>/dev/null || echo "  Not found"
        echo "Qdrant:"
        du -sh data/qdrant 2>/dev/null || echo "  Not found"
        echo "Redis:"
        du -sh data/redis 2>/dev/null || echo "  Not found"
        echo ""
        ;;

    logs)
        SERVICE=${2:-}
        if [ -z "$SERVICE" ]; then
            echo "=== All Logs ==="
            docker-compose -f docker-compose-local.yml logs -f --tail=50
        else
            echo "=== $SERVICE Logs ==="
            docker-compose -f docker-compose-local.yml logs -f --tail=100 "$SERVICE"
        fi
        ;;

    test)
        echo "=== Testing Services ==="

        echo ""
        echo "[1/3] Testing PostgreSQL..."
        if docker exec nullclaw-postgres pg_isready -U nullclaw 2>/dev/null; then
            echo "✓ PostgreSQL is ready"
            docker exec nullclaw-postgres psql -U nullclaw -d nullclaw -c "SELECT COUNT(*) as table_count FROM information_schema.tables;" 2>/dev/null
        else
            echo "✗ PostgreSQL is not ready"
        fi

        echo ""
        echo "[2/3] Testing Qdrant..."
        if curl -s http://localhost:6333/healthz > /dev/null 2>&1; then
            echo "✓ Qdrant is ready"
            curl -s http://localhost:6333/collections | jq '.result.collections[] | .name' 2>/dev/null | head -5
        else
            echo "✗ Qdrant is not ready"
        fi

        echo ""
        echo "[3/3] Testing Redis..."
        if docker exec nullclaw-redis redis-cli ping 2>/dev/null | grep -q PONG; then
            echo "✓ Redis is ready"
        else
            echo "✗ Redis is not ready"
        fi

        echo ""
        echo "=== Test Complete ==="
        ;;

    database)
        echo "=== PostgreSQL Database Queries ==="

        echo ""
        echo "Memory tables:"
        docker exec nullclaw-postgres psql -U nullclaw -d nullclaw -c "\dt" 2>/dev/null

        echo ""
        echo "Memory count:"
        docker exec nullclaw-postgres psql -U nullclaw -d nullclaw -c "SELECT 'Memories' as table_name, COUNT(*) FROM memories
UNION ALL SELECT 'Messages', COUNT(*) FROM messages
UNION ALL SELECT 'Embeddings', COUNT(*) FROM embeddings;" 2>/dev/null

        echo ""
        echo "Recent memories:"
        docker exec nullclaw-postgres psql -U nullclaw -d nullclaw -c "SELECT key, layer, access_level, created_at FROM memories ORDER BY created_at DESC LIMIT 5;" 2>/dev/null

        echo ""
        ;;

    qdrant)
        echo "=== Qdrant Collections ==="
        curl -s http://localhost:6333/collections | jq '.result.collections[] | {name: .name, points_count: .points_count, vectors_count: .vectors_count}' 2>/dev/null

        echo ""
        echo "=== Create Test Collection ==="
        curl -X PUT http://localhost:6333/collections/test_memories \
            -H 'Content-Type: application/json' \
            -d '{"vectors": {"size": 1536, "distance": "Cosine"}}' 2>/dev/null

        echo ""
        echo "=== Qdrant Status ==="
        curl -s http://localhost:6333 2>/dev/null | jq '.title' 2>/dev/null
        ;;

    redis)
        echo "=== Redis Status ==="
        docker exec nullclaw-redis redis-cli INFO stats 2>/dev/null | grep -E "keyspace|total_connections_received" || docker exec nullclaw-redis redis-cli INFO 2>/dev/null | head -5

        echo ""
        echo "Keys stored:"
        docker exec nullclaw-redis redis-cli DBSIZE 2>/dev/null
        ;;

    *)
        echo "Usage: ./status.sh <command>"
        echo ""
        echo "Commands:"
        echo "  status          - Show service status and storage usage"
        echo "  logs [service]  - View logs (all or specific service)"
        echo "  test            - Test all services are ready"
        echo "  database        - Query PostgreSQL memory tables"
        echo "  qdrant          - View Qdrant collections"
        echo "  redis           - View Redis status"
        echo ""
        ;;

esac
