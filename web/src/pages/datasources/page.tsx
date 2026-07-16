import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirmDelete } from '@/hooks/use-confirm-delete'
import { getApiErrorMessage } from '@/lib/api-client'
import {
  useBatchDeleteDatasource,
  useCreateDatasource,
  useDatasourceTypes,
  useDatasources,
  useDeleteDatasource,
  useTestDatasource,
  useUpdateDatasource,
} from '@/lib/api/datasources'
import type { UpdateDatasourceInput } from '@/lib/api/datasources'

import { useDatasourceColumns } from './columns'
import { DatasourceSheet } from './datasource-sheet'
import { useDatasourceStore } from './store'

export function DatasourcesPage() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page')) || 1
  const pageSize = Number(sp.get('pageSize')) || 20
  const filterType = sp.get('type') || '_all'

  const setPage = useCallback((p: number) => {
    setSp((prev) => { prev.set('page', String(p)); return prev })
  }, [setSp])
  const setPageSize = useCallback((ps: number) => {
    setSp((prev) => { prev.set('pageSize', String(ps)); prev.set('page', '1'); return prev })
  }, [setSp])

  // zustand store
  const { createOpen, editingID, form, setCreateOpen, resetForm } = useDatasourceStore()

  // API
  const query = useDatasources({ page, pageSize, needCount: true })
  const { data, refetch } = query
  const createMutation = useCreateDatasource()
  const updateMutation = useUpdateDatasource()
  const deleteMutation = useDeleteDatasource()
  const testMutation = useTestDatasource()
  const batchDeleteMutation = useBatchDeleteDatasource()

  const typesQuery = useDatasourceTypes()
  const typeOptions = useMemo(() => {
    if (!typesQuery.data || typesQuery.data.length === 0) return [{ value: 'mysql', label: 'MySQL' }]
    return typesQuery.data.flatMap((g) => g.types.map((t) => ({ value: t.type, label: t.label })))
  }, [typesQuery.data])

  // Confirm dialog
  const { confirm, ConfirmDialog } = useConfirmDelete()

  // Client-side filter: by type
  const filteredList = useMemo(() => {
    const list = data?.list ?? []
    if (filterType === '_all') return list
    return list.filter((ds) => ds.type === filterType)
  }, [data, filterType])

  // Handlers
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
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '数据源更新失败'))
    }
  }

  const handleDelete = useCallback(async (ds: { id: string; name: string }) => {
    const ok = await confirm({
      title: '删除数据源',
      description: `确认删除数据源「${ds.name}」？删除后不可恢复。`,
    })
    if (!ok) return
    try {
      await deleteMutation.mutateAsync(ds.id)
      toast.success('数据源删除成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '数据源删除失败'))
    }
  }, [deleteMutation, confirm])

  const handleBatchDelete = useCallback(async (rows: { id: string }[]) => {
    const ok = await confirm({
      title: '批量删除数据源',
      description: `确认删除选中的 ${rows.length} 个数据源？删除后不可恢复。`,
    })
    if (!ok) return
    try {
      await batchDeleteMutation.mutateAsync(rows.map((r) => r.id))
      toast.success(`已删除 ${rows.length} 个数据源`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, '批量删除失败'))
    }
  }, [batchDeleteMutation, confirm])

  const handleTestConnection = useCallback(async (id: string) => {
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

  const columns = useDatasourceColumns(
    (ds) => useDatasourceStore.getState().openEdit(ds),
    handleDelete,
    handleTestConnection,
    updateMutation.isPending,
    deleteMutation.isPending,
  )

  const openCreate = useCallback(() => {
    resetForm()
    setCreateOpen(true)
  }, [setCreateOpen, resetForm])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">数据源管理</h1>
        <span className="text-xs text-muted-foreground">管理数据库连接信息</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredList}
            loading={query.isFetching}
            emptyText="暂无数据源"
            enableRowSelection
            getRowId={(row) => row.id}
            filters={[
              {
                id: 'type',
                label: '类型',
                type: 'select',
                defaultValue: '_all',
                options: [
                  { value: '_all', label: '全部类型' },
                  ...typeOptions,
                ],
              },
            ]}
            filterValues={{ type: filterType }}
            onFiltersChange={(values) => {
              setSp((prev) => {
                if (values.type && values.type !== '_all') prev.set('type', values.type)
                else prev.delete('type')
                prev.set('page', '1')
                return prev
              })
            }}
            toolbar={{
              createLabel: '新增数据源',
              onCreate: openCreate,
              onRefresh: () => { void refetch() },
              onBatchDelete: handleBatchDelete,
            }}
            pagination={{
              page, pageSize,
              total: data?.total,
              needCount: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />
        </CardContent>
      </Card>

      <DatasourceSheet
        typeOptions={typeOptions}
        onSave={createOpen ? handleCreate : handleUpdate}
        isPending={createMutation.isPending || updateMutation.isPending}
        editingID={editingID}
        onTest={editingID ? handleTestConnection : undefined}
        isTesting={testMutation.isPending}
      />

      <ConfirmDialog />
    </div>
  )
}
