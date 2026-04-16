# syntax=docker/dockerfile:1.7
#
# Gramola WhatsApp bot.
# Runs whatsapp-web.js which requires a full Chromium. Base is node:20-slim
# + system Chromium (smaller than Puppeteer's bundled Chrome, ~500 MB total).
# TypeScript runs directly via `tsx` at runtime — no tsc build step, no
# ".js"-extension gymnastics on extensionless imports.

FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# System Chromium + fonts for headless rendering, dumb-init to reap children.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation fonts-noto-color-emoji \
      ca-certificates \
      dumb-init \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ---- deps layer ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config-tsconfig/package.json packages/config-tsconfig/
COPY packages/ingest-protocol/package.json packages/ingest-protocol/
COPY packages/link-metadata/package.json packages/link-metadata/
COPY apps/bot/package.json apps/bot/
RUN pnpm install --frozen-lockfile --prod=false

# ---- runtime ----
FROM deps AS runtime
# Only the source the bot needs at runtime — workspace packages it imports
# and apps/bot itself. Everything else stays out of the image.
COPY packages ./packages
COPY apps/bot ./apps/bot

ENV NODE_ENV=production \
    SESSION_DIR=/app/sessions

VOLUME ["/app/sessions"]

WORKDIR /repo/apps/bot

ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
