import { IconEye, IconSearch } from '@tabler/icons-react'

import { DataTable } from '@/components/common/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useAuditColumns } from './columns'
import {
  ACTION_OPTIONS, STATUS_OPTIONS, CLASSIFICATION_OPTIONS, ACTION_LABEL,
  useAuditsPage,
} from './use-audits'

export function AuditsPage() {

  const {
    page, setPage,
    pageSize, setPageSize,
    actionFilter, statusFilter, projectFilter,
    classificationFilter,
    startDate, endDate,
    expandedAudit,
    projects, query, data,
    toggleExpand, refetch,
    setFilterAction, setFilterStatus, setFilterProject,
    setFilterClassification,
    setFilterStartDate, setFilterEndDate,
    setExpandedRow,
  } = useAuditsPage()

  const columns = useAuditColumns(toggleExpand)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'审计日志'}</h1>
        <p className="text-sm text-muted-foreground">{'查看所有操作审计记录'}</p>
      </div>

      <div>
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">{'操作类型'}</Label>
                <Select value={actionFilter} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={'操作类型'} />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">{'执行状态'}</Label>
                <Select value={statusFilter} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder={'状态'} />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">{'分类'}</Label>
                <Select value={classificationFilter} onValueChange={setFilterClassification}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder={'全部'} />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">{'项目'}</Label>
                <Select value={projectFilter} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={'选择项目'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{'全部项目'}</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">{'开始时间'}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">{'结束时间'}</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>

              <Button variant="secondary" size="sm" onClick={() => { void refetch() }}>
                <IconSearch className="size-4" />
                {'搜索'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.list ?? []}
            loading={query.isFetching}
            emptyText={'暂无审计日志'}
            storageKey="table:audits:columns"
            getRowId={(row) => String(row.id)}
            toolbar={{
              refreshLabel: '刷新',
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
                setPage(1)
              },
            }}
          />

          <Dialog open={expandedAudit != null} onOpenChange={(open) => { if (!open) setExpandedRow(null) }}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              {expandedAudit && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <IconEye className="size-5 text-primary" />
                      {'审计详情'} #{expandedAudit.id}
                    </DialogTitle>
                    <DialogDescription>
                      {ACTION_LABEL[expandedAudit.action] ?? expandedAudit.action}
                      · {expandedAudit.status === 'success' ? '成功' : '失败'}
                      · {expandedAudit.duration_ms}ms
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">{'完整 SQL'}</Label>
                      <pre className="rounded bg-gray-900 p-3 text-sm text-green-400 overflow-x-auto">
                        <code>{expandedAudit.sql || '(空)'}</code>
                      </pre>
                    </div>
                    {expandedAudit.error_message && (
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">{'错误信息'}</Label>
                        <div className="rounded bg-red-50 p-3 text-sm text-red-600">
                          {expandedAudit.error_message}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{`项目: #${expandedAudit.project_id}`}</span>
                      <span>{`数据源: #${expandedAudit.datasource_id}`}</span>
                      <span>{`耗时: ${expandedAudit.duration_ms}ms`}</span>
                      <span>{`IP: ${expandedAudit.ip}`}</span>
                      {expandedAudit.ticket_id && <span>{`工单: #${expandedAudit.ticket_id}`}</span>}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
