import { useCallback, useMemo, useState } from 'react'

import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import {
  useBatchDeleteUsers,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
  type CreateUserInput,
  type UpdateUserInput,
  type User,
} from '@/lib/api/users'
import { useRoles } from '@/lib/api/roles'
import { useUserRoles, useAssignRole, useUnassignRole } from '@/lib/api/user-roles'
import { useRolePermissions } from '@/lib/api/role-permissions'
import { usePermissions } from '@/lib/api/permissions'

import { useUsersStore } from './store'

export function useUsersPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // ---- Reset Password (local form state that needs to be read by handlers) ----
  const [resetPwdValue, setResetPwdValue] = useState('')
  const [resetPwdConfirm, setResetPwdConfirm] = useState('')

  // ---- Assign Roles search (local) ----
  const [assignRoleSearch, setAssignRoleSearch] = useState('')

  // ---- Store ----
  const store = useUsersStore()

  const needCount = true
  const usersQuery = useUsers({ page, pageSize, needCount })
  const { data, refetch } = usersQuery
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const batchDeleteUsers = useBatchDeleteUsers()

  // ---- Roles (shared) ----
  const { data: rolesData } = useRoles()
  const allRoles = useMemo(() => rolesData ?? [], [rolesData])

  // ---- Role assignment for "分配角色" sheet ----
  const { data: assignRolesData, refetch: refetchAssignRoles } = useUserRoles(store.assignRolesUserId)
  const assignRoleIds = useMemo(
    () => new Set((assignRolesData ?? []).map((ur) => ur.role_id)),
    [assignRolesData],
  )

  const assignRole = useAssignRole()
  const unassignRole = useUnassignRole()

  // ---- Selected role permissions (for right panel of assign roles) ----
  const { data: rolePermsData } = useRolePermissions(store.assignRoleSelectedRoleId)
  const rolePermissionIds = useMemo(
    () => new Set((rolePermsData ?? []).map((rp) => rp.permission_id)),
    [rolePermsData],
  )

  const { data: allPermissionsData } = usePermissions()
  const allPermissions = useMemo(() => allPermissionsData ?? [], [allPermissionsData])

  const selectedRolePermissionDetails = useMemo(() => {
    return allPermissions.filter((p) => rolePermissionIds.has(p.id))
  }, [allPermissions, rolePermissionIds])

  const resetForm = store.resetForm

  const handleCreate = async () => {
    const form = useUsersStore.getState().form
    if (!form.username || !form.password) {
      toast.error('请填写必填字段')
      return
    }
    try {
      await createUser.mutateAsync(form as CreateUserInput)
      toast.success('用户创建成功')
      store.setCreateOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, '用户创建失败'))
    }
  }

  const openEdit = useCallback((user: User) => {
    store.openEdit(user)
  }, [])

  const handleUpdate = async () => {
    const state = useUsersStore.getState()
    if (!state.editingID) return
    if (!state.form.username) {
      toast.error('请填写必填字段')
      return
    }
    try {
      const payload: UpdateUserInput = { id: state.editingID }
      if (state.form.nickname) payload.nickname = state.form.nickname
      if (state.form.status) payload.status = state.form.status
      if (state.form.password) payload.password = state.form.password
      await updateUser.mutateAsync(payload)
      toast.success('用户更新成功')
      state.closeDialogs()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '用户更新失败'))
    }
  }

  // ---- Reset Password ----
  const openResetPassword = useCallback((user: User) => {
    store.openResetPassword(user)
    setResetPwdValue('')
    setResetPwdConfirm('')
  }, [])

  const handleResetPassword = async () => {
    const state = useUsersStore.getState()
    if (!state.resetPwdState.userId || !resetPwdValue) {
      toast.error('请输入新密码')
      return
    }
    if (resetPwdValue !== resetPwdConfirm) {
      toast.error('两次密码输入不一致')
      return
    }
    if (resetPwdValue.length < 6) {
      toast.error('密码长度至少 6 位')
      return
    }
    try {
      await updateUser.mutateAsync({
        id: state.resetPwdState.userId,
        password: resetPwdValue,
      })
      toast.success('密码重置成功')
      store.closeResetPwd()
      setResetPwdValue('')
      setResetPwdConfirm('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '密码重置失败'))
    }
  }

  function generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // ---- Assign Roles ----
  const openAssignRoles = useCallback((user: User) => {
    store.openAssignRoles(user)
    setAssignRoleSearch('')
  }, [])

  const handleAssignRole = useCallback(async (roleId: string) => {
    const userId = useUsersStore.getState().assignRolesUserId
    if (!userId) return
    try {
      await assignRole.mutateAsync({ userId, roleId })
      toast.success('角色已分配')
      void refetchAssignRoles()
    } catch (err) {
      toast.error(getApiErrorMessage(err, '分配角色失败'))
    }
  }, [assignRole, refetchAssignRoles])

  const handleUnassignRole = useCallback(async (roleId: string) => {
    const userId = useUsersStore.getState().assignRolesUserId
    if (!userId) return
    try {
      await unassignRole.mutateAsync({ userId, roleId })
      toast.success('角色已移除')
      void refetchAssignRoles()
    } catch (err) {
      toast.error(getApiErrorMessage(err, '移除角色失败'))
    }
  }, [unassignRole, refetchAssignRoles])

  const handleDelete = useCallback(async (user: User) => {
    if (!window.confirm(`确认删除用户 ${user.username}？`)) return
    try {
      await deleteUser.mutateAsync(user.id)
      toast.success('用户删除成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '用户删除失败'))
    }
  }, [deleteUser])

  const handleBatchDelete = async (rows: User[]) => {
    if (!rows.length) return
    if (!window.confirm(`确认删除已选 ${rows.length} 个用户？`)) return
    try {
      await batchDeleteUsers.mutateAsync(rows.map((row) => row.id))
      toast.success('用户删除成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '用户删除失败'))
    }
  }

  return {
    page, setPage, pageSize, setPageSize,
    usersQuery, data, refetch,
    createUser, updateUser, deleteUser, batchDeleteUsers,
    handleCreate, handleUpdate, handleDelete, handleBatchDelete,
    openEdit, resetForm,
    // Reset Password (local form helpers)
    resetPwdValue, setResetPwdValue,
    resetPwdConfirm, setResetPwdConfirm,
    openResetPassword, handleResetPassword,
    generateRandomPassword,
    // Assign Roles
    openAssignRoles,
    allRoles,
    assignRoleIds,
    handleAssignRole, handleUnassignRole,
    assignRolePending: assignRole.isPending,
    unassignRolePending: unassignRole.isPending,
    // Selected role permissions
    selectedRolePermissionDetails,
    // Search state (local)
    assignRoleSearch, setAssignRoleSearch,
    assignRoleSelectedRoleId: store.assignRoleSelectedRoleId,
    setAssignRoleSelectedRoleId: store.setAssignRoleSelectedRoleId,
  }
}
