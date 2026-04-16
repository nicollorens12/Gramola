import { z } from 'zod';

/**
 * Wire shape of a bot → web ingest request. The bot resolves all metadata and
 * computes `playbackStrategy` before posting; the web endpoint only validates
 * and persists. This keeps the web app stateless and free of outbound HTTP.
 */
export const IngestPayloadSchema = z.object({
  waMessageId: z.string().min(1).max(200),
  waSenderHash: z.string().min(1).max(128),
  title: z.string().min(1).max(500),
  comment: z.string().max(2000).nullable().optional(),
  sourceUrl: z.string().url().max(2048).nullable().optional(),
  provider: z.enum([
    'youtube',
    'spotify',
    'apple_music',
    'bandcamp',
    'soundcloud',
    'other',
    'none',
  ]),
  thumbnailUrl: z.string().url().max(2048).nullable().optional(),
  artist: z.string().max(500).nullable().optional(),
  durationSeconds: z.number().int().positive().nullable().optional(),
  youtubeId: z
    .string()
    .regex(/^[A-Za-z0-9_-]{11}$/, 'youtubeId must be an 11-char video id')
    .nullable()
    .optional(),
  embedHtml: z.string().max(8000).nullable().optional(),
  playbackStrategy: z.enum(['youtube', 'source_embed', 'none']),
  metadataRaw: z.record(z.unknown()).nullable().optional(),
});

export type IngestPayload = z.infer<typeof IngestPayloadSchema>;
