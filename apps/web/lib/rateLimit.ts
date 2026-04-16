import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { serverEnv } from '@/lib/env';

/**
 * Distributed rate limit via Upstash when configured. Falls back to a simple
 * per-process LRU counter in development (lost on restart, not safe across
 * Vercel instances — explicitly noted so we don't ship it to prod).
 *
 * Two independent bucket families:
 *   - `identity`: 10 writes/min/identity (primary defense)
 *   - `ip`:       30 writes/min/IP        (catches rotating cookies)
 */

type Limiter = {
  check(key: string): Promise<{ success: boolean; remaining: number; reset: number }>;
};

function makeUpstashLimiter(tokens: number, label: string): Limiter | undefined {
  const env = serverEnv();
  if (!env.RATE_LIMIT_UPSTASH_URL || !env.RATE_LIMIT_UPSTASH_TOKEN) return undefined;

  const redis = new Redis({
    url: env.RATE_LIMIT_UPSTASH_URL,
    token: env.RATE_LIMIT_UPSTASH_TOKEN,
  });
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, '60 s'),
    prefix: `gramola:rl:${label}`,
    analytics: false,
  });

  return {
    async check(key: string) {
      const r = await ratelimit.limit(key);
      return { success: r.success, remaining: r.remaining, reset: r.reset };
    },
  };
}

/** Process-local fallback. NOT safe across serverless instances. Dev-only. */
function makeMemoryLimiter(tokens: number): Limiter {
  const windowMs = 60_000;
  const hits = new Map<string, number[]>();
  return {
    async check(key: string) {
      const now = Date.now();
      const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      arr.push(now);
      hits.set(key, arr);
      // Prune the map opportunistically.
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.length === 0) hits.delete(k);
      }
      const remaining = Math.max(0, tokens - arr.length);
      return {
        success: arr.length <= tokens,
        remaining,
        reset: now + windowMs,
      };
    },
  };
}

let _identityLimiter: Limiter | undefined;
let _ipLimiter: Limiter | undefined;

export function identityLimiter(): Limiter {
  if (_identityLimiter) return _identityLimiter;
  _identityLimiter = makeUpstashLimiter(10, 'identity') ?? makeMemoryLimiter(10);
  return _identityLimiter;
}

export function ipLimiter(): Limiter {
  if (_ipLimiter) return _ipLimiter;
  _ipLimiter = makeUpstashLimiter(30, 'ip') ?? makeMemoryLimiter(30);
  return _ipLimiter;
}
