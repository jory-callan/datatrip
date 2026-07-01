import { useMemo, useState } from 'react'

import { toast } from 'sonner'

import { useUpdateUser, useUsers } from '@/lib/api/users'
import type { User } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api-client'

export function usePermissionConfig() {

  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const { data: usersData, isLoading: usersLoading } = useUsers({ page: 1, pageSize: 200, needCount: false })
  const allUsers = useMemo(() => usersData?.list ?? [], [usersData?.list])
  const updateUser = useUpdateUser()

  const filteredUsers = useMemo(() => {
    if (!search) return allUsers
    const q = search.toLowerCase()
    return allUsers.filter((u) => u.username.toLowerCase().includes(q) || (u.nickname ?? '').toLowerCase().includes(q))
  }, [allUsers, search])

  const handleRoleChange = async (userId: number, roleCode: string) => {
    try {
      const user = allUsers.find((u) => u.id === userId)
      const payload = {
        id: userId,
        username: user?.username ?? '',
        role_code: roleCode,
      }
      await updateUser.mutateAsync(payload)
      toast.success('角色分配已保存')
      setSelectedUser((prev) => prev?.id === userId ? { ...prev, role_code: roleCode } : prev)
    } catch (error) {
      toast.error(getApiErrorMessage(error, '角色分配保存失败'))
    }
  }

  return {
    search,
    setSearch,
    selectedUser,
    setSelectedUser,
    allUsers,
    filteredUsers,
    usersLoading,
    handleRoleChange,
    updatePending: updateUser.isPending,
  }
}
