import { adjectives, musicNouns } from './wordlists';

const HANDLE_REGEX = /^[A-Za-z0-9_-]{3,32}$/;

/**
 * Generate a music-flavored handle like "Velvet-Reverb-412".
 * Not cryptographically unique — uniqueness is enforced by `identity_id`, not handle.
 */
export function generateHandle(rng: () => number = Math.random): string {
  const a = adjectives[Math.floor(rng() * adjectives.length)];
  const n = musicNouns[Math.floor(rng() * musicNouns.length)];
  const d = 100 + Math.floor(rng() * 900); // 100..999
  return `${a}-${n}-${d}`;
}

/**
 * Validate a user-supplied handle. Case is preserved but the regex enforces
 * ASCII-only so generated URLs and API responses stay clean.
 */
export function isValidHandle(s: unknown): s is string {
  return typeof s === 'string' && HANDLE_REGEX.test(s);
}

export { HANDLE_REGEX };
