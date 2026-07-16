import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconCheck, IconFileText, IconX } from '@tabler/icons-react'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDateTime } from '@/lib/utils'
import { useProjects } from '@/lib/api/projects'
import type { ApprovalRecord, TicketDetail } from '@/lib/api/tickets'
import {
  useApproveTicket,
  useRejectTicket,
  useTicketDetail,
  useTickets,
} from '@/lib/api/tickets'

import { STATUS_CONFIG, STATUS_LABEL, STATUS_OPTIONS } from './constants'
import { useTicketColumns } from './columns'
import { useTicketStore } from './store'

function ApprovalTimelineItem({ approval }: { approval: ApprovalRecord }) {

  const isApproved = approval.action === 'approved'
  return (
    <div className="flex gap-3 rounded-md border p-3">
      <div className="mt-0.5 shrink-0">
        {isApproved ? <IconCheck className="size-4 text-green-600" /> : <IconX className="size-4 text-red-600" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isApproved ? '审批通过' : '拒绝'} — #{approval.approver_id}
          </span>
          <span className="text-xs text-muted-foreground">{formatDateTime(approval.created_at)}</span>
        </div>
        {approval.comment && <p className="mt-1 text-sm text-muted-foreground">{approval.comment}</p>}
      </div>
    </div>
  )
}

