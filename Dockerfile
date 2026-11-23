FROM node:22-alpine

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency specifications and configuration
COPY package.json pnpm-lock.yaml .npmrc* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --allow-build=esbuild

# Copy application source code
COPY . .

# Expose default application port
EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3000"]
