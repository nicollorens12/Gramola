import { env } from './env';
import { log } from './logger';
import { createWhatsAppClient } from './client/whatsapp';
import { handleMessage } from './handlers/onMessage';
import { SeenStore } from './dedup/seenStore';

async function main() {
  const e = env();
  log.info(
    { group: e.WHATSAPP_GROUP_ID, sessionDir: e.SESSION_DIR, bootCutoff: e.BOOT_CUTOFF_SECONDS },
    'gramola-bot booting',
  );

  const seen = new SeenStore({ dir: e.SESSION_DIR });
  await seen.init();

  const client = createWhatsAppClient({ sessionDir: e.SESSION_DIR });
  const bootTimeSeconds = Math.floor(Date.now() / 1000);

  client.on('message', (msg) => {
    handleMessage(msg, {
      groupId: e.WHATSAPP_GROUP_ID,
      bootTimeSeconds,
      bootCutoffSeconds: e.BOOT_CUTOFF_SECONDS,
      youtubeApiKey: e.YOUTUBE_API_KEY,
      webBaseUrl: e.WEB_BASE_URL,
      ingestSecret: e.INGEST_SECRET,
      seen,
    }).catch((err) => log.error({ err }, 'unhandled handler error'));
  });

  // Graceful shutdown: destroying the client flushes the session state.
  const shutdown = async (signal: string) => {
    log.info({ signal }, 'shutting down');
    try {
      await client.destroy();
    } catch (err) {
      log.warn({ err }, 'error during client.destroy');
    }
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await client.initialize();
}

main().catch((err) => {
  log.fatal({ err }, 'fatal during boot');
  process.exit(1);
});
