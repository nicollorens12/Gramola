'use client';

import { useEffect } from 'react';
import { useIdentityStore } from './identityStore';

/**
 * Client-side bootstrap: hydrates the identity store from /api/identity once
 * per page load. Middleware sets the cookie; this just mirrors the values
 * into Zustand so the composer and header badge can read synchronously.
 *
 * Renders nothing. Placed in root layout so every route has identity available.
 */
export function IdentityBootstrap() {
  const setIdentity = useIdentityStore((s) => s.setIdentity);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/identity', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as { id: string; handle: string };
        if (!cancelled) setIdentity(json);
      } catch {
        /* network hiccups are non-fatal — middleware handles the cookie */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setIdentity]);

  return null;
}
