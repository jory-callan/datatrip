import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { IconDotsVertical, IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { formatDateTime } from '@/lib/utils'
import type { Ticket } from '@/lib/api/tickets'

import { STATUS_CONFIG, STATUS_LABEL } from './constants'

function parseInstructionRaw(json: string): string {
  try {
    const instructions = JSON.parse(json)
    if (Array.isArray(instructions)) {
      return instructions.map((i: { raw?: string }) => i.raw ?? '').join('\n')
    }
  } catch { /* ignore */ }
  return json
}

function ActionDropdown({
  row,
  handleViewDetail,
}: {
  row: Ticket
  handleViewDetail: (ticket: Ticket) => void
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
      <HoverCardContent align="end" sideOffset={4} className="w-32 p-1">
        <button
          type="button"
          className={itemClass}
          onClick={() => { setOpen(false); handleViewDetail(row) }}
        >
          <IconEye className="size-4" /> 查看
        </button>
      </HoverCardContent>
    </HoverCard>
  )
}

export function useTicketColumns(
  projects: { id: string; name: string }[],
  handleViewDetail: (ticket: Ticket) => void,
): ColumnDef<Ticket>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      meta: { label: 'ID' },
      size: 80,
    },
    {
      accessorKey: 'project_id',
      header: '项目名称',
      cell: ({ row }) => {
        const project = projects.find((p) => p.id === String(row.original.project_id))
        return project?.name ?? `#${row.original.project_id}`
      },
      meta: { label: '项目名称' },
    },
    {
      id: 'applicant',
      header: '申请人',
      cell: ({ row }) => `#${row.original.applicant_id}`,
      meta: { label: '申请人' },
    },
    {
      accessorKey: 'instruction_json',
      header: '指令',
      cell: ({ row }) => {
        const raw = parseInstructionRaw(row.original.instruction_json)
        return (
          <span className="font-mono text-xs">{raw.length > 100 ? `${raw.slice(0, 100)}...` : raw}</span>
        )
      },
      meta: { label: '指令' },
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
      accessorKey: 'approval_mode',
      header: '审批模式',
      cell: ({ row }) => {
        const mode = row.original.approval_mode
        return mode === 'any_one' ? '任意一人' : '全部通过'
      },
      meta: { label: '审批模式' },
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
        <ActionDropdown row={row.original} handleViewDetail={handleViewDetail} />
      ),
      meta: { label: '操作', pinned: 'right' as const },
    },
  ]
}
