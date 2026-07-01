import { useEffect } from 'react'

import { useMe } from '@/lib/api/auth'
import { useAppStore } from '@/stores/app-store'

export function useProfile() {
  const storedUser = useAppStore((state) => state.user)
  const setUser = useAppStore((state) => state.setUser)
  const { data: user, isLoading, refetch } = useMe()
  const currentUser = user || storedUser

  useEffect(() => {
    if (user) {
      setUser(user)
    }
  }, [setUser, user])

  return { currentUser, isLoading, refetch }
}
