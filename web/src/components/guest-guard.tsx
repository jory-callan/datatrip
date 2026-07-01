import { type ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

import { AuthLoadingScreen } from '@/components/auth-loading-screen'
import { useMe } from '@/lib/api/auth'
import { getLoggedInHomePath } from '@/lib/auth-redirect'
import { useAppStore } from '@/stores/app-store'

interface GuestGuardProps {
  children: ReactNode
}

export function GuestGuard({ children }: GuestGuardProps) {
  const token = useAppStore((state) => state.token)
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
    return children
  }

  if (me.data) {
    return <Navigate to={getLoggedInHomePath()} replace />
  }

  return <AuthLoadingScreen />
}
