import { useState } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import { useLogin as useLoginMutation } from '@/lib/api/auth'
import { getPostLoginRedirect } from '@/lib/auth-redirect'
import { useAppStore } from '@/stores/app-store'

export function useLogin() {

  const navigate = useNavigate()
  const location = useLocation()
  const login = useLoginMutation()
  const setAuth = useAppStore((state) => state.setAuth)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const result = await login.mutateAsync({ username, password })
      setAuth(result.token, result.user)
      navigate(getPostLoginRedirect(location.search), { replace: true })
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, '用户名或密码错误')
      if (msg.includes('用户名') || msg.includes('密码')) {
        setError('用户名或密码错误')
      } else {
        setError(msg)
      }
      toast.error(msg)
    }
  }

  return {
    username,
    password,
    error,
    isPending: login.isPending,
    setUsername,
    setPassword,
    handleSubmit,
  }
}
