'use client';

import { usePlayerStore } from './usePlayerStore';

const ALLOWED_EMBED_HOSTS = [
  'w.soundcloud.com',
  'bandcamp.com',
  'embed.music.apple.com',
  'open.spotify.com',
];

const SAFE_IFRAME_ATTRS = new Set([
  'src',
  'width',
  'height',
  'frameborder',
  'allow',
  'allowfullscreen',
  'scrolling',
  'title',
]);

interface ParsedIframe {
  src: string;
  attrs: Record<string, string | true>;
}

/**
 * Parse the <iframe> we got from oEmbed and reconstruct it as a React element
 * rather than injecting raw HTML. Eliminates the DOMPurify + jsdom dep tree
 * (which breaks edge bundling via html-encoding-sniffer's ESM require) while
 * keeping the hostname allow-list discipline.
 *
 * Only a single top-level <iframe> with known attributes is accepted. The src
 * must match {@link ALLOWED_EMBED_HOSTS}. Anything else → render nothing.
 */
function parseIframe(html: string): ParsedIframe | null {
  const tagMatch = html.match(/<iframe\b([^>]*)>/i);
  if (!tagMatch) return null;
  const attrBlob = tagMatch[1] ?? '';

  const attrs: Record<string, string | true> = {};
  // `key="value"` | `key='value'` | bare `key`.
  const attrRe = /(\w[\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(attrBlob)) !== null) {
    const key = (m[1] ?? '').toLowerCase();
    if (!SAFE_IFRAME_ATTRS.has(key)) continue;
    const value = m[2] ?? m[3] ?? m[4];
    attrs[key] = value ?? true;
  }

  const src = typeof attrs.src === 'string' ? attrs.src : undefined;
  if (!src) return null;
  try {
    const u = new URL(src);
    const ok = ALLOWED_EMBED_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith(`.${h}`),
    );
    if (!ok) return null;
  } catch {
    return null;
  }
  return { src, attrs };
}

/**
 * Host for source-native embeds (SoundCloud, Bandcamp, and fallback Spotify/
 * Apple Music when we couldn't resolve a YouTube equivalent). A fresh iframe
 * is mounted on every track change — cheaper than trying to reuse state
 * across providers.
 *
 * We can't programmatically control playback here, so the PlayerBar's play
 * button acts as a "focus the embed" affordance rather than a true play/pause.
 */
export function SourceEmbedHost() {
  const embedHtml = usePlayerStore((s) =>
    s.current?.playbackStrategy === 'source_embed' ? (s.current.embedHtml ?? null) : null,
  );
  const postId = usePlayerStore((s) => s.current?.postId);

  if (!embedHtml) return null;
  const parsed = parseIframe(embedHtml);
  if (!parsed) return null;

  const { src, attrs } = parsed;

  return (
    <div className="overflow-hidden rounded-md">
      <iframe
        key={postId}
        src={src}
        title={typeof attrs.title === 'string' ? attrs.title : 'embedded track'}
        width={typeof attrs.width === 'string' ? attrs.width : '100%'}
        height={typeof attrs.height === 'string' ? attrs.height : '90'}
        allow={typeof attrs.allow === 'string' ? attrs.allow : undefined}
        allowFullScreen={'allowfullscreen' in attrs}
        scrolling={typeof attrs.scrolling === 'string' ? attrs.scrolling : undefined}
        className="block h-[90px] w-full"
      />
    </div>
  );
}
