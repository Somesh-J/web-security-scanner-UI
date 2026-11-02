import { create } from 'zustand'

export type ToastTone = 'info' | 'success' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  detail?: string
  /** Optional follow-up such as "Undo" or "View issues". */
  action?: ToastAction
}

interface ToastState {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }))
    window.setTimeout(() => get().dismiss(id), toast.tone === 'error' ? 7000 : toast.action ? 6500 : 4500)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Shorthand usable outside React components (for example in mutation callbacks). */
export const toast = {
  info: (title: string, detail?: string, action?: ToastAction) =>
    useToastStore.getState().push({ tone: 'info', title, detail, action }),
  success: (title: string, detail?: string, action?: ToastAction) =>
    useToastStore.getState().push({ tone: 'success', title, detail, action }),
  error: (title: string, detail?: string, action?: ToastAction) =>
    useToastStore.getState().push({ tone: 'error', title, detail, action }),
}
