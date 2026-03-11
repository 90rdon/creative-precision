#!/bin/bash
# Heartbeat monitor for nullclaw mock gateway
# Checks every 30 seconds and restarts if unhealthy

GATEWAY_URL="http://localhost:18791/health"
LOG_FILE="/tmp/mock-gateway-monitor.log"

while true; do
    # Check health
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL" 2>/dev/null)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "[$(date)] Mock gateway is healthy" >> "$LOG_FILE"
    else
        echo "[$(date)] Mock gateway unhealthy (HTTP $HTTP_CODE), restarting..." >> "$LOG_FILE"

        # Check if still running and kill it
        if [ -f "/tmp/mock-gateway.pid" ]; then
            PID=$(cat /tmp/mock-gateway.pid)
            if kill -0 "$PID" 2>/dev/null; then
                kill "$PID" 2>/dev/null
                sleep 2
            fi
        fi

        # Restart
        cd /Users/9_0rdon/creative-precision/website/src/backend/proxy-server
        nohup npx ts-node src/api/nullclaw/mock-gateway.ts > /tmp/mock-gateway.log 2>&1 &
        echo $! > /tmp/mock-gateway.pid

        echo "[$(date)] Restarted with PID: $(cat /tmp/mock-gateway.pid)" >> "$LOG_FILE"
    fi

    sleep 30
done
