import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { log } from '../logger';

const { Client, LocalAuth } = pkg;

interface CreateWhatsAppClientOpts {
  sessionDir: string;
  /**
   * When set, the bot requests an 8-digit pairing code for this phone number
   * instead of printing a QR. Phone must be E.164 digits only (no leading '+').
   * Useful when QR pairing hits WhatsApp's anti-abuse block.
   */
  pairingPhone?: string;
}

/**
 * Boot a whatsapp-web.js client with persistent auth. The session directory
 * must be a mounted volume in production — losing it means re-pairing.
 *
 * Pairing methods (whichever is configured):
 *   - QR code (default): `LocalAuth` produces a QR string, we render it as
 *     ASCII to stdout for the operator to scan.
 *   - Pairing code (when `pairingPhone` is set): on the first `qr` event we
 *     request an 8-digit code from WhatsApp and log it. The operator enters
 *     it in WhatsApp → Dispositivos vinculados → "Vincular con el número de
 *     teléfono".
 */
export function createWhatsAppClient(opts: CreateWhatsAppClientOpts) {
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

  // Only request a pairing code once per boot — the first `qr` event signals
  // that the client is ready to pair. Subsequent `qr` events are ignored in
  // pairing-code mode so we don't invalidate the previously-displayed code.
  let pairingCodeRequested = false;

  client.on('qr', async (qr) => {
    if (opts.pairingPhone) {
      if (pairingCodeRequested) return;
      pairingCodeRequested = true;
      try {
        // whatsapp-web.js exposes requestPairingCode on Client; the typings
        // sometimes lag the runtime, so we cast narrowly here.
        const code = await (client as unknown as {
          requestPairingCode: (phone: string) => Promise<string>;
        }).requestPairingCode(opts.pairingPhone);
        // Format as "XXXX-XXXX" for readability — WhatsApp accepts either form.
        const pretty = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
        log.info(
          { code: pretty, phone: opts.pairingPhone },
          '📱 PAIRING CODE READY — enter this in WhatsApp → Dispositivos vinculados → Vincular con número de teléfono',
        );
      } catch (err) {
        log.warn({ err }, 'requestPairingCode failed; falling back to QR for this attempt');
        pairingCodeRequested = false;
        log.info('QR code received — scan within ~60s with WhatsApp → Linked Devices');
        qrcode.generate(qr, { small: true });
      }
    } else {
      log.info('QR code received — scan within ~60s with WhatsApp → Linked Devices');
      qrcode.generate(qr, { small: true });
    }
  });

  client.on('authenticated', () => log.info('authenticated'));
  client.on('auth_failure', (msg) => log.error({ msg }, 'auth failure'));
  client.on('ready', () => log.info('client ready'));
  client.on('disconnected', (reason) => log.warn({ reason }, 'disconnected'));

  return client;
}
