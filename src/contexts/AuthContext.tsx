import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { authApi } from '../features/auth/services/authApi'
import type {
  AuthUser,
  LoginFormValues,
  RegisterFormValues,
} from '../features/auth/types/authTypes'
import { ApiError } from '../services/api'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginFormValues) => Promise<AuthUser>
  register: (payload: RegisterFormValues) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
  setUser: Dispatch<SetStateAction<AuthUser | null>>
}

type AuthProviderProps = {
  children: ReactNode
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.me()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      setUser(null)

      if (error instanceof ApiError && error.status === 401) {
        return null
      }

      throw error
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      try {
        const currentUser = await authApi.me()

        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (payload: LoginFormValues) => {
    const loggedUser = await authApi.login(payload)
    setUser(loggedUser)
    return loggedUser
  }, [])

  const register = useCallback(async (payload: RegisterFormValues) => {
    return authApi.register(payload)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        throw error
      }
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [isLoading, login, logout, refreshUser, register, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
