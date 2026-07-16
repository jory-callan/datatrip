import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirmDelete } from '@/hooks/use-confirm-delete'
import { getApiErrorMessage } from '@/lib/api-client'
import type { UpdateProjectInput } from '@/lib/api/projects'
import {
  useBatchDeleteProject,
  useCreateProject,
  useDeleteProject,
  useProjectMembers,
  useProjects,
  useUpdateProject,
  useUpdateProjectMembers,
} from '@/lib/api/projects'
import { useDatasources } from '@/lib/api/datasources'
import { useUsers } from '@/lib/api/users'
import { useWebhooks } from '@/lib/api/webhooks'

import { useProjectColumns } from './columns'
import { ProjectSheet } from './project-sheet'
import { MembersSheet } from './members-sheet'
import { useProjectStore } from './store'

export function ProjectsPage() {
  // URL params
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page')) || 1
  const pageSize = Number(sp.get('pageSize')) || 20
  const filterDatasource = sp.get('datasource_id') || '_all'

  const setPage = useCallback((p: number) => {
    setSp((prev) => { prev.set('page', String(p)); return prev })
  }, [setSp])
  const setPageSize = useCallback((ps: number) => {
    setSp((prev) => { prev.set('pageSize', String(ps)); prev.set('page', '1'); return prev })
  }, [setSp])

  // zustand store
  const { createOpen, editingID, form, setCreateOpen, resetForm, closeDialogs } = useProjectStore()
  const { membersProjectId, setMembersForm } = useProjectStore()

  // API — list
  const query = useProjects({ page, pageSize, needCount: true })
  const { data, refetch } = query

  // API — mutations
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const deleteMutation = useDeleteProject()
  const updateMembersMutation = useUpdateProjectMembers()
  const batchDeleteMutation = useBatchDeleteProject()

  // API — supporting data
  const datasourcesQuery = useDatasources({ page: 1, pageSize: 200, needCount: false })
  const usersQuery = useUsers({ page: 1, pageSize: 200, needCount: false })
  const webhooksQuery = useWebhooks({ page: 1, pageSize: 100, needCount: false })
  const membersQuery = useProjectMembers(membersProjectId)

  const datasources = datasourcesQuery.data?.list ?? []
  const users = usersQuery.data?.list ?? []
  const webhookList = webhooksQuery.data?.list ?? []
  const existingMembers = membersQuery.data ?? []

  // Populate membersForm when sheet opens with fresh data
  useEffect(() => {
    if (membersProjectId && existingMembers.length > 0) {
      const currentMembers = useProjectStore.getState().membersForm
      if (currentMembers.length === 0) {
        setMembersForm(existingMembers.map((em) => ({ user_id: em.user_id, role: em.role })))
      }
    }
  }, [membersProjectId, existingMembers, setMembersForm])

  // Confirm dialog
  const { confirm, ConfirmDialog } = useConfirmDelete()

  // Computed
  const datasourceOptions = useMemo(
    () => datasources.map((ds) => ({ value: ds.id, label: ds.name })),
    [datasources],
  )
  const webhookOptions = useMemo(
    () => webhookList.map((w) => ({ value: w.id, label: w.name })),
    [webhookList],
  )
  const userMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of users) {
      map.set(u.id, u.nickname || u.username)
    }
    return map
  }, [users])
  const currentMembers = useProjectStore((s) => s.membersForm)
  const userOptions = useMemo(
    () => users
      .filter((u) => !currentMembers.some((m) => m.user_id === u.id))
      .map((u) => ({ value: u.id, label: u.nickname || u.username })),
    [users, currentMembers],
  )

  // Client-side filter: by datasource
  const filteredList = useMemo(() => {
    const list = data?.list ?? []
    if (filterDatasource === '_all') return list
    return list.filter((p) => String(p.datasource_id) === filterDatasource)
  }, [data, filterDatasource])

  // Handlers
  const handleCreate = async () => {
    if (!form.name || !form.datasource_id) {
      toast.error('请填写必填字段')
      return
    }
    try {
      await createMutation.mutateAsync(form)
      toast.success('项目创建成功')
      closeDialogs()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '项目创建失败'))
    }
  }

  const handleUpdate = async () => {
    if (!editingID) return
    if (!form.name) {
      toast.error('请填写必填字段')
      return
    }
    try {
      const payload: UpdateProjectInput = { id: editingID, ...form }
      await updateMutation.mutateAsync(payload)
      toast.success('项目更新成功')
      closeDialogs()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '项目更新失败'))
    }
  }

  const handleDelete = useCallback(async (proj: { id: string; name: string }) => {
    const ok = await confirm({
      title: '删除项目',
      description: `确认删除项目「${proj.name}」？删除后不可恢复。`,
    })
    if (!ok) return
    try {
      await deleteMutation.mutateAsync(proj.id)
      toast.success('项目删除成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '项目删除失败'))
    }
  }, [deleteMutation, confirm])

  const handleBatchDelete = useCallback(async (rows: { id: string }[]) => {
    const ok = await confirm({
      title: '批量删除项目',
      description: `确认删除选中的 ${rows.length} 个项目？删除后不可恢复。`,
    })
    if (!ok) return
    try {
      await batchDeleteMutation.mutateAsync(rows.map((r) => r.id))
      toast.success(`已删除 ${rows.length} 个项目`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, '批量删除失败'))
    }
  }, [batchDeleteMutation, confirm])

  const handleSaveMembers = async () => {
    if (!membersProjectId) return
    try {
      const members = useProjectStore.getState().membersForm
      await updateMembersMutation.mutateAsync({ projectId: membersProjectId, members })
      toast.success('成员更新成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '成员更新失败'))
    }
  }

  const openCreate = useCallback(() => {
    resetForm()
    setCreateOpen(true)
  }, [setCreateOpen, resetForm])

  const columns = useProjectColumns(
    datasources,
    (proj) => useProjectStore.getState().openMembers(proj),
    (proj) => useProjectStore.getState().openEdit(proj),
    handleDelete,
    updateMutation.isPending,
    deleteMutation.isPending,
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">数据项目管理</h1>
        <span className="text-xs text-muted-foreground">管理数据项目和成员</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredList}
            loading={query.isFetching}
            emptyText="暂无项目"
            enableRowSelection
            getRowId={(row) => row.id}
            filters={[
              {
                id: 'datasource_id',
                label: '数据源',
                type: 'select',
                defaultValue: '_all',
                options: [
                  { value: '_all', label: '全部数据源' },
                  ...datasourceOptions,
                ],
              },
            ]}
            filterValues={{ datasource_id: filterDatasource }}
            onFiltersChange={(values) => {
              setSp((prev) => {
                if (values.datasource_id && values.datasource_id !== '_all') {
                  prev.set('datasource_id', values.datasource_id)
                } else {
                  prev.delete('datasource_id')
                }
                prev.set('page', '1')
                return prev
              })
            }}
            toolbar={{
              createLabel: '新增项目',
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

      <ProjectSheet
        datasourceOptions={datasourceOptions}
        webhookOptions={webhookOptions}
        onSave={createOpen ? handleCreate : handleUpdate}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <MembersSheet
        membersProjectId={membersProjectId}
        existingMembers={existingMembers}
        userOptions={userOptions}
        userMap={userMap}
        onSave={handleSaveMembers}
        isSaving={updateMembersMutation.isPending}
      />

      <ConfirmDialog />
    </div>
  )
}
