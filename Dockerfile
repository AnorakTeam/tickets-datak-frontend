# Multi-stage production build for Nuxt 4 on Cloud Run
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency specifications and configuration
COPY package.json pnpm-lock.yaml .npmrc* ./

# Install all dependencies required for building
RUN pnpm install --frozen-lockfile --allow-build=esbuild

# Copy application source code
COPY . .

# Build production bundle (.output)
RUN pnpm build

# Stage 2: Minimal Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

# Copy compiled standalone Nitro bundle
COPY --from=builder /app/.output /app/.output

EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
