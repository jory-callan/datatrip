import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { IconDotsVertical, IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { formatDateTime, cn } from '@/lib/utils'
import type { AuditLog } from '@/lib/api/audits'

import { ACTION_LABEL } from './use-audits'

function ActionDropdown({
  row,
  toggleExpand,
}: {
  row: AuditLog
  toggleExpand: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const itemClass =
    'focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none w-full [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4'

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
        <button
          type="button"
          className={itemClass}
          onClick={() => { setOpen(false); toggleExpand(row.id) }}
        >
          <IconEye className="size-4" /> 查看详情
        </button>
      </HoverCardContent>
    </HoverCard>
  )
}

export function useAuditColumns(toggleExpand: (id: string) => void): ColumnDef<AuditLog>[] {

  return [
    {
      accessorKey: 'id',
      header: 'ID',
      meta: { label: 'ID' },
      size: 80,
    },
    {
      accessorKey: 'actor_id',
      header: '操作人',
      cell: ({ row }) => `#${row.original.actor_id}`,
      meta: { label: '操作人' },
    },
    {
      accessorKey: 'action',
      header: '操作类型',
      cell: ({ row }) => {
        const action = row.original.action
        return ACTION_LABEL[action] ?? action
      },
      meta: { label: '操作类型' },
    },
    {
      accessorKey: 'raw_text',
      header: '原始指令',
      cell: ({ row }) => {
        const text = row.original.raw_text || '-'
        return (
          <span className="font-mono text-xs">{text.length > 80 ? `${text.slice(0, 80)}...` : text}</span>
        )
      },
      meta: { label: '原始指令' },
    },
    {
      accessorKey: 'classification',
      header: '分类',
      cell: ({ row }) => {
        const cls = row.original.classification
        return (
          <Badge variant={cls === 'write' ? 'destructive' : 'secondary'}>
            {cls === 'write' ? '写' : '读'}
          </Badge>
        )
      },
      meta: { label: '分类' },
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge className={cn(
            status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
          )}>
            {status === 'success' ? '成功' : '失败'}
          </Badge>
        )
      },
      meta: { label: '状态' },
    },
    {
      accessorKey: 'duration_ms',
      header: '耗时(ms)',
      cell: ({ row }) => row.original.duration_ms ?? '-',
      meta: { label: '耗时(ms)' },
    },
    {
      accessorKey: 'error_message',
      header: '错误信息',
      cell: ({ row }) => {
        const err = row.original.error_message
        if (!err) return '-'
        return (
          <span className="text-xs text-red-500 truncate block max-w-[200px]">
            {err.length > 50 ? `${err.slice(0, 50)}...` : err}
          </span>
        )
      },
      meta: { label: '错误信息' },
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      meta: { label: 'IP' },
    },
    {
      accessorKey: 'created_at',
      header: '时间',
      cell: ({ row }) => formatDateTime(row.original.created_at),
      meta: { label: '时间' },
      size: 160,
    },
    {
      id: 'actions',
      enableHiding: false,
      header: '操作',
      size: 64,
      cell: ({ row }) => (
        <ActionDropdown row={row.original} toggleExpand={toggleExpand} />
      ),
      meta: { label: '操作', pinned: 'right' as const },
    },
  ]
}
