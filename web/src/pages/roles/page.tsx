import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function RolesPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/users', { replace: true })
  }, [navigate])

  return null
}
