import { describe, expect, it } from 'vitest';
import { parseCommand } from './parseCommand';

describe('parseCommand', () => {
  it('parses a bare link', () => {
    const p = parseCommand('https://open.spotify.com/track/abc');
    expect(p.link).toBe('https://open.spotify.com/track/abc');
    expect(p.title).toBeUndefined();
    expect(p.comment).toBeUndefined();
  });

  it('parses a link with a comment', () => {
    const p = parseCommand('https://open.spotify.com/track/abc - this slaps');
    expect(p.link).toBe('https://open.spotify.com/track/abc');
    expect(p.comment).toBe('this slaps');
  });

  it('parses a title without a link', () => {
    const p = parseCommand('Tiny Desk concert');
    expect(p.title).toBe('Tiny Desk concert');
    expect(p.link).toBeUndefined();
  });

  it('parses a title with a comment', () => {
    const p = parseCommand('Tiny Desk concert - mic drop');
    expect(p.title).toBe('Tiny Desk concert');
    expect(p.comment).toBe('mic drop');
  });

  it('splits on the first " - " only', () => {
    const p = parseCommand('Title with - inside - extra tail');
    expect(p.title).toBe('Title with');
    expect(p.comment).toBe('inside - extra tail');
  });

  it('ignores empty input', () => {
    expect(parseCommand('')).toEqual({});
    expect(parseCommand('   ')).toEqual({});
  });

  it('treats surrounding text around a URL as a title', () => {
    const p = parseCommand('check https://example.com/song out');
    expect(p.title).toBe('check https://example.com/song out');
    expect(p.link).toBeUndefined();
  });
});
