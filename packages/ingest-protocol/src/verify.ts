import { createHmac, timingSafeEqual } from 'node:crypto';

export type VerifyErrorCode =
  | 'missing_headers'
  | 'invalid_timestamp'
  | 'stale_timestamp'
  | 'bad_signature';

export class VerifyError extends Error {
  constructor(
    public code: VerifyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'VerifyError';
  }
}

export interface VerifyResult {
  timestamp: number;
}

export interface VerifyOptions {
  /** Allowed clock skew between bot and web, in seconds. Default: 300 (5 minutes). */
  clockSkewSeconds?: number;
  /** Override "now" for deterministic tests. Defaults to `Math.floor(Date.now() / 1000)`. */
  nowSeconds?: number;
}

/**
 * Verify a signed ingest request. Throws `VerifyError` on any failure; returns
 * `{ timestamp }` on success. Callers should catch `VerifyError` and map to 401.
 *
 * `rawBody` must be the exact bytes the sender signed — read from the request
 * stream before JSON.parse. Parsing and re-serializing will change whitespace
 * and break verification.
 */
export function verify(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
  options: VerifyOptions = {},
): VerifyResult {
  if (!secret) {
    throw new Error('ingest-protocol: verify() called with empty secret');
  }

  const { clockSkewSeconds = 300, nowSeconds = Math.floor(Date.now() / 1000) } = options;

  const tsRaw = headerValue(headers, 'x-gramola-timestamp');
  const sigRaw = headerValue(headers, 'x-gramola-signature');
  if (!tsRaw || !sigRaw) {
    throw new VerifyError('missing_headers', 'missing x-gramola-timestamp or x-gramola-signature');
  }

  const ts = Number.parseInt(tsRaw, 10);
  if (!Number.isFinite(ts) || ts <= 0) {
    throw new VerifyError('invalid_timestamp', 'timestamp header is not a positive integer');
  }

  if (Math.abs(nowSeconds - ts) > clockSkewSeconds) {
    throw new VerifyError('stale_timestamp', 'timestamp outside allowed skew window');
  }

  const expected = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
  if (!safeEqualHex(expected, sigRaw)) {
    throw new VerifyError('bad_signature', 'signature does not match');
  }

  return { timestamp: ts };
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() !== lower) continue;
    if (Array.isArray(v)) return v[0];
    return v;
  }
  return undefined;
}

/**
 * Length-safe constant-time hex comparison. `timingSafeEqual` throws if
 * buffers differ in length, so we guard that first and return false instead
 * (a caller-visible "different length" still leaks length, but that's OK
 * for a fixed-length hex digest).
 */
function safeEqualHex(expectedHex: string, actualHex: string): boolean {
  if (expectedHex.length !== actualHex.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(actualHex, 'hex'));
  } catch {
    return false;
  }
}
