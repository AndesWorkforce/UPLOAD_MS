# ============================================================
# Stage 1: Install all deps, build, then prune devDeps
# (single npm install = faster than running two)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# dumb-init for proper PID 1 / signal handling in containers
RUN apk add --no-cache dumb-init

COPY package.json ./

# Install ALL deps (devDeps needed for tsc / @nestjs/cli)
# --ignore-scripts skips the "prepare" husky hook
RUN npm install --ignore-scripts

# Copy source files needed for compilation
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
COPY config/ ./config/

# Compile TypeScript → dist/
RUN npm run build

# Remove devDependencies in-place so we can copy a clean node_modules
RUN npm prune --omit=dev --ignore-scripts


# ============================================================
# Stage 2: Lean production image
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

# Binary is already built into Alpine's node image; pull dumb-init from builder
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

# Production-only node_modules (pruned in Stage 1)
COPY --from=builder /app/node_modules ./node_modules

# Compiled output  (dist/src/ + dist/config/)
COPY --from=builder /app/dist ./dist

# Minimal package metadata (needed by some NestJS internals)
COPY package.json ./

# Run as the built-in non-root 'node' user (uid 1000)
USER node

# Define build arguments
ARG PORT=3006
ARG ADT_MS_URL
ARG AWS_ACCESS_KEY_ID
ARG AWS_REGION
ARG AWS_S3_BUCKET
ARG AWS_SECRET_ACCESS_KEY
ARG DEV_LOGS=true
ARG ENVIRONMENT=production
ARG JWT_SECRET_PASSWORD
ARG NATS_HOST
ARG NATS_PORT=4222
ARG NATS_USERNAME
ARG NATS_PASSWORD

# Set environment variables from build arguments
ENV NODE_ENV=production
ENV PORT=${PORT}
ENV ADT_MS_URL=${ADT_MS_URL}
ENV AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
ENV AWS_REGION=${AWS_REGION}
ENV AWS_S3_BUCKET=${AWS_S3_BUCKET}
ENV AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
ENV DEV_LOGS=${DEV_LOGS}
ENV ENVIRONMENT=${ENVIRONMENT}
ENV JWT_SECRET_PASSWORD=${JWT_SECRET_PASSWORD}
ENV NATS_HOST=${NATS_HOST}
ENV NATS_PORT=${NATS_PORT}
ENV NATS_USERNAME=${NATS_USERNAME}
ENV NATS_PASSWORD=${NATS_PASSWORD}

EXPOSE ${PORT}

# dumb-init ensures proper PID 1 handling and signal forwarding
# Entry point is dist/src/main (NestJS tsc output: src/ → dist/src/)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main"]
