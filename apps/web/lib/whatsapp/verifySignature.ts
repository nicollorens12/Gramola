import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify Meta's X-Hub-Signature-256 header. Meta signs every webhook payload
 * with `HMAC-SHA256(appSecret, rawBody)` and sends it as:
 *   X-Hub-Signature-256: sha256=<hex>
 *
 * Returns true if valid, false otherwise. Uses constant-time comparison.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader) return false;
  const [algo, sigHex] = signatureHeader.split('=');
  if (algo !== 'sha256' || !sigHex) return false;

  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  if (expected.length !== sigHex.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sigHex, 'hex'));
  } catch {
    return false;
  }
}
