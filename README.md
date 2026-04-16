# Gramola

A music forum where threads are created by a bot listening to a WhatsApp group,
and anonymous visitors can comment under persistent, music-themed handles. The
site has a global bottom player that autoplays the newest thread on the home
page and whatever track belongs to an open thread.

Design doc: [`~/.claude/plans/zazzy-tinkering-taco.md`](/Users/nico/.claude/plans/zazzy-tinkering-taco.md)

## Monorepo layout

```
apps/
  web/                 Next.js 15 App Router → Vercel
  bot/                 whatsapp-web.js worker → Railway / Fly.io
packages/
  db/                  Supabase migrations + generated types
  ingest-protocol/     HMAC sign+verify + zod schema (bot ↔ web)
  link-metadata/       oEmbed / iTunes / OpenGraph resolver
  config-tsconfig/     Shared tsconfig bases
  config-eslint/       Shared ESLint config
```

## Stack

- **Web**: Next.js 15 App Router, TypeScript, Tailwind, `@supabase/ssr`, `iron-session`, Zustand, YouTube IFrame API.
- **Bot**: Node 20, `whatsapp-web.js` with `LocalAuth`, pino logs, HMAC to web `/api/ingest`.
- **Data**: Supabase Postgres + Realtime. No Supabase auth — anon RLS reads only, all writes through server routes.

## Getting started

```bash
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` runs `apps/web` (port 3000) and `apps/bot` in parallel. The bot won't
actually connect until you configure env vars (see below).

### Env setup

Copy the examples and fill in secrets:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/bot/.env.example apps/bot/.env
```

Critical:

- `INGEST_SECRET` must be **identical** in both `apps/web/.env.local` and `apps/bot/.env`.
- Generate strong values: `openssl rand -hex 32`.
- `SESSION_SECRET` (web) needs ≥32 chars.

### Database

```bash
# First time: create a Supabase project, then:
pnpm --filter @gramola/db db:push
pnpm --filter @gramola/db db:types  # regenerate types after schema changes
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
in `apps/web/.env.local` from the Supabase project settings.

### Running the bot locally

The bot needs Chromium. On macOS:

```bash
brew install --cask chromium
export PUPPETEER_EXECUTABLE_PATH="/Applications/Chromium.app/Contents/MacOS/Chromium"
```

First boot shows a QR code — scan it with WhatsApp → Linked Devices.
Subsequent boots load from `apps/bot/sessions/`.

To find your `WHATSAPP_GROUP_ID`: leave `WHATSAPP_GROUP_ID` set to a dummy value,
send any message in the target group, and watch the bot logs — they include
`from` for every incoming message (group ids look like `120363...@g.us`).

## Deployment

### Web (Vercel)

- Project root: `apps/web`
- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm turbo run build --filter=web`
- Set every var from `apps/web/.env.example` in Vercel Project → Settings → Environment Variables.

### Bot (Railway or Fly)

See `apps/bot/Dockerfile` and `apps/bot/fly.toml.example`. The bot needs:

- A persistent volume mounted at `/app/sessions` for the WhatsApp session + dedup log.
- All env vars from `apps/bot/.env.example`.
- ≥512 MB RAM (Chromium is hungry).

## Operator runbook

### First-time WhatsApp pairing
1. Deploy the bot with an empty `sessions/` volume.
2. Tail logs and watch for the QR code (printed to stdout).
3. Scan within ~60s from WhatsApp → Linked Devices.
4. On restart, LocalAuth resumes from the volume — no QR needed.

### Backing up the session
The `sessions/` volume is effectively your WhatsApp login. If you lose it, you
need to re-pair (and the operator's phone must still be reachable). Snapshot
it periodically (`fly volumes fork` / Railway's volume snapshot).

### YouTube quota
- Free quota: 10,000 units/day.
- Each `search.list` call costs 100 units → ~100 posts/day ceiling.
- When quota is exhausted, posts are still created — they just won't have
  inline YouTube playback for paid sources. Bot logs warn on `quotaExceeded`.

### Secret rotation
- `INGEST_SECRET`: add the new value to web first (support both during overlap
  via duplicate env var if you want), then rotate the bot, then retire the old.
- `SESSION_SECRET` → switch to `SESSION_SECRETS='["new","old"]'` on web to
  accept both cookies during rotation.

### Moderation escape hatch
v1 has no moderation UI. To remove a post, delete the row in Supabase Studio —
Realtime will notify clients on next refresh.

## Testing

```bash
pnpm test           # all packages
pnpm --filter @gramola/ingest-protocol test
pnpm --filter @gramola/link-metadata test
pnpm --filter @gramola/bot test
```

## License

Private project.
