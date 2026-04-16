'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@gramola/db/types';
import { clientEnvVars } from '@/lib/env';

/**
 * Browser-side Supabase client used only for Realtime subscriptions (posts + comments).
 * Never imported from RSC. Reuses a single instance across the page to keep the
 * Realtime connection count down.
 */
let _client: ReturnType<typeof createBrowserClient<Database>> | undefined;
export function supabaseBrowser() {
  if (_client) return _client;
  _client = createBrowserClient<Database>(
    clientEnvVars.NEXT_PUBLIC_SUPABASE_URL,
    clientEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return _client;
}
