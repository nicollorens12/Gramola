import { LRUCache } from 'lru-cache';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { log } from '../logger';

/**
 * Two-layer dedup:
 *   - LRU in-memory (fast path, millisecond checks)
 *   - JSONL append-on-add on disk, so cold starts warm the LRU from the last
 *     N entries instead of ingesting a group's recent history.
 *
 * The DB's unique index on `wa_message_id` is the ultimate guarantee — this
 * class is a perf + noise filter so we don't slam the ingest endpoint with
 * certain-to-fail retries.
 */
export class SeenStore {
  private readonly lru: LRUCache<string, true>;
  private readonly file: string;
  private readonly warmLines: number;

  constructor(opts: { dir: string; max?: number; warmLines?: number }) {
    this.lru = new LRUCache({ max: opts.max ?? 10_000 });
    this.file = join(opts.dir, 'seen.jsonl');
    this.warmLines = opts.warmLines ?? 5_000;
  }

  async init(): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    try {
      const txt = await readFile(this.file, 'utf8');
      const lines = txt.split('\n').filter(Boolean).slice(-this.warmLines);
      for (const line of lines) {
        try {
          const { id } = JSON.parse(line) as { id: string };
          if (id) this.lru.set(id, true);
        } catch {
          /* skip malformed line */
        }
      }
      log.info({ warmed: lines.length }, 'seen-store warmed from disk');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        log.info('seen-store: no prior log, starting fresh');
        return;
      }
      log.warn({ err }, 'seen-store: could not read disk log');
    }
  }

  has(id: string): boolean {
    return this.lru.has(id);
  }

  async add(id: string): Promise<void> {
    if (this.lru.has(id)) return;
    this.lru.set(id, true);
    // Fire-and-forget disk write; if this fails, we still have the DB index.
    appendFile(this.file, JSON.stringify({ id, at: Date.now() }) + '\n').catch((err) => {
      log.warn({ err, id }, 'seen-store: disk append failed');
    });
  }
}
