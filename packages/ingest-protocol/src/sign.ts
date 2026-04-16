import { createHmac } from 'node:crypto';

export const SIGNATURE_HEADER = 'x-gramola-signature';
export const TIMESTAMP_HEADER = 'x-gramola-timestamp';

/**
 * HMAC-SHA256 over `timestamp.rawBody` using the shared INGEST_SECRET.
 *
 * The signature format is explicit about *what* was signed (the timestamp AND the body)
 * so a replay after our window has passed is rejected even if an attacker can reuse
 * the exact bytes.
 */
export function sign(rawBody: string, secret: string, nowSeconds: number = Math.floor(Date.now() / 1000)) {
  if (!secret) {
    throw new Error('ingest-protocol: sign() called with empty secret');
  }
  const timestamp = nowSeconds.toString();
  const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return { timestamp, signature };
}
