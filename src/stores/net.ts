import { create } from 'zustand'

interface NetState {
  latencyMs: number | null
  ok: boolean
  record: (latencyMs: number, ok: boolean) => void
}

/** Last API round-trip time and health, shown in the status bar. */
export const useNetStore = create<NetState>()((set) => ({
  latencyMs: null,
  ok: true,
  record: (latencyMs, ok) => set({ latencyMs: Math.round(latencyMs), ok }),
}))
