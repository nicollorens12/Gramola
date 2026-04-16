import { z } from 'zod';

const schema = z.object({
  WEB_BASE_URL: z.string().url(),
  INGEST_SECRET: z.string().min(32),
  WHATSAPP_GROUP_ID: z.string().min(1),
  YOUTUBE_API_KEY: z.string().optional(),
  SESSION_DIR: z.string().default('./sessions'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  BOOT_CUTOFF_SECONDS: z.coerce.number().int().nonnegative().default(300),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
});

export type BotEnv = z.infer<typeof schema>;

let _env: BotEnv | undefined;
export function env(): BotEnv {
  if (_env) return _env;
  _env = schema.parse(process.env);
  return _env;
}
