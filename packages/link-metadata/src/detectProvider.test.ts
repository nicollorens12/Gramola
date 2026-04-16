import { describe, expect, it } from 'vitest';
import { detectProvider, parseYouTubeId } from './detectProvider';

describe('detectProvider', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube'],
    ['https://youtu.be/dQw4w9WgXcQ', 'youtube'],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube'],
    ['https://open.spotify.com/track/xyz', 'spotify'],
    ['https://spoti.fi/3abc', 'spotify'],
    ['https://music.apple.com/us/album/abc/123', 'apple_music'],
    ['https://apple.co/1abc', 'apple_music'],
    ['https://artist.bandcamp.com/track/foo', 'bandcamp'],
    ['https://bandcamp.com/something', 'bandcamp'],
    ['https://soundcloud.com/user/track', 'soundcloud'],
    ['https://snd.sc/abc', 'soundcloud'],
    ['https://example.com/song', 'other'],
  ] as const)('detects %s as %s', (url, expected) => {
    expect(detectProvider(url)).toBe(expected);
  });
});

describe('parseYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=abc', 'dQw4w9WgXcQ'],
  ])('parses %s', (url, expected) => {
    expect(parseYouTubeId(url)).toBe(expected);
  });

  it('returns undefined for non-YouTube URLs', () => {
    expect(parseYouTubeId('https://open.spotify.com/track/xyz')).toBeUndefined();
  });

  it('returns undefined for malformed video ids', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=short')).toBeUndefined();
  });
});
