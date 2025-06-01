FROM node:22.12.0-alpine as builder

# Add build dependencies
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /usr/app

# Copy package files
COPY package*.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:22.12.0-alpine

# Add curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/app

# Copy only necessary files from builder
COPY --from=builder /usr/app/dist ./dist
COPY --from=builder /usr/app/node_modules ./node_modules
COPY package*.json ./

# Set proper ownership
RUN chown -R appuser:appgroup /usr/app

# Use non-root user
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3005/health || exit 1

EXPOSE 3005

# Use node directly instead of yarn for production
CMD ["node", "dist/main"]