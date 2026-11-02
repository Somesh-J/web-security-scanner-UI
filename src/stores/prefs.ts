import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'system' | 'dark' | 'light'

export interface SavedView {
  id: string
  name: string
  /** A prompt query string, for example "sev:crit,high status:open". */
  query: string
}

export const DEFAULT_VIEWS: SavedView[] = [
  { id: 'v_triage', name: 'Needs triage', query: 'status:open sev:crit,high' },
  { id: 'v_confirmed', name: 'Confirmed, unfixed', query: 'status:confirmed sort:-severity' },
  { id: 'v_injection', name: 'Injection flaws', query: 'cat:A03 status:open,confirmed' },
]

interface PrefsState {
  theme: ThemeMode
  crt: boolean
  railPinned: boolean
  savedViews: SavedView[]
  promptHistory: string[]
  setTheme: (theme: ThemeMode) => void
  setCrt: (on: boolean) => void
  setRailPinned: (pinned: boolean) => void
  saveView: (name: string, query: string) => void
  deleteView: (id: string) => void
  pushHistory: (entry: string) => void
}

/** User preferences. Persisted to localStorage; index.html reads the theme before first paint. */
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      crt: false,
      railPinned: false,
      savedViews: DEFAULT_VIEWS,
      promptHistory: [],
      setTheme: (theme) => set({ theme }),
      setCrt: (crt) => set({ crt }),
      setRailPinned: (railPinned) => set({ railPinned }),
      saveView: (name, query) =>
        set((s) => ({ savedViews: [...s.savedViews, { id: `v_${Date.now().toString(36)}`, name, query }] })),
      deleteView: (id) => set((s) => ({ savedViews: s.savedViews.filter((v) => v.id !== id) })),
      pushHistory: (entry) =>
        set((s) => ({ promptHistory: [entry, ...s.promptHistory.filter((h) => h !== entry)].slice(0, 30) })),
    }),
    { name: 'redcell:prefs', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
)

export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode !== 'system') return mode
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}
