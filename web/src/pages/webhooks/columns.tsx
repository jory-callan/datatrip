import { type ColumnDef } from '@tanstack/react-table'
import { IconPencil } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { Webhook } from '@/lib/api/webhooks'

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
      cell: ({ row }) => <Badge variant="outline">{row.original.scope}</Badge>,
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
      cell: ({ row }) => (
        <Badge variant={row.original.enabled ? 'default' : 'secondary'}>
          {row.original.enabled ? '启用' : '禁用'}
        </Badge>
      ),
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
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm"
            disabled={isUpdating}
            onClick={() => openEdit(row.original)}
          >
            <IconPencil className="size-4" />
            {'编辑'}
          </Button>
        </div>
      ),
      meta: { label: '操作' },
    },
  ]
}
