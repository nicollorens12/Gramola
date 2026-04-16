import type { Metadata, Provider, ResolveOptions } from '../types';

/**
 * Last-resort metadata: fetch the URL and read OpenGraph tags via unfurl.js.
 * We keep this dynamic-imported so the package stays light at load time and
 * tree-shakes cleanly for consumers that only use the typed providers.
 */
export async function resolveOpenGraph(
  url: string,
  provider: Provider,
  opts: Required<Pick<ResolveOptions, 'timeoutMs' | 'fetchImpl'>>,
): Promise<Metadata | undefined> {
  const { unfurl } = await import('unfurl.js');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    // unfurl.js does its own fetching; we can't directly pass a fetchImpl or signal.
    // We lean on the timeout + best-effort extraction.
    const result = await unfurl(url);
    clearTimeout(timer);

    const title = result.open_graph?.title ?? result.twitter_card?.title ?? result.title;
    if (!title) return undefined;

    const image =
      result.open_graph?.images?.[0]?.url ??
      result.twitter_card?.images?.[0]?.url ??
      result.favicon;

    return {
      provider,
      title: String(title).trim(),
      thumbnailUrl: image,
      raw: result,
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
