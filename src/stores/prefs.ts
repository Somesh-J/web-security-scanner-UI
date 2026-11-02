import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'system' | 'dark' | 'light'

export interface SavedView {
  id: string
  name: string
  /** A findings URL search string, for example "sev=critical,high&status=open". */
  search: string
}

interface PrefsState {
  theme: ThemeMode
  sidebarCollapsed: boolean
  /** The user closed the "Get started" checklist on the Overview page. */
  checklistDismissed: boolean
  savedViews: SavedView[]
  setTheme: (theme: ThemeMode) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setChecklistDismissed: (dismissed: boolean) => void
  saveView: (name: string, search: string) => void
  deleteView: (id: string) => void
}

/** User preferences. Persisted to localStorage; index.html reads the theme before first paint. */
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      checklistDismissed: false,
      savedViews: [],
      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setChecklistDismissed: (checklistDismissed) => set({ checklistDismissed }),
      saveView: (name, search) =>
        set((s) => ({ savedViews: [...s.savedViews, { id: `v_${Date.now().toString(36)}`, name, search }] })),
      deleteView: (id) => set((s) => ({ savedViews: s.savedViews.filter((v) => v.id !== id) })),
    }),
    { name: 'clearsite:prefs', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
)

export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode !== 'system') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
