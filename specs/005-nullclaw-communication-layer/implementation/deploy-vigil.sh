#!/bin/bash
# Deploy Vigil Fleet Services
# Run this from the implementation directory

set -e

VIGIL_HOST="90rdon-berry.local"
VIGIL_USER="root"
REMOTE_DIR="/root/nullclaw-fleet"

echo "🚀 Deploying NullClaw fleet services to Vigil (${VIGIL_HOST})..."

# Create remote directory
echo "📁 Creating remote directory..."
ssh ${VIGIL_USER}@${VIGIL_HOST} "mkdir -p ${REMOTE_DIR}"

# Copy files
echo "📦 Copying files (this may take a moment)..."
rsync -avz \
  --exclude node_modules \
  --exclude .git \
  --exclude *.log \
  ./ \
  ${VIGIL_USER}@${VIGIL_HOST}:${REMOTE_DIR}/

# Stop existing services if running
echo "⏹️  Stopping existing services..."
ssh ${VIGIL_USER}@${VIGIL_HOST} "cd ${REMOTE_DIR} && docker compose -f docker-compose-vigil.yml down --remove-orphans || true"

# Copy schema to init location
echo "📋 Copying database schema..."
ssh ${VIGIL_USER}@${VIGIL_HOST} "cd ${REMOTE_DIR} && cp fleet_schema.sql services/event-logger/init.sql"

# Start services
echo "▶️  Starting Vigil fleet services..."
ssh ${VIGIL_USER}@${VIGIL_HOST} "cd ${REMOTE_DIR} && docker compose -f docker-compose-vigil.yml up -d"

echo "⏳ Waiting for services to start..."
sleep 10

# Check services
echo "✅ Checking services..."
ssh ${VIGIL_USER}@${VIGIL_HOST} "cd ${REMOTE_DIR} && docker compose -f docker-compose-vigil.yml ps"

# Test event logger
echo "🔍 Testing event logger health..."
if curl -s http://${VIGIL_HOST}:18990/api/v1/health > /dev/null 2>&1; then
  EVENT_LOGGER_HEALTH=$(curl -s http://${VIGIL_HOST}:18990/api/v1/health)
  echo "Event Logger: ${EVENTIZER_HEALTH}"
else
  echo "⚠️  Event logger not responding yet, checking logs..."
  ssh ${VIGIL_USER}@${VIGIL_HOST} "cd ${REMOTE_DIR} && docker logs vigil-event-logger --tail 20"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Check service status: ssh ${VIGIL_USER}@${VIGIL_HOST} 'cd ${REMOTE_DIR} && docker compose -f docker-compose-vigil.yml ps'"
echo "  2. View event logs: ssh ${VIGIL_USER}@${VIGIL_HOST} 'docker logs vigil-event-logger --tail 50'"
echo "  3. Test API: curl http://${VIGIL_HOST}:18990/api/v1/health"
echo ""
echo "Services endpoint:"
echo "  • Event Logger: http://${VIGIL_HOST}:18990"
echo "  • PostgreSQL: ${VIGIL_HOST}:5432"
echo "  • Redis: ${VIGIL_HOST}:6379"
echo "  • Qdrant: ${VIGIL_HOST}:6333"
