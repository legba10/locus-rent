import { create } from 'zustand'
import { User } from './types/user'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  initialized: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Инициализация при создании store
  const initialize = () => {
    if (typeof window !== 'undefined' && !get().initialized) {
      const token = localStorage.getItem('accessToken')
      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          set({ user, token, isAuthenticated: true, initialized: true })
        } catch (e) {
          console.error('Error parsing user from localStorage', e)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          set({ initialized: true })
        }
      } else {
        set({ initialized: true })
      }
    }
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    initialized: false,
    setAuth: (user, token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', token)
        localStorage.setItem('user', JSON.stringify(user))
      }
      set({ user, token, isAuthenticated: true, initialized: true })
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
      }
      set({ user: null, token: null, isAuthenticated: false })
    },
    initialize,
  }
})

// Инициализация при загрузке модуля
if (typeof window !== 'undefined') {
  // Небольшая задержка для гарантии, что DOM готов
  setTimeout(() => {
    useAuthStore.getState().initialize()
  }, 0)
}
