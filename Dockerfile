# Multi-stage build for production
FROM node:18-alpine AS frontend-build

# Build the React frontend
WORKDIR /app/frontend
COPY sixdegrees/package*.json ./
RUN npm ci --only=production
COPY sixdegrees/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/build ./build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sixdegrees -u 1001 -G nodejs

# Set ownership
RUN chown -R sixdegrees:nodejs /app
USER sixdegrees

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

# Start the application
CMD ["node", "index.js"]