# ==========================================
# Production Dockerfile for Express.js Backend
# ==========================================
FROM node:20-alpine

# Set node environment
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Install curl/wget for healthcheck
RUN apk add --no-cache wget

# Copy package dependency manifests first for better caching
COPY package*.json ./

# Install only production dependencies cleanly
RUN npm ci --omit=dev --silent

# Copy project source code
COPY . .

# Create required runtime directories and set ownership to unprivileged user 'node'
RUN mkdir -p uploads/pins uploads/avatars data \
  && chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose API port
EXPOSE 5000

# Docker native container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Execute node directly so PID 1 receives SIGTERM and SIGINT for graceful shutdown
CMD ["node", "server.js"]
