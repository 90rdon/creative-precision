# Use Node.js 22 LTS
FROM node:22-slim

# Install kubectl for internal fleet diagnosis
RUN apt-get update && apt-get install -y curl ca-certificates && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then K8S_ARCH="amd64"; elif [ "$ARCH" = "aarch64" ]; then K8S_ARCH="arm64"; else K8S_ARCH="amd64"; fi && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${K8S_ARCH}/kubectl" && \
    chmod +x kubectl && mv kubectl /usr/local/bin/

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source and config
COPY . .

# Build TypeScript
RUN npm run build

# Default environment variables
ENV NODE_ENV=production
ENV DB_PATH=/app/data/db.json

# Create data directory for persistence
RUN mkdir -p /app/data

# MCP server communicates over stdio, so no port EXPOSE needed
# but we can expose for future management if needed
# EXPOSE 3000

CMD ["node", "dist/index.js"]
