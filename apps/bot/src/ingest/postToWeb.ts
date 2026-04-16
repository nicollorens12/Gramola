import {
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  sign,
  type IngestPayload,
} from '@gramola/ingest-protocol';
import { log } from '../logger';

export interface IngestResult {
  id: string;
  duplicate: boolean;
}

/**
 * POST the signed payload to the web ingest endpoint. We serialize the payload
 * ourselves first so the exact bytes match what we signed — re-serializing in
 * fetch would produce different whitespace and break verification.
 */
export async function postToWeb(
  payload: IngestPayload,
  config: { baseUrl: string; secret: string },
): Promise<IngestResult> {
  const raw = JSON.stringify(payload);
  const { timestamp, signature } = sign(raw, config.secret);

  const url = new URL('/api/ingest', config.baseUrl).toString();
  const res = await fetch(url, {
    method: 'POST',
    body: raw,
    headers: {
      'Content-Type': 'application/json',
      [TIMESTAMP_HEADER]: timestamp,
      [SIGNATURE_HEADER]: signature,
    },
    // The web endpoint responds quickly; 10s is generous.
    signal: AbortSignal.timeout(10_000),
  });

  const body = (await res.json().catch(() => ({}))) as { id?: string; duplicate?: boolean; error?: string };

  if (!res.ok && res.status !== 200) {
    // 201 = created, 200 = duplicate. Everything else is a real failure.
    log.error({ status: res.status, body }, 'ingest failed');
    throw new Error(`ingest failed: ${res.status} ${body.error ?? ''}`);
  }
  if (!body.id) {
    throw new Error('ingest response missing id');
  }
  return { id: body.id, duplicate: body.duplicate ?? false };
}
