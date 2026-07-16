import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { IconCheck, IconDotsVertical, IconEdit, IconTrash, IconX } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn, formatDateTime } from '@/lib/utils'
import type { Escalation } from '@/lib/api/escalations'

import { STATUS_CONFIG, STATUS_LABEL } from './use-escalations'

function ActionDropdown({
  row,
  canApprove,
  handleOpenApprove,
  handleOpenReject,
  handleOpenEdit,
  handleOpenDelete,
  isApproving,
  isRejecting,
}: {
  row: Escalation
  canApprove: (esc: Escalation) => boolean
  handleOpenApprove: (esc: Escalation) => void
  handleOpenReject: (esc: Escalation) => void
  handleOpenEdit: (esc: Escalation) => void
  handleOpenDelete: (esc: Escalation) => void
  isApproving: boolean
  isRejecting: boolean
}) {
  const [open, setOpen] = useState(false)
  const itemClass =
    'focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none w-full [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4'
  const destClass =
    'text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 focus:text-destructive [&_svg]:!text-destructive'
  const greenClass =
    'text-green-600 focus:bg-green-50 focus:text-green-700 [&_svg]:!text-green-600'

  const isPending = row.status === 'pending'

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={0} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost" size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        >
          <IconDotsVertical className="size-4" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="end" sideOffset={4} className="w-36 p-1">
        {isPending && canApprove(row) && (
          <button
            type="button"
            disabled={isApproving}
            className={cn(itemClass, greenClass, isApproving && 'opacity-50 pointer-events-none')}
            onClick={() => { setOpen(false); handleOpenApprove(row) }}
          >
            <IconCheck className="size-4" /> 批准
          </button>
        )}
        {isPending && canApprove(row) && (
          <button
            type="button"
            disabled={isRejecting}
            className={cn(itemClass, destClass, isRejecting && 'opacity-50 pointer-events-none')}
            onClick={() => { setOpen(false); handleOpenReject(row) }}
          >
            <IconX className="size-4" /> 拒绝
          </button>
        )}
        {isPending && (
          <button
            type="button"
            className={itemClass}
            onClick={() => { setOpen(false); handleOpenEdit(row) }}
          >
            <IconEdit className="size-4" /> 编辑
          </button>
        )}
        <button
          type="button"
          className={cn(itemClass, destClass)}
          onClick={() => { setOpen(false); handleOpenDelete(row) }}
        >
          <IconTrash className="size-4" /> 删除
        </button>
      </HoverCardContent>
    </HoverCard>
  )
}

export function useEscalationColumns(
  projects: { id: number | string; name: string }[],
  canApprove: (esc: Escalation) => boolean,
  handleOpenApprove: (esc: Escalation) => void,
  handleOpenReject: (esc: Escalation) => void,
  handleOpenEdit: (esc: Escalation) => void,
  handleOpenDelete: (esc: Escalation) => void,
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
      header: '所属项目',
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
      size: 64,
      cell: ({ row }) => (
        <ActionDropdown
          row={row.original}
          canApprove={canApprove}
          handleOpenApprove={handleOpenApprove}
          handleOpenReject={handleOpenReject}
          handleOpenEdit={handleOpenEdit}
          handleOpenDelete={handleOpenDelete}
          isApproving={isApproving}
          isRejecting={isRejecting}
        />
      ),
      meta: { label: '操作', pinned: 'right' as const },
    },
  ]
}
