import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { serverEnv } from '@/lib/env';
import { verifyMetaSignature } from '@/lib/whatsapp/verifySignature';
import { processWhatsAppMessage } from '@/lib/whatsapp/processMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Meta webhook types (subset — only what we parse).
 */
interface WebhookBody {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          // Group messages include a context with group info
          context?: { from?: string; group_id?: string };
        }>;
      };
      field?: string;
    }>;
  }>;
}

/**
 * GET — Webhook verification. Meta sends a one-time challenge when you
 * register the webhook URL. We verify the token and echo back the challenge.
 *
 * Query params:
 *   hub.mode=subscribe
 *   hub.verify_token=<our WHATSAPP_VERIFY_TOKEN>
 *   hub.challenge=<random string from Meta>
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const env = serverEnv();
  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    console.info('[webhook] verification succeeded');
    return new Response(challenge ?? '', { status: 200 });
  }

  console.warn('[webhook] verification failed — bad token or mode');
  return NextResponse.json({ error: 'forbidden' }, { status: 403 });
}

/**
 * POST — Incoming messages. Meta signs the body with the app secret; we
 * verify before processing. We respond 200 immediately and process the
 * message in the background via `after()` so Meta doesn't time out.
 *
 * Only text messages starting with `!` from the configured group are
 * turned into posts. Everything else is silently ignored.
 */
export async function POST(req: Request) {
  const env = serverEnv();
  const raw = await req.text();

  // Verify signature.
  if (env.WHATSAPP_APP_SECRET) {
    const sig = req.headers.get('x-hub-signature-256');
    if (!verifyMetaSignature(raw, sig, env.WHATSAPP_APP_SECRET)) {
      console.warn('[webhook] bad signature');
      return NextResponse.json({ error: 'bad_signature' }, { status: 401 });
    }
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Extract text messages.
  const messages =
    body.entry
      ?.flatMap((e) => e.changes ?? [])
      .filter((c) => c.field === 'messages')
      .flatMap((c) => c.value?.messages ?? [])
      .filter((m) => m.type === 'text' && m.text?.body) ?? [];

  // Filter to the configured group (if set). When WHATSAPP_GROUP_ID is a
  // placeholder or unset, we accept all messages (useful during setup).
  const groupId = env.WHATSAPP_GROUP_ID;
  const relevant = groupId && !groupId.includes('placeholder')
    ? messages.filter((m) => m.context?.group_id === groupId)
    : messages;

  if (relevant.length > 0) {
    // Schedule background processing — respond 200 to Meta immediately.
    after(() => {
      for (const m of relevant) {
        processWhatsAppMessage({
          id: m.id,
          from: m.from,
          body: m.text!.body,
          timestamp: m.timestamp,
        }).catch((err) => console.error('[webhook] processMessage failed:', err));
      }
    });
  }

  // Always 200 — Meta retries on non-2xx and we don't want retries for messages
  // we intentionally ignore (wrong group, non-text, non-`!` prefix).
  return NextResponse.json({ ok: true });
}
