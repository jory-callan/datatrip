import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { IconDotsVertical, IconEdit } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { formatDateTime } from '@/lib/utils'
import type { Webhook } from '@/lib/api/webhooks'

function ActionDropdown({
  row,
  openEdit,
  isUpdating,
}: {
  row: Webhook
  openEdit: (wh: Webhook) => void
  isUpdating: boolean
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
          disabled={isUpdating}
          className={itemClass}
          onClick={() => { setOpen(false); openEdit(row) }}
        >
          <IconEdit className="size-4" /> 编辑
        </button>
      </HoverCardContent>
    </HoverCard>
  )
}

export function useWebhookColumns(
  openEdit: (wh: Webhook) => void,
  isUpdating: boolean,
): ColumnDef<Webhook>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      meta: { label: 'ID' },
    },
    {
      accessorKey: 'name',
      header: '名称',
      meta: { label: '名称' },
    },
    {
      accessorKey: 'scope',
      header: '范围',
      cell: ({ row }) => <Badge variant="outline">{(row.original as any).scope}</Badge>,
      meta: { label: '范围' },
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block font-mono text-xs">{row.original.url}</span>
      ),
      meta: { label: 'URL' },
    },
    {
      accessorKey: 'events',
      header: '事件',
      cell: ({ row }) => {
        const events = row.original.events
        if (!events || events.length === 0) return '-'
        return (
          <div className="flex flex-wrap gap-1">
            {events.slice(0, 3).map((e) => (
              <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
            ))}
            {events.length > 3 && <span className="text-xs text-muted-foreground">+{events.length - 3}</span>}
          </div>
        )
      },
      meta: { label: '事件' },
    },
    {
      accessorKey: 'enabled',
      header: '启用',
      cell: ({ row }) => {
        const enabled = (row.original as any).enabled
        return (
          <Badge variant={enabled ? 'default' : 'secondary'}>
            {enabled ? '启用' : '禁用'}
          </Badge>
        )
      },
      meta: { label: '启用' },
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
        <ActionDropdown row={row.original} openEdit={openEdit} isUpdating={isUpdating} />
      ),
      meta: { label: '操作', pinned: 'right' as const },
    },
  ]
}
