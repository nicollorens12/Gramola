import 'server-only';
import { cookies } from 'next/headers';
import { getIronSession, type SessionOptions } from 'iron-session';
import { sessionPasswords } from '@/lib/env';

export interface SessionData {
  identityId: string;
  handle: string;
}

export const SESSION_COOKIE = 'gramola_session';

export function sessionOptions(): SessionOptions {
  return {
    cookieName: SESSION_COOKIE,
    password: sessionPasswords(),
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      // 2 years — anon visitors shouldn't have to regenerate identity often.
      maxAge: 60 * 60 * 24 * 365 * 2,
      path: '/',
    },
  };
}

/**
 * Read the session in an RSC / route handler. Callers must await this because
 * Next 15's `cookies()` helper is async. Creates an empty session object if none
 * exists — callers should check `session.identityId` to distinguish.
 */
export async function getSession() {
  const store = await cookies();
  return getIronSession<Partial<SessionData>>(store, sessionOptions());
}
