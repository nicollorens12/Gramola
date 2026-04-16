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