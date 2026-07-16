import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconEye } from '@tabler/icons-react'

import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { useProjects } from '@/lib/api/projects'
import { useAudits } from '@/lib/api/audits'

import { useAuditColumns } from './columns'
import {
  ACTION_OPTIONS, STATUS_OPTIONS, CLASSIFICATION_OPTIONS,
  DATE_RANGE_OPTIONS, ACTION_LABEL,
} from './use-audits'
import { useAuditStore } from './store'

export function AuditsPage() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page')) || 1
  const pageSize = Number(sp.get('pageSize')) || 20
  const actionFilter = sp.get('action') || 'all'
  const statusFilter = sp.get('status') || 'all'
  const classificationFilter = sp.get('classification') || 'all'
  const projectFilter = sp.get('project_id') || '_all'
  const startDate = sp.get('start_date') || ''
  const endDate = sp.get('end_date') || ''

  const setPage = useCallback((p: number) => {
    setSp((prev) => { prev.set('page', String(p)); return prev })
  }, [setSp])
  const setPageSize = useCallback((ps: number) => {
    setSp((prev) => { prev.set('pageSize', String(ps)); prev.set('page', '1'); return prev })
  }, [setSp])

  // Store (only sheet state)
  const expandedRow = useAuditStore((s) => s.expandedRow)
  const setExpandedRow = useAuditStore((s) => s.setExpandedRow)

  const projectsQuery = useProjects({ page: 1, pageSize: 200, needCount: false })
  const projects = projectsQuery.data?.list ?? []

  const query = useAudits({
    page,
    pageSize,
    needCount: false,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    classification: classificationFilter !== 'all' ? classificationFilter : undefined,
    project_id: projectFilter !== '_all' ? projectFilter : undefined,
    start_time: startDate || undefined,
    end_time: endDate || undefined,
  })
  const { data, refetch } = query

  const expandedAudit = useMemo(() => {
    if (expandedRow == null) return null
    return data?.list?.find((a: any) => a.id === expandedRow) ?? null
  }, [data?.list, expandedRow])

  const toggleExpand = useCallback((id: string) => {
    useAuditStore.getState().toggleExpand(id)
  }, [])

  const columns = useAuditColumns(toggleExpand)

  // Filter options
  const projectOptions = useMemo(() => [
    { value: '_all', label: '全部项目' },
    ...projects.map((p: any) => ({ value: String(p.id), label: p.name })),
  ], [projects])

  // Quick range handler
  const handleQuickRange = useCallback((range: string) => {
    const end = new Date()
    const endStr = end.toISOString().slice(0, 10)
    let start: Date
    switch (range) {
      case 'today':
        start = new Date(); break
      case '7d':
        start = new Date(); start.setDate(start.getDate() - 7); break
      case '30d':
        start = new Date(); start.setDate(start.getDate() - 30); break
      case '90d':
        start = new Date(); start.setDate(start.getDate() - 90); break
      default:
        start = new Date(); start.setDate(start.getDate() - 7)
    }
    const startStr = start.toISOString().slice(0, 10)
    setSp((prev) => {
      prev.set('start_date', startStr)
      prev.set('end_date', endStr)
      prev.set('page', '1')
      return prev
    })
  }, [setSp])

  // Handle filters change
  const handleFiltersChange = useCallback((values: Record<string, string>) => {
    // Quick range: sets both dates and reverts itself
    if (values.quick_range && values.quick_range !== '_placeholder') {
      handleQuickRange(values.quick_range)
      return
    }
    setSp((prev) => {
      // Action
      if (values.action && values.action !== 'all') prev.set('action', values.action)
      else prev.delete('action')
      // Status
      if (values.status && values.status !== 'all') prev.set('status', values.status)
      else prev.delete('status')
      // Classification
      if (values.classification && values.classification !== 'all') prev.set('classification', values.classification)
      else prev.delete('classification')
      // Project
      if (values.project_id && values.project_id !== '_all') prev.set('project_id', values.project_id)
      else prev.delete('project_id')
      // Start date
      if (values.start_date) prev.set('start_date', values.start_date)
      else prev.delete('start_date')
      // End date
      if (values.end_date) prev.set('end_date', values.end_date)
      else prev.delete('end_date')
      prev.set('page', '1')
      return prev
    })
  }, [setSp, handleQuickRange])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">审计日志</h1>
        <span className="text-xs text-muted-foreground">查看所有操作审计记录</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.list ?? []}
            loading={query.isFetching}
            emptyText="暂无审计日志"
            getRowId={(row) => String(row.id)}
            filters={[
              {
                id: 'action',
                label: '操作类型',
                type: 'select',
                defaultValue: 'all',
                options: ACTION_OPTIONS,
              },
              {
                id: 'status',
                label: '执行状态',
                type: 'select',
                defaultValue: 'all',
                options: STATUS_OPTIONS,
              },
              {
                id: 'classification',
                label: '分类',
                type: 'select',
                defaultValue: 'all',
                options: CLASSIFICATION_OPTIONS,
              },
              {
                id: 'project_id',
                label: '项目',
                type: 'select',
                defaultValue: '_all',
                options: projectOptions,
              },
              {
                id: 'start_date',
                label: '开始日期',
                type: 'date',
              },
              {
                id: 'end_date',
                label: '结束日期',
                type: 'date',
              },
              {
                id: 'quick_range',
                label: '快捷',
                type: 'select',
                defaultValue: '_placeholder',
                options: [
                  { value: '_placeholder', label: '选择范围' },
                  ...DATE_RANGE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
                ],
              },
            ]}
            filterValues={{
              action: actionFilter,
              status: statusFilter,
              classification: classificationFilter,
              project_id: projectFilter,
              start_date: startDate,
              end_date: endDate,
              quick_range: '_placeholder',
            }}
            onFiltersChange={handleFiltersChange}
            toolbar={{
              refreshLabel: '搜索',
              onRefresh: () => { void refetch() },
            }}
            pagination={{
              page,
              pageSize,
              total: data?.total ?? 0,
              needCount: false,
              pageSizeOptions: [10, 20, 50, 100],
              onPageChange: setPage,
              onPageSizeChange: (nextPageSize) => {
                setPageSize(nextPageSize)
              },
            }}
          />

          <Sheet open={expandedRow != null} onOpenChange={(open) => { if (!open) setExpandedRow(null) }}>
            <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0">
              {expandedAudit && (
                <>
                  <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                      <IconEye className="size-5 text-primary" />
                      审计详情 #{expandedAudit.id}
                    </SheetTitle>
                    <SheetDescription>
                      {ACTION_LABEL[expandedAudit.action] ?? expandedAudit.action}
                      · {expandedAudit.status === 'success' ? '成功' : '失败'}
                      · {expandedAudit.duration_ms}ms
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">完整 SQL</Label>
                      <pre className="rounded bg-gray-900 p-3 text-sm text-green-400 overflow-x-auto">
                        <code>{expandedAudit.raw_text || '(空)'}</code>
                      </pre>
                    </div>
                    {expandedAudit.error_message && (
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">错误信息</Label>
                        <div className="rounded bg-red-50 p-3 text-sm text-red-600">
                          {expandedAudit.error_message}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>项目: #{expandedAudit.project_id}</span>
                      <span>数据源: #{expandedAudit.datasource_id}</span>
                      <span>耗时: {expandedAudit.duration_ms}ms</span>
                      <span>IP: {expandedAudit.ip}</span>
                      {expandedAudit.ticket_id && <span>工单: #{expandedAudit.ticket_id}</span>}
                    </div>
                  </div>
                  <div className="flex justify-start px-6 py-4 border-t bg-muted/30">
                    <Button variant="ghost" size="sm" onClick={() => setExpandedRow(null)}>关闭</Button>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </div>
  )
}
