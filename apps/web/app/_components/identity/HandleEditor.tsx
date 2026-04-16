'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIdentityStore } from './identityStore';
import { HANDLE_REGEX } from '@/lib/identity/handleGenerator';

interface HandleEditorProps {
  onClose: () => void;
}

/**
 * Minimal modal for renaming the handle. Intentionally pared down —
 * no focus trap library, no animation — since the surface is tiny.
 */
export function HandleEditor({ onClose }: HandleEditorProps) {
  const current = useIdentityStore((s) => s.identity?.handle ?? '');
  const setHandle = useIdentityStore((s) => s.setHandle);
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const valid = HANDLE_REGEX.test(value);

  async function submit() {
    if (!valid || status === 'saving') return;
    setStatus('saving');
    setError(null);
    try {
      const res = await fetch('/api/identity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error === 'invalid_handle' ? 'That handle isn’t valid.' : 'Could not save.');
      }
      const json = (await res.json()) as { id: string; handle: string };
      setHandle(json.handle);
      router.refresh();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit handle"
      className="fixed inset-0 z-50 flex items-end justify-center bg-canvas-0/70 backdrop-blur-sm p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-ink-faint bg-canvas-1 p-5 shadow-glow"
      >
        <h2 className="font-display text-xl text-ink-high">Change handle</h2>
        <p className="mt-1 text-sm text-ink-mid">
          Anything 3–32 chars, letters/digits/<code className="font-mono">-</code>/
          <code className="font-mono">_</code>.
        </p>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          className="mt-4 w-full rounded-lg border border-ink-faint bg-canvas-2 px-3 py-2 text-ink-high outline-none ring-offset-canvas-1 placeholder:text-ink-low focus:border-accent focus:ring-2 focus:ring-accent/40"
          aria-invalid={!valid}
          autoComplete="off"
          spellCheck={false}
        />
        {!valid && value ? (
          <p className="mt-2 text-xs text-hot">Use 3–32 chars: letters, digits, &quot;-&quot; or &quot;_&quot;.</p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-hot">{error}</p> : null}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-2 text-sm text-ink-mid hover:text-ink-high"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || status === 'saving'}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-canvas-0 transition-colors hover:bg-accent-soft disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
