import { useCallback, useState } from 'react'

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

const defaultForm: CreateUserInput = {
  username: '',
  password: '',
  nickname: '',
  role_code: 'developer',
  status: 'active',
}

export const ROLE_CODES = [
  { value: 'system_admin', label: 'system_admin' },
  { value: 'project_owner', label: 'project_owner' },
  { value: 'developer', label: 'developer' },
  { value: 'viewer', label: 'viewer' },
  { value: 'approver', label: 'approver' },
]

export function useUsersPage() {

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingUserID, setEditingUserID] = useState<number | null>(null)
  const [form, setForm] = useState<CreateUserInput>(defaultForm)
  const needCount = true
  const usersQuery = useUsers({ page, pageSize, needCount })
  const { data, refetch } = usersQuery
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const batchDeleteUsers = useBatchDeleteUsers()

  const resetForm = () => setForm(defaultForm)

  const handleCreate = async () => {
    if (!form.username || !form.password) {
      toast.error('请填写必填字段')
      return
    }
    try {
      await createUser.mutateAsync(form)
      toast.success('用户创建成功')
      setCreateOpen(false)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '用户创建失败'))
    }
  }

  const openEdit = useCallback((user: User) => {
    setEditingUserID(Number(user.id))
    setForm({
      username: user.username,
      password: '',
      nickname: user.nickname ?? '',
      status: user.status ?? 'active',
      role_code: user.role_code,
    })
    setEditOpen(true)
  }, [])

  const handleUpdate = async () => {
    if (!editingUserID) return
    if (!form.username) {
      toast.error('请填写必填字段')
      return
    }
    try {
      const payload: UpdateUserInput = { id: editingUserID, ...form }
      if (!payload.password) delete payload.password
      await updateUser.mutateAsync(payload)
      toast.success('用户更新成功')
      setEditOpen(false)
      setEditingUserID(null)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '用户更新失败'))
    }
  }

  const handleDelete = useCallback(async (user: User) => {
    if (!window.confirm(`确认删除用户 ${user.username}？`)) return
    try {
      await deleteUser.mutateAsync(Number(user.id))
      toast.success('用户删除成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '用户删除失败'))
    }
  }, [deleteUser])

  const handleBatchDelete = async (rows: User[]) => {
    if (!rows.length) return
    if (!window.confirm(`确认删除已选 ${rows.length} 个用户？`)) return
    try {
      await batchDeleteUsers.mutateAsync(rows.map((row) => Number(row.id)))
      toast.success('用户删除成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '用户删除失败'))
    }
  }

  return {
    page, setPage, pageSize, setPageSize,
    createOpen, setCreateOpen, editOpen, setEditOpen,
    editingUserID, setEditingUserID, form, setForm,
    usersQuery, data, refetch,
    createUser, updateUser, deleteUser, batchDeleteUsers,
    handleCreate, handleUpdate, handleDelete, handleBatchDelete,
    openEdit, resetForm, needCount,
  }
}
