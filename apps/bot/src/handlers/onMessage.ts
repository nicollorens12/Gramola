import { createHash } from 'node:crypto';
import type { Message } from 'whatsapp-web.js';
import { resolveMetadata } from '@gramola/link-metadata';
import type { IngestPayload } from '@gramola/ingest-protocol';
import { parseCommand } from '../parser/parseCommand';
import { resolveYouTubeId } from '../youtube/resolveYouTubeId';
import { postToWeb } from '../ingest/postToWeb';
import type { SeenStore } from '../dedup/seenStore';
import { log } from '../logger';
import { parseYouTubeId } from '@gramola/link-metadata';

export interface HandlerConfig {
  groupId: string;
  bootTimeSeconds: number;
  bootCutoffSeconds: number;
  youtubeApiKey?: string;
  webBaseUrl: string;
  ingestSecret: string;
  seen: SeenStore;
}

/**
 * Full message handling pipeline.
 *
 * Drops are intentional: we want to be *very* conservative about what gets turned
 * into a post. Any ambiguity → ignore. The operator can always re-send.
 */
export async function handleMessage(msg: Message, config: HandlerConfig): Promise<void> {
  const waId = messageId(msg);
  const child = log.child({ waId, from: msg.from });

  // 1. Group filter: only the configured group can create posts.
  if (msg.from !== config.groupId) {
    // At debug level, surface the `from` of any group message we rejected —
    // makes WHATSAPP_GROUP_ID discoverable on first-time pairing without
    // polluting info-level logs once the right id is configured.
    if (msg.from.endsWith('@g.us')) {
      child.debug(
        { from: msg.from, preview: (msg.body ?? '').slice(0, 60) },
        'drop: wrong group',
      );
    }
    return;
  }

  // 2. Boot cutoff: ignore history the WA client replays on restart.
  //    `msg.timestamp` is seconds since epoch per whatsapp-web.js.
  if (msg.timestamp < config.bootTimeSeconds - config.bootCutoffSeconds) {
    child.debug('drop: message older than boot cutoff');
    return;
  }

  // 3. Command prefix: only `!`-prefixed messages are commands.
  const body = (msg.body ?? '').trim();
  if (!body.startsWith('!')) return;

  // 4. Dedup: fast LRU check. DB unique key is the real guarantee.
  if (config.seen.has(waId)) {
    child.debug('drop: already seen');
    return;
  }

  // 5. Parse the command body.
  const parsed = parseCommand(body.slice(1));
  if (!parsed.link && !parsed.title) {
    child.debug({ body }, 'drop: empty after parse');
    return;
  }

  // 6. Resolve metadata + playback strategy.
  let payload: IngestPayload;
  try {
    payload = await buildPayload(waId, msg, parsed, config);
  } catch (err) {
    child.error({ err }, 'failed to build payload; dropping message');
    return;
  }

  // 7. POST to web. On success, mark seen.
  try {
    const result = await postToWeb(payload, {
      baseUrl: config.webBaseUrl,
      secret: config.ingestSecret,
    });
    await config.seen.add(waId);
    child.info({ postId: result.id, duplicate: result.duplicate }, 'ingested');
  } catch (err) {
    child.error({ err }, 'ingest POST failed; will retry on next emit');
    // We do NOT mark seen — so a retry can pick it up, subject to DB unique index.
  }
}

function messageId(msg: Message): string {
  // whatsapp-web.js message ids use `_serialized` for a stable string form.
  const raw = (msg.id as unknown as { _serialized?: string })._serialized;
  return raw ?? `${msg.from}:${msg.timestamp}:${msg.body?.length ?? 0}`;
}

async function buildPayload(
  waId: string,
  msg: Message,
  parsed: { link?: string; title?: string; comment?: string },
  config: HandlerConfig,
): Promise<IngestPayload> {
  const senderHash = hashSender(msg.author ?? msg.from, config.ingestSecret);

  // Title-only case: cheap, no network.
  if (!parsed.link) {
    return {
      waMessageId: waId,
      waSenderHash: senderHash,
      title: parsed.title!.slice(0, 500),
      comment: parsed.comment ?? null,
      sourceUrl: null,
      provider: 'none',
      thumbnailUrl: null,
      artist: null,
      durationSeconds: null,
      youtubeId: null,
      embedHtml: null,
      playbackStrategy: 'none',
      metadataRaw: null,
    };
  }

  const meta = await resolveMetadata(parsed.link);

  // For paid sources, try to find a YouTube equivalent so the bottom player
  // has controllable playback. We only pay this quota cost when needed.
  let youtubeId = meta.youtubeId ?? parseYouTubeId(parsed.link) ?? null;
  if (!youtubeId && (meta.provider === 'spotify' || meta.provider === 'apple_music')) {
    youtubeId = await resolveYouTubeId(
      { artist: meta.artist, title: meta.title },
      config.youtubeApiKey,
    );
  }

  const embedHtml = meta.embedHtml ?? null;
  const playbackStrategy: IngestPayload['playbackStrategy'] = youtubeId
    ? 'youtube'
    : embedHtml
      ? 'source_embed'
      : 'none';

  return {
    waMessageId: waId,
    waSenderHash: senderHash,
    title: meta.title.slice(0, 500),
    comment: parsed.comment ?? null,
    sourceUrl: parsed.link,
    provider: meta.provider,
    thumbnailUrl: meta.thumbnailUrl ?? null,
    artist: meta.artist ?? null,
    durationSeconds: meta.durationSeconds ?? null,
    youtubeId,
    embedHtml,
    playbackStrategy,
    metadataRaw: (meta.raw as Record<string, unknown> | null | undefined) ?? null,
  };
}

function hashSender(raw: string, secret: string): string {
  return createHash('sha256').update(`${raw}|${secret}`).digest('hex').slice(0, 32);
}
