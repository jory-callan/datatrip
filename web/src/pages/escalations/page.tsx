import { IconCheck, IconShieldPlus, IconX } from '@tabler/icons-react'

import { DataTable } from '@/components/common/data-table'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { useEscalationColumns } from './columns'
import {
  STATUS_OPTIONS, DURATION_OPTIONS,
  STATUS_LABEL, DURATION_LABEL,
  useEscalationsPage,
} from './use-escalations'

export function EscalationsPage() {

  const {
    canApprove,
    page, setPage,
    pageSize, setPageSize,
    scope, setScope,
    statusFilter, setStatusFilter,
    createOpen, setCreateOpen,
    createProjectId, setCreateProjectId,
    createReason, setCreateReason,
    approveOpen, setApproveOpen,
    approveTarget, setApproveTarget,
    approveDuration, setApproveDuration,
    rejectOpen, setRejectOpen,
    rejectTarget, setRejectTarget,
    projects, query, data, refetch,
    createMutation, approveMutation, rejectMutation,
    handleOpenApprove, handleOpenReject,
    handleCreateSubmit, handleApprove, handleReject,
  } = useEscalationsPage()

  const columns = useEscalationColumns(
    projects, canApprove,
    handleOpenApprove, handleOpenReject,
    approveMutation.isPending, rejectMutation.isPending,
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{'提权管理'}</h1>
          <p className="text-sm text-muted-foreground">{'管理临时数据库权限提权申请'}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <IconShieldPlus className="mr-1 size-4" />
          {'申请提权'}
        </Button>
      </div>

      <div className="px-3">
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                {(['my', 'pending', 'all'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setScope(s); setPage(1) }}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      scope === s
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {s === 'my' ? '我的申请' : s === 'pending' ? '待我审批' : '全部'}
                  </button>
                ))}
              </div>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={'全部'} />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>{STATUS_LABEL[value] ?? value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mx-3">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.list ?? []}
            loading={query.isFetching}
            emptyText={'暂无提权申请'}
            storageKey="table:escalations:columns"
            getRowId={(row) => String(row.id)}
            toolbar={{
              refreshLabel: '刷新',
              onRefresh: () => { void refetch() },
            }}
            pagination={{
              page,
              pageSize,
              total: data?.total ?? 0,
              needCount: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPageChange: setPage,
              onPageSizeChange: (nextPageSize) => {
                setPageSize(nextPageSize)
                setPage(1)
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open)
        if (!open) { setCreateProjectId(''); setCreateReason('') }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconShieldPlus className="size-5 text-primary" />
              {'申请提权'}
            </DialogTitle>
            <DialogDescription>{'提交临时数据库权限提权申请，需审批通过后生效'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{'项目'} <span className="text-destructive">*</span></Label>
              <Select value={createProjectId} onValueChange={setCreateProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={'请选择项目'} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{'申请理由'} <span className="text-destructive">*</span></Label>
              <Textarea value={createReason} onChange={(e) => setCreateReason(e.target.value)} placeholder={'请输入提权理由...'} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setCreateProjectId(''); setCreateReason('') }}>{'取消'}</Button>
            <Button onClick={() => { void handleCreateSubmit() }} disabled={createMutation.isPending}>{'提交申请'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={(open) => { setApproveOpen(open); if (!open) setApproveTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCheck className="size-5 text-green-600" />
              {'批准提权申请'}
            </DialogTitle>
            <DialogDescription>{`确认批准`}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{'授权时长'}</Label>
              <Select value={approveDuration} onValueChange={setApproveDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>{DURATION_LABEL[value] ?? value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveOpen(false); setApproveTarget(null) }}>{'取消'}</Button>
            <Button onClick={() => { void handleApprove() }} disabled={approveMutation.isPending}>{'确认批准'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={(open) => { setRejectOpen(open); if (!open) setRejectTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconX className="size-5 text-red-600" />
              {'拒绝提权申请'}
            </DialogTitle>
            <DialogDescription>{`确认拒绝`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectOpen(false); setRejectTarget(null) }}>{'取消'}</Button>
            <Button variant="destructive" onClick={() => { void handleReject() }} disabled={rejectMutation.isPending}>{'确认拒绝'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
