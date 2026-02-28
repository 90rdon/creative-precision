# Stage 1: Build React Frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build Node Backend
FROM node:22-alpine AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx tsc

# Stage 3: Production
FROM node:22-alpine
WORKDIR /app

# Copy generic files we need
COPY --from=frontend-build /app/dist ./dist

# Set up server
WORKDIR /app/server
COPY --from=backend-build /app/server/package*.json ./
RUN npm ci --only=production
COPY --from=backend-build /app/server/dist ./dist

# We also still have the react build in /app/dist which the server looks for at ../../dist based on index.js path.
# Wait, index.js will be in /app/server/dist/index.js.
# So path.join(__dirname, '../../dist') from /app/server/dist/index.js -> /app/dist. This matches correctly!

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
