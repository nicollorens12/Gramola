'use client';

import { create } from 'zustand';

export interface Identity {
  id: string;
  handle: string;
}

interface IdentityState {
  identity: Identity | null;
  setIdentity: (i: Identity) => void;
  setHandle: (handle: string) => void;
}

export const useIdentityStore = create<IdentityState>((set) => ({
  identity: null,
  setIdentity: (identity) => set({ identity }),
  setHandle: (handle) =>
    set((s) => (s.identity ? { identity: { ...s.identity, handle } } : s)),
}));
