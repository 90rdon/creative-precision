#!/bin/bash
# Start local development environment with Mock NullClaw Gateway

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}   Local Dev Environment Setup${NC}"
echo -e "${BLUE}===========================================${NC}"

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}WARNING: GEMINI_API_KEY not set${NC}"
    echo "Mock gateway will use fallback responses without real AI"
    echo ""
fi

# Mock gateway port
MOCK_PORT=${NULLCLAW_MOCK_PORT:-18791}

# Update .env for local testing
echo -e "${BLUE}Setting LOCAL_NULLCLAW_API_ENDPOINT...${NC}"
echo "LOCAL_NULLCLAW_API_ENDPOINT=http://localhost:${MOCK_PORT}" >> .env

# Start mock gateway in background
echo ""
echo -e "${GREEN}Starting Mock NullClaw Gateway on port ${MOCK_PORT}...${NC}"
npx ts-node server/src/api/nullclaw/mock-gateway.ts &
MOCK_PID=$!
sleep 2

# Wait for mock gateway to be ready
echo -e "${GREEN}Waiting for mock gateway...${NC}"
until curl -s http://localhost:${MOCK_PORT}/health > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓ Mock Gateway is ready!${NC}"

# Start main server
echo ""
echo -e "${GREEN}Starting main server...${NC}"
echo -e "${GREEN}NULLCLAW_API_ENDPOINT=http://localhost:${MOCK_PORT}${NC}"

# Override the endpoint for this session
export NULLCLAW_API_ENDPOINT="http://localhost:${MOCK_PORT}"
npm run dev

# Cleanup on exit
trap "kill $MOCK_PID 2>/dev/null; echo -e '${YELLOW}Mock Gateway stopped${NC}'" EXIT
