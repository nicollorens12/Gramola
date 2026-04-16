# syntax=docker/dockerfile:1.7
#
# Gramola WhatsApp bot.
# Runs whatsapp-web.js, which requires a full Chromium. We use node:20-slim +
# system Chromium (smaller than Puppeteer's bundled Chrome) and keep the image
# around ~500MB — fits comfortably in Railway / Fly free tiers.

FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# Install system Chromium + fonts for headless rendering.
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
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/config-tsconfig/package.json packages/config-tsconfig/
COPY packages/ingest-protocol/package.json packages/ingest-protocol/
COPY packages/link-metadata/package.json packages/link-metadata/
COPY apps/bot/package.json apps/bot/
RUN pnpm install --frozen-lockfile --prod=false

# ---- build layer ----
FROM deps AS build
COPY . .
RUN pnpm --filter @gramola/bot build

# ---- runtime ----
FROM base AS runtime
WORKDIR /app

# Copy only what we need at runtime.
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/bot/dist ./dist
COPY --from=build /repo/apps/bot/package.json ./package.json

ENV NODE_ENV=production \
    SESSION_DIR=/app/sessions

# Sessions volume — mount this in your host (Railway volume, Fly volume).
VOLUME ["/app/sessions"]

# dumb-init reaps zombie Chromium subprocesses cleanly.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
