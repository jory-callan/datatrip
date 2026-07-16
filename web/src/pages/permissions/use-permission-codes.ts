import { useCallback, useState } from 'react'

import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import {
  usePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  usePermissionBindings,
  type Permission,
} from '@/lib/api/permissions'

interface PermFormData {
  code: string
  name: string
  module: string
  description: string
}

const defaultForm: PermFormData = {
  code: '',
  name: '',
  module: '',
  description: '',
}

export function usePermissionCodesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingID, setEditingID] = useState<string | null>(null)
  const [form, setForm] = useState<PermFormData>(defaultForm)

  // ---- View Bindings ----
  const [viewBindingsOpen, setViewBindingsOpen] = useState(false)
  const [viewingPermId, setViewingPermId] = useState<string | null>(null)

  const query = usePermissions()
  const { data, refetch } = query

  const createMutation = useCreatePermission()
  const updateMutation = useUpdatePermission()
  const deleteMutation = useDeletePermission()

  const { data: bindingsData, isLoading: bindingsLoading } = usePermissionBindings(viewingPermId)

  const resetForm = () => setForm(defaultForm)

  const handleCreate = async () => {
    if (!form.code || !form.name) {
      toast.error('请填写权限码和名称')
      return
    }
    try {
      await createMutation.mutateAsync({
        code: form.code.trim(),
        name: form.name.trim(),
        module: form.module.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      toast.success('权限码创建成功')
      setCreateOpen(false)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '创建权限码失败'))
    }
  }

  const openEdit = useCallback((perm: Permission) => {
    setEditingID(perm.id)
    setForm({
      code: perm.code,
      name: perm.name,
      module: perm.module ?? '',
      description: perm.description ?? '',
    })
    setEditOpen(true)
  }, [])

  const handleUpdate = async () => {
    if (!editingID) {
      toast.error('请选择要编辑的权限码')
      return
    }
    try {
      const payload: { id: string; name?: string; module?: string; description?: string } = { id: editingID }
      if (form.name?.trim()) payload.name = form.name.trim()
      if (form.module?.trim()) payload.module = form.module.trim()
      if (form.description?.trim()) payload.description = form.description.trim()
      await updateMutation.mutateAsync(payload)
      toast.success('权限码更新成功')
      setEditOpen(false)
      setEditingID(null)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '更新权限码失败'))
    }
  }

  const openViewBindings = useCallback((perm: Permission) => {
    setViewingPermId(perm.id)
    setViewBindingsOpen(true)
  }, [])

  const handleDelete = useCallback(async (perm: Permission) => {
    if (!window.confirm(`确认删除权限码「${perm.code}」？`)) return
    try {
      await deleteMutation.mutateAsync(perm.id)
      toast.success('权限码已删除')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '删除权限码失败'))
    }
  }, [deleteMutation])

  const handleBatchDelete = useCallback(async (rows: Permission[]) => {
    if (!rows.length) return
    if (!window.confirm(`确认删除已选 ${rows.length} 个权限码？`)) return
    let success = 0
    for (const perm of rows) {
      try {
        await deleteMutation.mutateAsync(perm.id)
        success++
      } catch (err) {
        toast.error(getApiErrorMessage(err, `删除「${perm.code}」失败`))
      }
    }
    if (success > 0) {
      toast.success(`${success} 个权限码已删除`)
      void refetch()
    }
  }, [deleteMutation, refetch])

  return {
    createOpen, setCreateOpen,
    editOpen, setEditOpen,
    editingID,
    form, setForm,
    query, data: data ?? [], refetch,
    createMutation, updateMutation, deleteMutation,
    handleCreate, handleUpdate, handleDelete, handleBatchDelete,
    openEdit, resetForm,
    // View bindings
    viewBindingsOpen, setViewBindingsOpen,
    viewingPermId,
    bindingsData, bindingsLoading,
    openViewBindings,
  }
}
