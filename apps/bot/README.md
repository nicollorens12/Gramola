# @gramola/bot

WhatsApp listener that converts `!`-prefixed group messages into blog posts on
Gramola via the web's `/api/ingest` endpoint.

## Scripts

```bash
pnpm dev          # tsx watch mode
pnpm build
pnpm start        # node dist/index.js
pnpm typecheck
pnpm test
```

## Message contract

```
![link] - [optional comment]
![title] - [optional comment]
```

- Only messages from the configured group (`WHATSAPP_GROUP_ID`) are considered.
- The bot author on the site is always `Gramola`, regardless of WA sender.
- Link providers supported: YouTube, Spotify, Apple Music, Bandcamp, SoundCloud,
  plus OpenGraph fallback for anything else.
- For paid sources (Spotify, Apple Music), the bot tries to resolve a YouTube
  equivalent at post time so the bottom player has controllable playback.

## Dedup layers

1. In-memory LRU keyed on WhatsApp message id.
2. Disk-persisted `sessions/seen.jsonl` — warmed on boot so cold starts are safe.
3. Boot cutoff: ignore messages older than `BOOT_TIME - BOOT_CUTOFF_SECONDS`
   (default 300s). Prevents "restart replays the last 3 days of history".
4. DB unique index on `posts.wa_message_id` (the real guarantee).

## Env

See `.env.example`. Required:

- `WEB_BASE_URL` — the Vercel URL of the web app.
- `INGEST_SECRET` — must match web's exactly.
- `WHATSAPP_GROUP_ID` — e.g. `120363...@g.us` (find it by sending a test message and reading bot logs).
- `SESSION_DIR` — persistent directory for WhatsApp session + dedup log.
- Optional: `YOUTUBE_API_KEY` — enables YouTube resolution for Spotify/Apple Music links.

## Deploy

```bash
# Fly.io:
fly launch --no-deploy
fly volumes create gramola_sessions --size 1 --region mad
fly secrets set INGEST_SECRET=... WEB_BASE_URL=... WHATSAPP_GROUP_ID=... YOUTUBE_API_KEY=...
fly deploy

# Railway: point at the monorepo, set root to apps/bot,
# attach a 1GB volume at /app/sessions, paste the same env vars.
```

## Runbook

- **First boot**: scan the QR code from stdout within ~60s.
- **Losing the session**: if `sessions/` is wiped, you need to re-pair. Back it up.
- **YouTube quota**: ~100 searches/day. Bot logs warn on `quotaExceeded`.
  Posts still get created; inline playback degrades to source embeds or external-open cards.
- **Shutdown**: SIGTERM triggers a clean `client.destroy()` so the session saves.
