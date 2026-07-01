import { IconCheck, IconFileText, IconX } from '@tabler/icons-react'

import { DataTable } from '@/components/common/data-table'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime, cn } from '@/lib/utils'
import type { ApprovalRecord, TicketDetail } from '@/lib/api/tickets'

import { STATUS_CONFIG, STATUS_LABEL, STATUS_OPTIONS } from './constants'
import { useTicketColumns } from './columns'
import { useTicketsPage } from './use-tickets'

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
    <Tabs defaultValue="info" className="flex flex-col">
      <TabsList>
        <TabsTrigger value="info">{'基本信息'}</TabsTrigger>
        <TabsTrigger value="sql">{'SQL 快照'}</TabsTrigger>
        <TabsTrigger value="approvals">
          {'审批记录'}
          {approvals.length > 0 && (
            <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 text-xs">{approvals.length}</span>
          )}
        </TabsTrigger>
        {audits.length > 0 && <TabsTrigger value="execution">{'执行结果'}</TabsTrigger>}
      </TabsList>

      <TabsContent value="info" className="min-h-0">
        <Card>
          <CardContent className="grid gap-3 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{'状态'}</span>
              {statusConfig ? <Badge className={statusConfig.className}>{STATUS_LABEL[ticket.status] ?? ticket.status}</Badge> : <Badge variant="outline">{ticket.status}</Badge>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{'审批模式'}</span>
              <span className="text-sm">{ticket.approval_mode === 'any_one' ? '任意一人' : '全部通过'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{'申请人'}</span>
              <span className="text-sm">#{ticket.applicant_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{'创建时间'}</span>
              <span className="text-sm">{formatDateTime(ticket.created_at)}</span>
            </div>
            {ticket.executed_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{'执行时间'}</span>
                <span className="text-sm">{formatDateTime(ticket.executed_at)}</span>
              </div>
            )}
            {ticket.execution_status && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{'执行结果'}</span>
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

      <TabsContent value="sql" className="min-h-0">
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
          <code>{ticket.sql_snapshot}</code>
        </pre>
      </TabsContent>

      <TabsContent value="approvals" className="min-h-0">
        <div className="space-y-3">
          {approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">{'暂无审批记录'}</p>
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => (
                <ApprovalTimelineItem key={approval.id} approval={approval} />
              ))}
            </div>
          )}
          {isPending && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="destructive" onClick={onReject} disabled={rejectPending}>
                <IconX className="size-4" />{'拒绝'}
              </Button>
              <Button onClick={onApprove} disabled={approvePending}>
                <IconCheck className="size-4" />{'审批通过'}
              </Button>
            </div>
          )}
        </div>
      </TabsContent>

      {audits.length > 0 && (
        <TabsContent value="execution" className="min-h-0">
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
                <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-400"><code>{audit.sql}</code></pre>
              </div>
            ))}
            {otherAudits.length > 0 && (
              <>
                <h4 className="mt-4 text-xs font-medium text-muted-foreground">{'其他操作记录'}</h4>
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
    </Tabs>
  )
}

export function TicketsPage() {

  const {
    page, setPage, pageSize, setPageSize,
    scope, setScope, statusFilter, setStatusFilter,
    projectFilter, setProjectFilter,
    selectedTicketId, setSelectedTicketId,
    detailOpen, setDetailOpen,
    approveOpen, setApproveOpen,
    rejectOpen, setRejectOpen,
    comment, setComment,
    projects, query, data, refetch,
    detailQuery, approveMutation, rejectMutation,
    handleViewDetail, handleOpenApprove, handleOpenReject,
    handleApprove, handleReject,
  } = useTicketsPage()

  const columns = useTicketColumns(projects, handleViewDetail)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'工单管理'}</h1>
        <p className="text-sm text-muted-foreground">{'管理 SQL 审核工单'}</p>
      </div>

      <div>
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                {(['my', 'pending', 'all'] as const).map((s) => (
                  <button key={s} onClick={() => { setScope(s); setPage(1) }}
                    className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      scope === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {s === 'my' ? '我的申请' : s === 'pending' ? '待我审批' : '全部'}
                  </button>
                ))}
              </div>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder={'状态筛选'} /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((value) => (<SelectItem key={value} value={value}>{STATUS_LABEL[value] ?? value}</SelectItem>))}
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder={'项目筛选'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{'全部项目'}</SelectItem>
                  {projects.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
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
            emptyText={'暂无工单'}
            storageKey="table:tickets:columns"
            getRowId={(row) => String(row.id)}
            toolbar={{ refreshLabel: '刷新', onRefresh: () => { void refetch() } }}
            pagination={{
              page, pageSize, total: data?.total ?? 0, needCount: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPageChange: setPage,
              onPageSizeChange: (nextPageSize) => { setPageSize(nextPageSize); setPage(1) },
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setSelectedTicketId(null) }}>
        <DialogContent className="max-w-5xl max-h-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFileText className="size-5 text-primary" />
              {`工单详情`}
            </DialogTitle>
            <DialogDescription>{'SQL 审核工单详细信息'}</DialogDescription>
          </DialogHeader>
          {detailQuery.data ? (
            <TicketDetailContent
              detail={detailQuery.data}
              onApprove={handleOpenApprove}
              onReject={handleOpenReject}
              approvePending={approveMutation.isPending}
              rejectPending={rejectMutation.isPending}
            />
          ) : detailQuery.isFetching ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{'加载中...'}</div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">{'暂无数据'}</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCheck className="size-5 text-green-600" />{'审批通过'}
            </DialogTitle>
            <DialogDescription>{'确认批准该工单的 SQL 执行申请'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{'审批意见（可选）'}</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={'请输入审批意见...'} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>{'取消'}</Button>
            <Button onClick={() => { void handleApprove() }} disabled={approveMutation.isPending}>{'确认通过'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconX className="size-5 text-red-600" />{'拒绝'}
            </DialogTitle>
            <DialogDescription>{'拒绝该工单的 SQL 执行申请'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{'拒绝原因'} <span className="text-destructive">*</span></Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={'请填写拒绝原因...'} rows={3} required />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>{'取消'}</Button>
            <Button variant="destructive" onClick={() => { void handleReject() }} disabled={rejectMutation.isPending}>{'确认拒绝'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
