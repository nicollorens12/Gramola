import pino from 'pino';
import { env } from './env';

const e = env();

export const log = pino({
  level: e.LOG_LEVEL,
  ...(e.NODE_ENV === 'production'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
        },
      }),
});
