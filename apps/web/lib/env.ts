import { z } from 'zod';

/**
 * Runtime env validation. Kept separate from `process.env` so we:
 *   - fail fast on boot if required vars are missing
 *   - type narrow throughout the app
 *   - document each var in one place
 *
 * NEXT_PUBLIC_* variables are the only ones safe to reference from client
 * components. Everything else must only be imported from server code.
 */

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  INGEST_SECRET: z.string().min(32, 'INGEST_SECRET must be at least 32 characters'),
  // SESSION_SECRETS can be a single secret or a JSON array for rotation.
  SESSION_SECRET: z.string().min(32).optional(),
  SESSION_SECRETS: z.string().optional(),
  SITE_URL: z.string().url().default('http://localhost:3000'),
  RATE_LIMIT_UPSTASH_URL: z.string().url().optional(),
  RATE_LIMIT_UPSTASH_TOKEN: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_NAME: z.string().default('Gramola'),
});

const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
});

export const clientEnvVars = clientEnv;

/** Lazy server env — only parsed when first accessed from server code. */
let _serverEnv: z.infer<typeof serverSchema> | undefined;
export function serverEnv() {
  if (_serverEnv) return _serverEnv;
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv() called from the browser');
  }
  _serverEnv = serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    INGEST_SECRET: process.env.INGEST_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
    SESSION_SECRETS: process.env.SESSION_SECRETS,
    SITE_URL: process.env.SITE_URL,
    RATE_LIMIT_UPSTASH_URL: process.env.RATE_LIMIT_UPSTASH_URL,
    RATE_LIMIT_UPSTASH_TOKEN: process.env.RATE_LIMIT_UPSTASH_TOKEN,
  });
  return _serverEnv;
}

/**
 * iron-session accepts either a single string password OR a PasswordsMap
 * (object keyed by id). For v1 we only support a single string — rotation
 * can be added later by switching SESSION_SECRETS to a JSON object:
 *   SESSION_SECRETS='{"2":"newer-32+","1":"older-32+"}'
 */
export function sessionPasswords(): string | { [id: string]: string } {
  const s = serverEnv();
  if (s.SESSION_SECRETS) {
    try {
      const parsed: unknown = JSON.parse(s.SESSION_SECRETS);
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        Object.values(parsed as Record<string, unknown>).every(
          (x) => typeof x === 'string' && x.length >= 32,
        )
      ) {
        return parsed as Record<string, string>;
      }
      throw new Error('SESSION_SECRETS must be a JSON object of id→32+ char string');
    } catch (err) {
      throw new Error(`Invalid SESSION_SECRETS: ${(err as Error).message}`);
    }
  }
  if (s.SESSION_SECRET) return s.SESSION_SECRET;
  throw new Error('Provide SESSION_SECRET or SESSION_SECRETS (JSON object)');
}
