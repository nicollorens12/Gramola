import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { log } from '../logger';

const { Client, LocalAuth } = pkg;

/**
 * Boot a whatsapp-web.js client with persistent auth. The session directory
 * must be a mounted volume in production — losing it means re-pairing by QR.
 *
 * We log (and print to stdout) any QR code. Operators must scan it within a
 * minute of first boot; after that, `LocalAuth` takes over.
 */
export function createWhatsAppClient(opts: { sessionDir: string }) {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: opts.sessionDir }),
    puppeteer: {
      // Use the system Chromium in container images for a smaller footprint.
      // Falls back to Puppeteer's bundled Chrome if the env var is unset.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', (qr) => {
    log.info('QR code received — scan within ~60s with WhatsApp → Linked Devices');
    qrcode.generate(qr, { small: true });
  });

  client.on('authenticated', () => log.info('authenticated'));
  client.on('auth_failure', (msg) => log.error({ msg }, 'auth failure'));
  client.on('ready', () => log.info('client ready'));
  client.on('disconnected', (reason) => log.warn({ reason }, 'disconnected'));

  return client;
}
