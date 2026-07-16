import { useCallback, useMemo, useState } from 'react'

import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, type Role } from '@/lib/api/roles'
import { usePermissions } from '@/lib/api/permissions'
import { useRolePermissions, useAssignPermission, useUnassignPermission } from '@/lib/api/role-permissions'

import { useRolesStore } from './store'

export function useRolesPage() {
  const roleQuery = useRoles()
  const { data, refetch } = roleQuery
  const allRoles = useMemo(() => data ?? [], [data])

  // ---- DataTable row selection (internal only) ----
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const deleteMutation = useDeleteRole()

  const handleCreate = async () => {
    const { form } = useRolesStore.getState()
    if (!form.code || !form.name) {
      toast.error('请填写角色标识和角色名称')
      return
    }
    try {
      await createMutation.mutateAsync({
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      })
      toast.success('角色创建成功')
      useRolesStore.getState().closeDialogs()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '创建角色失败'))
    }
  }

  const handleUpdate = async () => {
    const { editingID, form } = useRolesStore.getState()
    if (!editingID || !form.name) {
      toast.error('请填写角色名称')
      return
    }
    try {
      await updateMutation.mutateAsync({
        id: editingID,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      })
      toast.success('角色更新成功')
      useRolesStore.getState().closeDialogs()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '更新角色失败'))
    }
  }

  const handleDelete = useCallback(async (role: Role) => {
    if (!window.confirm(`确认删除角色「${role.name}」？关联的用户权限将同时移除。`)) return
    try {
      await deleteMutation.mutateAsync(role.id)
      toast.success('角色删除成功')
      if (selectedRoleId === role.id) {
        setSelectedRoleId(null)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, '删除角色失败'))
    }
  }, [deleteMutation, selectedRoleId])

  const handleBatchDelete = useCallback(async (rows: Role[]) => {
    if (!rows.length) return
    if (!window.confirm(`确认删除已选 ${rows.length} 个角色？关联的用户权限将同时移除。`)) return
    let success = 0
    for (const role of rows) {
      try {
        await deleteMutation.mutateAsync(role.id)
        if (selectedRoleId === role.id) {
          setSelectedRoleId(null)
        }
        success++
      } catch (err) {
        toast.error(getApiErrorMessage(err, `删除「${role.name}」失败`))
      }
    }
    if (success > 0) {
      toast.success(`${success} 个角色已删除`)
      void refetch()
    }
  }, [deleteMutation, refetch, selectedRoleId])

  // ---- Permission assignment ----
  const { data: permissions, isLoading: permsLoading } = usePermissions()

  const assignPermsRoleId = useRolesStore((s) => s.assignPermsRoleId)
  const { data: rolePerms, isFetching: rolePermsLoading, refetch: refetchRolePerms } = useRolePermissions(assignPermsRoleId)
  const assignedPermIds = useMemo(
    () => new Set((rolePerms ?? []).map((rp) => rp.permission_id)),
    [rolePerms],
  )

  const assignPerm = useAssignPermission()
  const unassignPerm = useUnassignPermission()

  const handleTogglePermission = useCallback(async (permId: string) => {
    const roleId = useRolesStore.getState().assignPermsRoleId
    if (!roleId) return
    const isAssigned = assignedPermIds.has(permId)
    try {
      if (isAssigned) {
        await unassignPerm.mutateAsync({ roleId, permissionId: permId })
        toast.success('权限码已解绑')
      } else {
        await assignPerm.mutateAsync({ roleId, permissionId: permId })
        toast.success('权限码已绑定')
      }
      void refetchRolePerms()
    } catch (err) {
      toast.error(getApiErrorMessage(err, isAssigned ? '解绑权限码失败' : '绑定权限码失败'))
    }
  }, [assignedPermIds, assignPerm, unassignPerm, refetchRolePerms])

  const { assignPermSearch } = useRolesStore()
  const filteredPermissions = useMemo(() => {
    if (!permissions) return []
    if (!assignPermSearch) return permissions
    const q = assignPermSearch.toLowerCase()
    return permissions.filter(
      (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    )
  }, [permissions, assignPermSearch])

  const selectedPermId = useRolesStore((s) => s.selectedPermId)
  const selectedPermission = useMemo(() => {
    if (!selectedPermId || !permissions) return null
    return permissions.find((p) => p.id === selectedPermId) ?? null
  }, [permissions, selectedPermId])

  return {
    // Role list
    allRoles,
    rolesLoading: roleQuery.isLoading,
    refetch,
    // Mutations
    createMutation, updateMutation, deleteMutation,
    // Handlers
    handleCreate, handleUpdate, handleDelete, handleBatchDelete,
    // Permission assignment
    permsLoading,
    rolePermsLoading,
    assignedPermIds,
    filteredPermissions,
    selectedPermission,
    handleTogglePermission,
    assignPermPending: assignPerm.isPending,
    unassignPermPending: unassignPerm.isPending,
  }
}
