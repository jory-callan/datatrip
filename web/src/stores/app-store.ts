import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CurrentUser {
  id: string
  username: string
  nickname?: string
  email?: string
  phone?: string
  status?: string
  created_at?: string
}

type AppStore = {
  tablePageSize: number
  token: string | null
  user: CurrentUser | null
  setTablePageSize: (size: number) => void
  setAuth: (token: string, user: CurrentUser) => void
  setUser: (user: CurrentUser | null) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

const getInitialToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth-token')
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tablePageSize: 10,
      token: getInitialToken(),
      user: null,
      setTablePageSize: (tablePageSize) => set({ tablePageSize }),
      setAuth: (token, user) => {
        localStorage.setItem('auth-token', token)
        set({ token, user })
      },
      setUser: (user) => set({ user }),
      clearAuth: () => {
        localStorage.removeItem('auth-token')
        set({ token: null, user: null })
      },
      isAuthenticated: () => Boolean(get().token),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        tablePageSize: state.tablePageSize,
        token: state.token,
        user: state.user,
      }),
    }
  )
)
