/**
 * JSON fetch with timeout. Returns `undefined` instead of throwing on any failure —
 * the resolver cascades through providers and treats failure as "fall through".
 */
export async function fetchJson<T = unknown>(
  url: string,
  opts: {
    timeoutMs: number;
    fetchImpl: typeof fetch;
    headers?: Record<string, string>;
  },
): Promise<T | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await opts.fetchImpl(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Gramola/1.0 (+https://github.com/nicollorens12/Gramola)',
        ...opts.headers,
      },
    });
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/** HEAD fetch with redirect follow to expand URL shorteners. Returns final URL or original on failure. */
export async function expandShortener(
  url: string,
  opts: { timeoutMs: number; fetchImpl: typeof fetch },
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    // Some shorteners don't honor HEAD; fall back to GET with no body read.
    const res = await opts.fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Gramola/1.0 (+https://github.com/nicollorens12/Gramola)',
      },
    });
    return res.url || url;
  } catch {
    return url;
  } finally {
    clearTimeout(timer);
  }
}
