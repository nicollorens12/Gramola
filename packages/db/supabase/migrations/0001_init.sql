-- 0001_init.sql — core tables for Gramola.
-- Posts are created by the bot via service-role; comments by anon visitors through a server route.

create extension if not exists pgcrypto;

-- Provider taxonomy — keeps us honest at the DB level.
create type provider as enum (
  'youtube',
  'spotify',
  'apple_music',
  'bandcamp',
  'soundcloud',
  'other',
  'none'           -- free-text title, no link
);

-- Playback strategy decided at post creation time and cached on the row.
create type playback_strategy as enum (
  'youtube',       -- controllable via YouTube IFrame API
  'source_embed',  -- raw oEmbed iframe (SoundCloud/Bandcamp)
  'none'           -- no inline playback available
);

create table posts (
  id                 uuid primary key default gen_random_uuid(),
  -- Idempotency against WhatsApp retries and bot restarts.
  wa_message_id      text not null unique,
  -- Opaque hash of sender phone + shared secret; never rendered in UI.
  wa_sender_hash     text not null,
  title              text not null,
  comment            text,
  source_url         text,
  provider           provider not null default 'none',
  thumbnail_url      text,
  artist             text,
  duration_seconds   integer,
  youtube_id         text,
  embed_html         text,
  playback_strategy  playback_strategy not null default 'none',
  metadata_raw       jsonb,
  created_at         timestamptz not null default now()
);

create index posts_created_at_idx on posts (created_at desc);
create index posts_provider_idx   on posts (provider);

create table comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references posts(id) on delete cascade,
  -- Handle is snapshotted at insert time. Renames don't rewrite history (Reddit-style).
  handle       text not null,
  -- Opaque per-browser identifier, mirrors the signed cookie's identityId.
  identity_id  text not null,
  body         text not null check (length(body) between 1 and 4000),
  created_at   timestamptz not null default now()
);

create index comments_post_created_idx on comments (post_id, created_at asc);
create index comments_identity_idx     on comments (identity_id);

create table identities (
  id             text primary key,
  handle         text not null,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  renamed_count  integer not null default 0
);

create index identities_handle_lower_idx on identities (lower(handle));
