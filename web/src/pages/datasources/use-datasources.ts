import { useCallback, useState } from 'react'

import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import {
  useCreateDatasource,
  useDatasources,
  useDeleteDatasource,
  useTestDatasource,
  useUpdateDatasource,
  type CreateDatasourceInput,
  type Datasource,
  type UpdateDatasourceInput,
} from '@/lib/api/datasources'

const defaultForm: CreateDatasourceInput = {
  name: '',
  type: 'mysql',
  host: '',
  port: 3306,
  username: '',
  password: '',
  database: '',
  remark: '',
}

export function useDatasourcesPage() {

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingID, setEditingID] = useState<number | null>(null)
  const [form, setForm] = useState<CreateDatasourceInput>(defaultForm)
  const needCount = true
  const query = useDatasources({ page, pageSize, needCount })
  const { data, refetch } = query
  const createMutation = useCreateDatasource()
  const updateMutation = useUpdateDatasource()
  const deleteMutation = useDeleteDatasource()
  const testMutation = useTestDatasource()

  const resetForm = () => setForm(defaultForm)

  const handleCreate = async () => {
    if (!form.name || !form.host || !form.username || !form.password) {
      toast.error('请填写必填字段')
      return
    }
    try {
      await createMutation.mutateAsync(form)
      toast.success('数据源创建成功')
      setCreateOpen(false)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '数据源创建失败'))
    }
  }

  const openEdit = useCallback((ds: Datasource) => {
    setEditingID(Number(ds.id))
    setForm({
      name: ds.name,
      type: ds.type,
      host: ds.host,
      port: ds.port,
      username: ds.username,
      password: '',
      database: '',
      remark: ds.remark ?? '',
    })
    setEditOpen(true)
  }, [])

  const handleUpdate = async () => {
    if (!editingID) return
    if (!form.name || !form.host || !form.username) {
      toast.error('请填写必填字段')
      return
    }
    try {
      const payload: UpdateDatasourceInput = { id: editingID, ...form }
      if (!payload.password) delete payload.password
      await updateMutation.mutateAsync(payload)
      toast.success('数据源更新成功')
      setEditOpen(false)
      setEditingID(null)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '数据源更新失败'))
    }
  }

  const handleDelete = useCallback(async (ds: Datasource) => {
    if (!window.confirm(`确认删除数据源 ${ds.name}？`)) return
    try {
      await deleteMutation.mutateAsync(Number(ds.id))
      toast.success('数据源删除成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '数据源删除失败'))
    }
  }, [deleteMutation])

  const handleTestConnection = useCallback(async (id: number) => {
    try {
      const result = await testMutation.mutateAsync(id)
      if (result.success) {
        toast.success(result.message || '连接测试成功')
      } else {
        toast.error(result.message || '连接测试失败')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, '连接测试失败'))
    }
  }, [testMutation])

  return {
    page, setPage,
    pageSize, setPageSize,
    createOpen, setCreateOpen,
    editOpen, setEditOpen,
    editingID, setEditingID,
    form, setForm,
    query, data, refetch,
    createMutation, updateMutation, deleteMutation, testMutation,
    handleCreate, handleUpdate, handleDelete,
    handleTestConnection, openEdit, resetForm, needCount,
  }
}
