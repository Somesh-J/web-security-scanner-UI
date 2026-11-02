import { create } from 'zustand'

interface UiState {
  /** The one global "New scan" dialog, opened from the top bar, palette, pages and checklist. */
  newScan: { open: boolean; targetId?: string }
  paletteOpen: boolean
  openNewScan: (targetId?: string) => void
  setNewScanOpen: (open: boolean) => void
  setPaletteOpen: (open: boolean) => void
}

/** Transient UI state shared across the shell (not persisted). */
export const useUiStore = create<UiState>()((set) => ({
  newScan: { open: false },
  paletteOpen: false,
  openNewScan: (targetId) => set({ newScan: { open: true, targetId } }),
  setNewScanOpen: (open) => set((s) => ({ newScan: { ...s.newScan, open } })),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}))
