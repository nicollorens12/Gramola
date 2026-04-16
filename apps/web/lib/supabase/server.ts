import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@gramola/db/types';
import { clientEnvVars } from '@/lib/env';

/**
 * Cookie-aware Supabase client for RSC and route handlers.
 *
 * We use the anon key here because RSC reads for posts/comments are permitted
 * by RLS. Writes never go through this client — they use {@link supabaseAdmin}.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    clientEnvVars.NEXT_PUBLIC_SUPABASE_URL,
    clientEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            for (const c of cookiesToSet) {
              cookieStore.set(c.name, c.value, c.options);
            }
          } catch {
            // `cookies()` is read-only in RSC — the middleware handles writes.
            // This catch is intentional and matches the @supabase/ssr recipe.
          }
        },
      },
    },
  );
}
