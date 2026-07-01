import { type ColumnDef } from '@tanstack/react-table'
import { IconCheck, IconX } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { Escalation, ProjectInfo } from '@/lib/api/escalations'

import { STATUS_CONFIG, STATUS_LABEL } from './use-escalations'

export function useEscalationColumns(
  projects: ProjectInfo[],
  canApprove: (esc: Escalation) => boolean,
  handleOpenApprove: (esc: Escalation) => void,
  handleOpenReject: (esc: Escalation) => void,
  isApproving: boolean,
  isRejecting: boolean,
): ColumnDef<Escalation>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      meta: { label: 'ID' },
      size: 80,
    },
    {
      accessorKey: 'project_id',
      header: '项目',
      cell: ({ row }) => {
        const project = projects.find((p) => p.id === row.original.project_id)
        return project?.name ?? `#${row.original.project_id}`
      },
      meta: { label: '项目' },
    },
    {
      accessorKey: 'reason',
      header: '原因',
      cell: ({ row }) => {
        const reason = row.original.reason
        return (
          <span className="max-w-[300px] truncate block" title={reason}>
            {reason}
          </span>
        )
      },
      meta: { label: '原因' },
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.original.status
        const config = STATUS_CONFIG[status]
        if (!config) return <Badge variant="outline">{status}</Badge>
        return <Badge className={config.className}>{STATUS_LABEL[status] ?? status}</Badge>
      },
      meta: { label: '状态' },
    },
    {
      accessorKey: 'expires_at',
      header: '过期时间',
      cell: ({ row }) => formatDateTime(row.original.expires_at),
      meta: { label: '过期时间' },
    },
    {
      accessorKey: 'created_at',
      header: '创建时间',
      cell: ({ row }) => formatDateTime(row.original.created_at),
      meta: { label: '创建时间' },
    },
    {
      id: 'actions',
      enableHiding: false,
      header: '操作',
      cell: ({ row }) => {
        const esc = row.original
        const isPending = esc.status === 'pending'
        return (
          <div className="flex items-center gap-1">
            {isPending && canApprove(esc) ? (
              <>
                <Button
                  variant="ghost" size="sm"
                  className="text-green-600 hover:text-green-700"
                  onClick={() => handleOpenApprove(esc)}
                  disabled={isApproving}
                >
                  <IconCheck className="size-4" />
                  {'批准'}
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleOpenReject(esc)}
                  disabled={isRejecting}
                >
                  <IconX className="size-4" />
                  {'拒绝'}
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
        )
      },
      meta: { label: '操作' },
    },
  ]
}
