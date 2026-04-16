import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@gramola/db/types';
import { clientEnvVars, serverEnv } from '@/lib/env';

/**
 * Server-only Supabase client using the service-role key. Bypasses RLS, so
 * ONLY import from API routes and server utilities — never from a RSC that
 * could accidentally leak data under RLS expectations.
 */
let _admin: ReturnType<typeof createClient<Database>> | undefined;
export function supabaseAdmin() {
  if (_admin) return _admin;
  _admin = createClient<Database>(
    clientEnvVars.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return _admin;
}
