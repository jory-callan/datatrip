import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirmDelete } from '@/hooks/use-confirm-delete'
import { getApiErrorMessage } from '@/lib/api-client'
import {
  useBatchDeleteDatasourceRules,
  useCreateDatasourceRule,
  useDatasourceRules,
  useDeleteDatasourceRule,
  useUpdateDatasourceRule,
  type CreateDatasourceRuleInput,
  type DatasourceRule,
  type UpdateDatasourceRuleInput,
} from '@/lib/api/datasource-rules'
import { useDatasourceTypes } from '@/lib/api/datasources'

import { useDatasourceRuleColumns } from './columns'
import { CATEGORIES, CATEGORY_LABELS, FALLBACK_GROUPS } from './dialogs'
import { RuleSheet } from './rule-sheet'
import { useDatasourceRuleStore } from './store'

/** Radix UI 要求 SelectItem value 不能为空字符串，用 _all 占位，send 前转回 '' */
function normalizeScope(scope: string) {
  return scope === '_all' ? '' : scope
}

function normalizeGroup(group: string) {
  return group === '_all' ? '' : group
}

export function DatasourceRulesPage() {
  // URL params
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page')) || 1
  const pageSize = Number(sp.get('pageSize')) || 20
  const filterCategory = sp.get('category') || '_all'
  const filterTypeGroup = sp.get('typeGroup') || '_all'
  const filterScope = sp.get('typeScope') || '_all'

  const setPage = useCallback((p: number) => {
    setSp((prev) => { prev.set('page', String(p)); return prev })
  }, [setSp])
  const setPageSize = useCallback((ps: number) => {
    setSp((prev) => { prev.set('pageSize', String(ps)); prev.set('page', '1'); return prev })
  }, [setSp])

  // zustand store
  const { createOpen, editingID, setCreateOpen, resetForm } = useDatasourceRuleStore()

  // API
  const query = useDatasourceRules({ page, pageSize, needCount: true })
  const { data, refetch } = query
  const createMutation = useCreateDatasourceRule()
  const updateMutation = useUpdateDatasourceRule()
  const deleteMutation = useDeleteDatasourceRule()
  const batchDeleteMutation = useBatchDeleteDatasourceRules()

  const { data: dsTypes } = useDatasourceTypes()
  const groups = dsTypes ?? FALLBACK_GROUPS

  // Confirm dialog
  const { confirm, ConfirmDialog } = useConfirmDelete()

  // Client-side filters
  const filteredList = useMemo(() => {
    let list = data?.list ?? []
    if (filterCategory !== '_all') {
      list = list.filter((r) => r.category === filterCategory)
    }
    if (filterTypeGroup !== '_all') {
      list = list.filter((r) => r.type_group === filterTypeGroup)
    }
    if (filterScope !== '_all') {
      list = list.filter((r) => r.type_scope === filterScope)
    }
    return list
  }, [data, filterCategory, filterTypeGroup, filterScope])

  // Handlers
  const handleCreate = async () => {
    const form = useDatasourceRuleStore.getState().form
    if (!form.name || !form.pattern) {
      toast.error('请填写必填字段')
      return
    }
    try {
      await createMutation.mutateAsync({
        ...form,
        type_group: normalizeGroup(form.type_group ?? ''),
        type_scope: normalizeScope(form.type_scope ?? ''),
      })
      toast.success('规则创建成功')
      useDatasourceRuleStore.getState().closeDialogs()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '规则创建失败'))
    }
  }

  const handleUpdate = async () => {
    const { editingID, form } = useDatasourceRuleStore.getState()
    if (!editingID) return
    if (!form.name || !form.pattern) {
      toast.error('请填写必填字段')
      return
    }
    try {
      const payload: UpdateDatasourceRuleInput = {
        id: editingID,
        ...form,
        type_group: normalizeGroup(form.type_group ?? ''),
        type_scope: normalizeScope(form.type_scope ?? ''),
      }
      await updateMutation.mutateAsync(payload)
      toast.success('规则更新成功')
      useDatasourceRuleStore.getState().closeDialogs()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '规则更新失败'))
    }
  }

  const handleDelete = useCallback(async (rule: DatasourceRule) => {
    const ok = await confirm({
      title: '删除规则',
      description: `确认删除规则「${rule.name}」？删除后不可恢复。`,
    })
    if (!ok) return
    try {
      await deleteMutation.mutateAsync(rule.id)
      toast.success('规则删除成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '规则删除失败'))
    }
  }, [deleteMutation, confirm])

  const handleToggleEnabled = useCallback(async (rule: DatasourceRule) => {
    try {
      await updateMutation.mutateAsync({
        id: rule.id,
        enabled: !rule.enabled,
      })
      toast.success('规则更新成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '规则更新失败'))
    }
  }, [updateMutation])

  const handleBatchDelete = useCallback(async (rows: DatasourceRule[]) => {
    if (!rows.length) return
    const ok = await confirm({
      title: '批量删除规则',
      description: `确认删除选中的 ${rows.length} 条规则？删除后不可恢复。`,
    })
    if (!ok) return
    try {
      await batchDeleteMutation.mutateAsync(rows.map((r) => r.id))
      toast.success(`已删除 ${rows.length} 条规则`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, '批量删除失败'))
    }
  }, [batchDeleteMutation, confirm])

  const openCreate = useCallback(() => {
    resetForm()
    setCreateOpen(true)
  }, [setCreateOpen, resetForm])

  const columns = useDatasourceRuleColumns(
    handleToggleEnabled,
    (rule) => useDatasourceRuleStore.getState().openEdit(rule),
    handleDelete,
    updateMutation.isPending,
    deleteMutation.isPending,
  )

  // Filter options for type_group and type_scope
  const groupFilterOptions = useMemo(() => [
    { value: '_all', label: '全部类型分组' },
    ...groups.map((g) => ({ value: g.group, label: g.label })),
  ], [groups])

  const scopeFilterOptions = useMemo(() => {
    const types = filterTypeGroup === '_all'
      ? groups.flatMap((g) => g.types)
      : groups.find((g) => g.group === filterTypeGroup)?.types ?? []
    return [
      { value: '_all', label: '全部适用范围' },
      ...types.map((t) => ({ value: t.type, label: t.label })),
    ]
  }, [groups, filterTypeGroup])

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">数据源规则</h1>
        <span className="text-xs text-muted-foreground">管理数据源审核规则</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredList}
            loading={query.isFetching}
            emptyText="暂无规则"
            enableRowSelection
            getRowId={(row) => String(row.id)}
            filters={[
              {
                id: 'category',
                label: '分类',
                type: 'select',
                defaultValue: '_all',
                options: [
                  { value: '_all', label: '全部分类' },
                  ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] ?? c })),
                ],
              },
              {
                id: 'typeGroup',
                label: '类型分组',
                type: 'select',
                defaultValue: '_all',
                options: groupFilterOptions,
              },
              {
                id: 'typeScope',
                label: '适用范围',
                type: 'select',
                defaultValue: '_all',
                options: scopeFilterOptions,
              },
            ]}
            filterValues={{
              category: filterCategory,
              typeGroup: filterTypeGroup,
              typeScope: filterScope,
            }}
            onFiltersChange={(values) => {
              setSp((prev) => {
                if (values.category && values.category !== '_all') prev.set('category', values.category)
                else prev.delete('category')

                if (values.typeGroup && values.typeGroup !== '_all') {
                  prev.set('typeGroup', values.typeGroup)
                  // 类型分组变化时重置适用范围
                  if (values.typeGroup !== filterTypeGroup) {
                    prev.delete('typeScope')
                  }
                } else {
                  prev.delete('typeGroup')
                  prev.delete('typeScope')
                }

                if (values.typeScope && values.typeScope !== '_all') prev.set('typeScope', values.typeScope)
                else if (values.typeGroup === filterTypeGroup) prev.delete('typeScope')

                prev.set('page', '1')
                return prev
              })
            }}
            toolbar={{
              createLabel: '新增规则',
              onCreate: openCreate,
              onRefresh: () => { void refetch() },
              onBatchDelete: handleBatchDelete,
            }}
            pagination={{
              page,
              pageSize,
              total: data?.total,
              needCount: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />
        </CardContent>
      </Card>

      <RuleSheet
        groups={groups}
        onSave={createOpen ? handleCreate : handleUpdate}
        isPending={isSaving}
      />

      <ConfirmDialog />
    </div>
  )
}
