'use client';

import { useState } from 'react';
import { useIdentityStore } from './identityStore';
import { HandleEditor } from './HandleEditor';

/**
 * Header chip showing the current handle. Click to open the rename dialog.
 * Until the store hydrates (cookie not yet read), shows a gentle placeholder.
 */
export function HandleBadge() {
  const handle = useIdentityStore((s) => s.identity?.handle);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-ink-faint/70 bg-canvas-1/70 px-3 py-1 text-xs font-medium text-ink-mid transition-colors hover:border-accent/50 hover:text-accent"
        aria-label="Edit your handle"
      >
        {handle ?? '…'}
      </button>
      {open ? <HandleEditor onClose={() => setOpen(false)} /> : null}
    </>
  );
}
