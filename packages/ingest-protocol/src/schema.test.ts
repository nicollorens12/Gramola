import { describe, expect, it } from 'vitest';
import { IngestPayloadSchema } from './schema';

describe('IngestPayloadSchema', () => {
  it('accepts a minimal free-text post', () => {
    const parsed = IngestPayloadSchema.parse({
      waMessageId: 'wa:1',
      waSenderHash: 'abc123',
      title: 'Random thought',
      provider: 'none',
      playbackStrategy: 'none',
    });
    expect(parsed.title).toBe('Random thought');
    expect(parsed.provider).toBe('none');
  });

  it('accepts a full YouTube-linked post', () => {
    const parsed = IngestPayloadSchema.parse({
      waMessageId: 'wa:2',
      waSenderHash: 'hash',
      title: 'Great track',
      comment: 'absolutely stunning',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      provider: 'youtube',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      artist: 'Rick Astley',
      durationSeconds: 212,
      youtubeId: 'dQw4w9WgXcQ',
      playbackStrategy: 'youtube',
      metadataRaw: { provider_name: 'YouTube' },
    });
    expect(parsed.youtubeId).toBe('dQw4w9WgXcQ');
    expect(parsed.playbackStrategy).toBe('youtube');
  });

  it('rejects a malformed youtubeId', () => {
    expect(() =>
      IngestPayloadSchema.parse({
        waMessageId: 'wa:3',
        waSenderHash: 'hash',
        title: 'bad',
        provider: 'youtube',
        playbackStrategy: 'youtube',
        youtubeId: 'short',
      }),
    ).toThrow();
  });

  it('rejects an empty title', () => {
    expect(() =>
      IngestPayloadSchema.parse({
        waMessageId: 'wa:4',
        waSenderHash: 'hash',
        title: '',
        provider: 'none',
        playbackStrategy: 'none',
      }),
    ).toThrow();
  });

  it('rejects an unknown provider', () => {
    expect(() =>
      IngestPayloadSchema.parse({
        waMessageId: 'wa:5',
        waSenderHash: 'hash',
        title: 'x',
        provider: 'tidal',
        playbackStrategy: 'none',
      }),
    ).toThrow();
  });
});
