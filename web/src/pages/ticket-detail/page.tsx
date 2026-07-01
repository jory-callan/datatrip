import { IconArrowLeft, IconBell, IconCheck, IconFileText, IconRefresh, IconX } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

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
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime, cn } from '@/lib/utils'
import type { ApprovalRecord } from '@/lib/api/tickets'

import { useTicketDetailPage } from './use-ticket-detail'
import { STATUS_CONFIG, STATUS_LABEL } from './constants'

function ApprovalTimelineItem({ approval }: { approval: ApprovalRecord }) {

  const isApproved = approval.action === 'approved'
  const isUrged = approval.action === 'urged'
  return (
    <div className="flex gap-3 rounded-md border p-3">
      <div className="mt-0.5 shrink-0">
        {isApproved ? (
          <IconCheck className="size-4 text-green-600" />
        ) : isUrged ? (
          <IconBell className="size-4 text-amber-500" />
        ) : (
          <IconX className="size-4 text-red-600" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isApproved ? '审批通过' : isUrged ? '催办提醒' : '拒绝'}
          </span>
          <span className="text-xs text-muted-foreground">{formatDateTime(approval.created_at)}</span>
        </div>
        {approval.comment && (
          <p className="mt-1 text-sm text-muted-foreground">{approval.comment}</p>
        )}
      </div>
    </div>
  )
}

export function TicketDetailPage() {

  const {
    ticketId,
    query, detail, ticket, isPending,
    isRejected, isApplicant,
    approveOpen, setApproveOpen,
    rejectOpen, setRejectOpen,
    resubmitOpen, setResubmitOpen,
    comment, setComment,
    approveMutation, rejectMutation, urgeMutation, resubmitMutation,
    handleApprove, handleReject, handleUrge, handleResubmit,
  } = useTicketDetailPage()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tickets">
            <IconArrowLeft className="size-4" />
            {'返回'}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{`工单详情`}</h1>
          <p className="text-sm text-muted-foreground">{'SQL 审核工单详细信息'}</p>
        </div>
      </div>

      {query.isFetching && !detail ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">{'加载中...'}</p>
        </div>
      ) : !ticket ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">{'工单不存在'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="py-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <IconFileText className="size-4 text-primary" />
                  {'SQL 快照'}
                </h3>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
                  <code>{ticket.sql_snapshot}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <h3 className="mb-3 text-sm font-medium">{'审批记录'}</h3>
                {detail!.approvals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{'暂无审批记录'}</p>
                ) : (
                  <div className="space-y-3">
                    {detail!.approvals.map((approval: ApprovalRecord) => (
                      <ApprovalTimelineItem key={approval.id} approval={approval} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {detail!.audits.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <h3 className="mb-3 text-sm font-medium">{'执行记录'}</h3>
                  <div className="space-y-2">
                    {detail!.audits.map((audit: any) => (
                      <div key={audit.id} className="rounded-md border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className={cn('font-medium', audit.status === 'success' ? 'text-green-600' : 'text-red-600')}>
                            {audit.status === 'success' ? '执行成功' : '执行失败'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {audit.duration_ms}ms
                          </span>
                        </div>
                        {audit.error_message && (
                          <p className="mt-1 text-xs text-red-500">{audit.error_message}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          IP: {audit.ip} | {formatDateTime(audit.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="py-4 space-y-3">
                <h3 className="text-sm font-medium">{'工单信息'}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{'状态'}</span>
                  {(() => {
                    const config = STATUS_CONFIG[ticket.status]
                    return config
                      ? <Badge className={config.className}>{STATUS_LABEL[ticket.status] ?? ticket.status}</Badge>
                      : <Badge variant="outline">{ticket.status}</Badge>
                  })()}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{'审批模式'}</span>
                  <span className="text-sm">{ticket.approval_mode === 'any_one' ? '任意一人' : '全部通过'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{'申请人'}</span>
                  <span className="text-sm">#{ticket.applicant_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{'创建时间'}</span>
                  <span className="text-sm">{formatDateTime(ticket.created_at)}</span>
                </div>
                {ticket.executed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{'执行时间'}</span>
                    <span className="text-sm">{formatDateTime(ticket.executed_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {isPending && (
              <Card>
                <CardContent className="py-4 space-y-3">
                  <h3 className="text-sm font-medium">{'审批操作'}</h3>
                  {isApplicant && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { void handleUrge() }}
                      disabled={urgeMutation.isPending}
                    >
                      <IconBell className="size-4" />
                      {'催办'}
                    </Button>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => { setComment(''); setApproveOpen(true) }}
                    disabled={approveMutation.isPending}
                  >
                    <IconCheck className="size-4" />
                    {'审批通过'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => { setComment(''); setRejectOpen(true) }}
                    disabled={rejectMutation.isPending}
                  >
                    <IconX className="size-4" />
                    {'拒绝'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {isRejected && isApplicant && (
              <Card>
                <CardContent className="py-4 space-y-3">
                  <h3 className="text-sm font-medium">{'重新提交工单'}</h3>
                  <Button
                    className="w-full"
                    onClick={() => setResubmitOpen(true)}
                    disabled={resubmitMutation.isPending}
                  >
                    <IconRefresh className="size-4" />
                    {'重新提交'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCheck className="size-5 text-green-600" />
              {'审批通过'}
            </DialogTitle>
            <DialogDescription>{'确认批准该工单的 SQL 执行申请'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{'审批意见（可选）'}</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={'请输入审批意见...'}
                rows={3}
              />
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
              <IconX className="size-5 text-red-600" />
              {'拒绝'}
            </DialogTitle>
            <DialogDescription>{'拒绝该工单的 SQL 执行申请'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{'拒绝原因'} <span className="text-destructive">*</span></Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={'请填写拒绝原因...'}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>{'取消'}</Button>
            <Button variant="destructive" onClick={() => { void handleReject() }} disabled={rejectMutation.isPending}>{'确认拒绝'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resubmitOpen} onOpenChange={setResubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconRefresh className="size-5 text-primary" />
              {'重新提交'}
            </DialogTitle>
            <DialogDescription>{'确认重新提交被驳回的工单？将创建新的工单，原工单保留为已拒绝状态。'}</DialogDescription>
          </DialogHeader>
          {ticket && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-muted-foreground">{'工单标题'}</Label>
                <p className="text-sm font-medium">{ticket.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{'SQL 快照'}</Label>
                <pre className="mt-1 rounded bg-gray-900 p-3 text-xs text-green-400 overflow-x-auto max-h-32">{ticket.sql_snapshot}</pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResubmitOpen(false)}>{'取消'}</Button>
            <Button onClick={() => { void handleResubmit() }} disabled={resubmitMutation.isPending}>
              {resubmitMutation.isPending ? '提交中...' : '确认重新提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