function TicketDetailContent({
  detail, onApprove, onReject, approvePending, rejectPending,
}: {
  detail: TicketDetail
  onApprove: () => void
  onReject: () => void
  approvePending: boolean
  rejectPending: boolean
}) {

  const { ticket, approvals = [], audits = [] } = detail
  const statusConfig = STATUS_CONFIG[ticket.status]
  const isPending = ticket.status === 'pending'
  const execAudits = audits.filter((a) => a.action === 'ticket_execute')
  const otherAudits = audits.filter((a) => a.action !== 'ticket_execute')

  return (
    <Tabs defaultValue="info" className="flex flex-col flex-1 min-h-0">
      <TabsList className="bg-transparent h-auto p-0 gap-1 mb-4">
        <TabsTrigger value="info" className="data-[state=active]:bg-primary/10 data-[state=active]:shadow-none">基本信息</TabsTrigger>
        <TabsTrigger value="sql" className="data-[state=active]:bg-primary/10 data-[state=active]:shadow-none">SQL 快照</TabsTrigger>
        <TabsTrigger value="approvals" className="data-[state=active]:bg-primary/10 data-[state=active]:shadow-none">
          审批记录
          {approvals.length > 0 && (
            <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 text-xs">{approvals.length}</span>
          )}
        </TabsTrigger>
        {audits.length > 0 && <TabsTrigger value="execution" className="data-[state=active]:bg-primary/10 data-[state=active]:shadow-none">执行结果</TabsTrigger>}
      </TabsList>

      <div className="flex-1 overflow-y-auto">
        <TabsContent value="info" className="m-0">
          <Card>
            <CardContent className="grid gap-3 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">状态</span>
                {statusConfig ? <Badge className={statusConfig.className}>{STATUS_LABEL[ticket.status] ?? ticket.status}</Badge> : <Badge variant="outline">{ticket.status}</Badge>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">审批模式</span>
                <span className="text-sm">{ticket.approval_mode === 'any_one' ? '任意一人' : '全部通过'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">申请人</span>
                <span className="text-sm">#{ticket.applicant_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">创建时间</span>
                <span className="text-sm">{formatDateTime(ticket.created_at)}</span>
              </div>
              {ticket.executed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">执行时间</span>
                  <span className="text-sm">{formatDateTime(ticket.executed_at)}</span>
                </div>
              )}
              {ticket.execution_status && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">执行结果</span>
                  <Badge className={ticket.execution_status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {ticket.execution_status === 'success' ? '成功' : '失败'}
                  </Badge>
                </div>
              )}
              {ticket.execution_error && (
                <div className="rounded bg-red-50 p-2 text-xs text-red-600">{ticket.execution_error}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sql" className="m-0">
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
            <code>{(() => { try { return JSON.parse(ticket.instruction_json).map((i: any) => i.raw).join('\n') } catch { return ticket.instruction_json } })()}</code>
          </pre>
        </TabsContent>

        <TabsContent value="approvals" className="m-0">
          <div className="space-y-3">
            {approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无审批记录</p>
            ) : (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <ApprovalTimelineItem key={approval.id} approval={approval} />
                ))}
              </div>
            )}
            {isPending && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="destructive" size="sm" onClick={onReject} disabled={rejectPending}>
                  <IconX className="size-4" />拒绝
                </Button>
                <Button size="sm" onClick={onApprove} disabled={approvePending}>
                  <IconCheck className="size-4" />审批通过
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {audits.length > 0 && (
          <TabsContent value="execution" className="m-0">
            <div className="space-y-3">
              {execAudits.map((audit) => (
                <div key={audit.id} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge className={audit.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {audit.status === 'success' ? '执行成功' : '执行失败'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{audit.duration_ms}ms</span>
                  </div>
                  {audit.error_message && (
                    <div className="mb-2 rounded bg-red-50 p-2 text-xs text-red-600">{audit.error_message}</div>
                  )}
                  <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-400"><code>{audit.raw_text}</code></pre>
                </div>
              ))}
              {otherAudits.length > 0 && (
                <>
                  <h4 className="mt-4 text-xs font-medium text-muted-foreground">其他操作记录</h4>
                  {otherAudits.map((audit) => (
                    <div key={audit.id} className="flex items-center justify-between rounded-md border p-2 text-xs">
                      <span className="text-muted-foreground">{audit.action}</span>
                      <span className={audit.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                        {audit.status === 'success' ? '成功' : '失败'}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </TabsContent>
        )}
      </div>
    </Tabs>
  )
}

export function TicketsPage() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page')) || 1
  const pageSize = Number(sp.get('pageSize')) || 20
  const scope = sp.get('scope') || 'my'
  const statusFilter = sp.get('status') || '_all'
  const projectFilter = sp.get('project') || '_all'

  const setPage = useCallback((p: number) => {
    setSp((prev) => { prev.set('page', String(p)); return prev })
  }, [setSp])
  const setPageSize = useCallback((ps: number) => {
    setSp((prev) => { prev.set('pageSize', String(ps)); prev.set('page', '1'); return prev })
  }, [setSp])

  // Store
  const { detailOpen, selectedTicketId, approveOpen, rejectOpen, comment, setDetailOpen, setApproveOpen, setRejectOpen, setComment, closeDetail } = useTicketStore()

  // API
  const projectsQuery = useProjects({ page: 1, pageSize: 200, needCount: false })
  const projects = projectsQuery.data?.list ?? []

  const query = useTickets({
    page, pageSize, needCount: true, scope: scope as 'my' | 'pending' | 'all',
    status: statusFilter !== '_all' ? statusFilter : undefined,
    project_id: projectFilter !== '_all' ? Number(projectFilter) : undefined,
  })
  const { data, refetch } = query

  const detailQuery = useTicketDetail(selectedTicketId)
  const approveMutation = useApproveTicket()
  const rejectMutation = useRejectTicket()

  // Columns
  const handleViewDetail = useCallback((ticket: { id: number }) => {
    useTicketStore.getState().openDetail(ticket.id)
  }, [])

  const columns = useTicketColumns(projects, handleViewDetail)

  // Filter options
  const scopeOptions = useMemo(() => [
    { value: 'my', label: '我的申请' },
    { value: 'pending', label: '待我审批' },
    { value: 'all', label: '全部' },
  ], [])

  const statusOptions = useMemo(() => [
    { value: '_all', label: '全部状态' },
    ...STATUS_OPTIONS.filter((s) => s !== 'all').map((value) => ({
      value, label: STATUS_LABEL[value] ?? value,
    })),
  ], [])

  const projectOptions = useMemo(() => [
    { value: '_all', label: '全部项目' },
    ...projects.map((p: any) => ({ value: String(p.id), label: p.name })),
  ], [projects])

  // Dialogs
  const handleOpenApprove = useCallback(() => {
    useTicketStore.getState().openApprove()
  }, [])

  const handleOpenReject = useCallback(() => {
    useTicketStore.getState().openReject()
  }, [])

  const handleApprove = async () => {
    if (selectedTicketId == null) return
    const c = useTicketStore.getState().comment
    try {
      await approveMutation.mutateAsync({ id: selectedTicketId, comment: c || undefined })
      setApproveOpen(false)
      closeDetail()
      useTicketStore.getState().resetComment()
      void refetch()
    } catch { /* toast handled by interceptor */ }
  }

  const handleReject = async () => {
    if (selectedTicketId == null) return
    const c = useTicketStore.getState().comment
    if (!c) {
      const { toast } = await import('sonner')
      toast.error('请填写拒绝原因')
      return
    }
    try {
      await rejectMutation.mutateAsync({ id: selectedTicketId, comment: c })
      setRejectOpen(false)
      closeDetail()
      useTicketStore.getState().resetComment()
      void refetch()
    } catch { /* toast handled by interceptor */ }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">工单管理</h1>
        <span className="text-xs text-muted-foreground">管理 SQL 审核工单</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.list ?? []}
            loading={query.isFetching}
            emptyText="暂无工单"
            getRowId={(row) => String(row.id)}
            filters={[
              {
                id: 'scope',
                label: '范围',
                type: 'select',
                defaultValue: 'my',
                options: scopeOptions,
              },
              {
                id: 'status',
                label: '状态',
                type: 'select',
                defaultValue: '_all',
                options: statusOptions,
              },
              {
                id: 'project',
                label: '项目',
                type: 'select',
                defaultValue: '_all',
                options: projectOptions,
              },
            ]}
            filterValues={{ scope, status: statusFilter, project: projectFilter }}
            onFiltersChange={(values) => {
              setSp((prev) => {
                if (values.scope && values.scope !== 'my') prev.set('scope', values.scope)
                else prev.delete('scope')
                if (values.status && values.status !== '_all') prev.set('status', values.status)
                else prev.delete('status')
                if (values.project && values.project !== '_all') prev.set('project', values.project)
                else prev.delete('project')
                prev.set('page', '1')
                return prev
              })
            }}
            toolbar={{ refreshLabel: '刷新', onRefresh: () => { void refetch() } }}
            pagination={{
              page, pageSize, total: data?.total ?? 0, needCount: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPageChange: setPage,
              onPageSizeChange: (nextPageSize) => { setPageSize(nextPageSize); setPage(1) },
            }}
          />

          {/* ===== Detail Sheet ===== */}
          <Sheet open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) closeDetail() }}>
            <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col gap-0">
              <SheetHeader className="px-6 pt-6 pb-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <IconFileText className="size-5 text-primary" />
                  工单详情
                </SheetTitle>
                <SheetDescription>SQL 审核工单详细信息</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {detailQuery.data ? (
                  <TicketDetailContent
                    detail={detailQuery.data}
                    onApprove={handleOpenApprove}
                    onReject={handleOpenReject}
                    approvePending={approveMutation.isPending}
                    rejectPending={rejectMutation.isPending}
                  />
                ) : detailQuery.isFetching ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">暂无数据</div>
                )}
              </div>
              <div className="flex justify-start px-6 py-4 border-t bg-muted/30">
                <Button variant="ghost" size="sm" onClick={() => { setDetailOpen(false); closeDetail() }}>关闭</Button>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>

      {/* ===== Approve Dialog ===== */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCheck className="size-5 text-green-600" />审批通过
            </DialogTitle>
            <DialogDescription>确认批准该工单的 SQL 执行申请</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <Label>审批意见（可选）</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="请输入审批意见..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApproveOpen(false)}>取消</Button>
            <Button size="sm" onClick={() => { void handleApprove() }} disabled={approveMutation.isPending}>确认通过</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Reject Dialog ===== */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconX className="size-5 text-red-600" />拒绝
            </DialogTitle>
            <DialogDescription>拒绝该工单的 SQL 执行申请</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <Label>拒绝原因 <span className="text-destructive">*</span></Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="请填写拒绝原因..." rows={3} required />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>取消</Button>
            <Button variant="destructive" size="sm" onClick={() => { void handleReject() }} disabled={rejectMutation.isPending}>确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
