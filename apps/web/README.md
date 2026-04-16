# @gramola/web

Next.js 15 App Router app hosted on Vercel.

## Scripts

```bash
pnpm dev         # localhost:3000
pnpm build
pnpm start
pnpm typecheck
pnpm test
```

## Structure

- `app/layout.tsx` — root layout; mounts `<PlayerBar/>` and `<IdentityBootstrap/>`
- `app/page.tsx` — home feed (RSC) + `<FeedLiveBridge/>` for Realtime inserts
- `app/thread/[id]/page.tsx` — thread detail with comments + autoplay
- `app/api/ingest/route.ts` — HMAC-auth bot ingestion
- `app/api/comments/route.ts` — cookie-auth anon comments (rate limited)
- `app/api/identity/route.ts` — GET/PATCH the visitor's handle
- `middleware.ts` — bootstraps the signed identity cookie on first request
- `app/_components/player/` — Zustand store + PlayerBar + YouTube/source-embed hosts
- `app/_components/feed/` — feed list + post cards + Realtime bridge
- `app/_components/thread/` — header + comment list/composer/bridge
- `app/_components/identity/` — handle badge + editor modal
- `lib/supabase/` — server / browser / service-role clients
- `lib/identity/` — handle generator + iron-session wrapper

## Env

See `.env.example`. Required at runtime:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INGEST_SECRET` (shared with bot)
- `SESSION_SECRET` (or `SESSION_SECRETS` as a JSON array for rotation)
- `SITE_URL`
- Optional: `RATE_LIMIT_UPSTASH_URL` + `RATE_LIMIT_UPSTASH_TOKEN` for
  cross-instance rate limiting (falls back to in-memory in dev).

## Vercel deploy

- Framework: Next.js (auto-detected)
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm turbo run build --filter=web`
- Root directory: `apps/web`
- Environment variables: set all from `.env.example`
- Region: match your Supabase region (e.g. `iad1` for US-East, `fra1` for EU)
