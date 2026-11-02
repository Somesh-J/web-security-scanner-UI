import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Session } from '@/types/domain'

interface AuthState {
  session: Session | null
  signIn: (session: Session) => void
  signOut: () => void
  updateUser: (user: Session['user']) => void
}

/**
 * Holds the fake session token. Persisted to localStorage so a reload keeps you signed in.
 * There is no real authentication: the mock API issues a random token for the demo account.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      signIn: (session) => set({ session }),
      signOut: () => set({ session: null }),
      updateUser: (user) => set((s) => (s.session ? { session: { ...s.session, user } } : s)),
    }),
    { name: 'redcell:auth', storage: createJSONStorage(() => localStorage) },
  ),
)
