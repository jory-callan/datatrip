import { useCallback, useState } from 'react'

import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import {
  useCreateDatasourceRule,
  useDatasourceRules,
  useUpdateDatasourceRule,
  type CreateDatasourceRuleInput,
  type DatasourceRule,
  type UpdateDatasourceRuleInput,
} from '@/lib/api/datasource-rules'

const defaultForm: CreateDatasourceRuleInput = {
  name: '',
  db_type: 'all',
  category: 'read',
  pattern: '',
  enabled: true,
}

export function useDatasourceRulesPage() {

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingID, setEditingID] = useState<number | null>(null)
  const [form, setForm] = useState<CreateDatasourceRuleInput>(defaultForm)
  const needCount = true
  const query = useDatasourceRules({ page, pageSize, needCount })
  const { data, refetch } = query
  const createMutation = useCreateDatasourceRule()
  const updateMutation = useUpdateDatasourceRule()

  const resetForm = () => setForm(defaultForm)

  const handleCreate = async () => {
    if (!form.name || !form.pattern) {
      toast.error('请填写必填字段')
      return
    }
    try {
      await createMutation.mutateAsync(form)
      toast.success('规则创建成功')
      setCreateOpen(false)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '规则创建失败'))
    }
  }

  const openEdit = useCallback((rule: DatasourceRule) => {
    setEditingID(Number(rule.id))
    setForm({
      name: rule.name,
      db_type: rule.db_type,
      category: rule.category,
      pattern: rule.pattern,
      enabled: rule.enabled,
    })
    setEditOpen(true)
  }, [])

  const handleUpdate = async () => {
    if (!editingID) return
    if (!form.name || !form.pattern) {
      toast.error('请填写必填字段')
      return
    }
    try {
      const payload: UpdateDatasourceRuleInput = { id: editingID, ...form }
      await updateMutation.mutateAsync(payload)
      toast.success('规则更新成功')
      setEditOpen(false)
      setEditingID(null)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '规则更新失败'))
    }
  }

  const handleToggleEnabled = useCallback(async (rule: DatasourceRule) => {
    try {
      const payload: UpdateDatasourceRuleInput = {
        id: Number(rule.id),
        name: rule.name,
        db_type: rule.db_type,
        category: rule.category,
        pattern: rule.pattern,
        enabled: !rule.enabled,
      }
      await updateMutation.mutateAsync(payload)
      toast.success('规则更新成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '规则更新失败'))
    }
  }, [updateMutation])

  return {
    page, setPage,
    pageSize, setPageSize,
    createOpen, setCreateOpen,
    editOpen, setEditOpen,
    editingID, setEditingID,
    form, setForm,
    query, data, refetch,
    createMutation, updateMutation,
    handleCreate, handleUpdate, openEdit,
    handleToggleEnabled, resetForm, needCount,
  }
}
