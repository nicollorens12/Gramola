-- 0003_realtime.sql — enable Supabase Realtime publication for the browser.
-- Home feed subscribes to posts INSERT; thread page subscribes to comments INSERT
-- filtered by post_id.

alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table comments;
