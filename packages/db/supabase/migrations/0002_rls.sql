-- 0002_rls.sql — Row-level security.
-- Anon can SELECT posts and comments (for RSC reads + browser Realtime).
-- NO anon INSERT/UPDATE/DELETE anywhere — all writes go through Next.js API routes
-- using the service-role key, so we can enforce HMAC on ingest and rate limits on comments.

alter table posts      enable row level security;
alter table comments   enable row level security;
alter table identities enable row level security;

-- Public reads for posts + comments.
create policy posts_read_all    on posts    for select using (true);
create policy comments_read_all on comments for select using (true);

-- identities is default-deny for anon. Only the API route (service-role) can read/write.
-- No policies created → RLS blocks everything for the anon key, which is what we want.
