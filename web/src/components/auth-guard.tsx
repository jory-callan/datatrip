import { type ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { AuthLoadingScreen } from '@/components/auth-loading-screen'
import { useMe } from '@/lib/api/auth'
import { buildLoginRedirectPath } from '@/lib/auth-redirect'
import { useAppStore } from '@/stores/app-store'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation()
  const token = useAppStore((state) => state.token)
  const user = useAppStore((state) => state.user)
  const setUser = useAppStore((state) => state.setUser)
  const clearAuth = useAppStore((state) => state.clearAuth)
  const me = useMe(Boolean(token))

  useEffect(() => {
    if (me.data) {
      setUser(me.data)
    }
  }, [me.data, setUser])

  useEffect(() => {
    if (me.isError) {
      clearAuth()
    }
  }, [clearAuth, me.isError])

  if (!token) {
    return <Navigate to={buildLoginRedirectPath(location)} replace />
  }

  if (!user && (me.isLoading || me.isError)) {
    return <AuthLoadingScreen />
  }

  return children
}
