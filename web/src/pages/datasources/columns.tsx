import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { IconDotsVertical, IconEdit, IconPlugConnected, IconTrash } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'
import type { Datasource } from '@/lib/api/datasources'

function ActionDropdown({
  row,
  openEdit,
  handleDelete,
  handleTestConnection,
  isUpdating,
  isDeleting,
}: {
  row: Datasource
  openEdit: (ds: Datasource) => void
  handleDelete: (ds: Datasource) => void
  handleTestConnection: (id: string) => void
  isUpdating: boolean
  isDeleting: boolean
}) {
  const [open, setOpen] = useState(false)

  const itemClass =
    'focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none w-full [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4'
  const destClass =
    'text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 focus:text-destructive [&_svg]:!text-destructive'

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
      <HoverCardContent align="end" sideOffset={4} className="w-40 p-1">
        <button
          type="button"
          disabled={isUpdating}
          className={cn(itemClass, isUpdating && 'opacity-50 pointer-events-none')}
          onClick={() => { setOpen(false); openEdit(row) }}
        >
          <IconEdit className="size-4" /> 编辑
        </button>
        <button
          type="button"
          className={itemClass}
          onClick={() => { setOpen(false); void handleTestConnection(row.id) }}
        >
          <IconPlugConnected className="size-4" /> 测试连接
        </button>
        <div className="h-px bg-border my-1" />
        <button
          type="button"
          disabled={isDeleting}
          className={cn(itemClass, destClass, isDeleting && 'opacity-50 pointer-events-none')}
          onClick={() => { setOpen(false); void handleDelete(row) }}
        >
          <IconTrash className="size-4" /> 删除
        </button>
      </HoverCardContent>
    </HoverCard>
  )
}

export function useDatasourceColumns(
  openEdit: (ds: Datasource) => void,
  handleDelete: (ds: Datasource) => void,
  handleTestConnection: (id: string) => void,
  isUpdating: boolean,
  isDeleting: boolean,
): ColumnDef<Datasource>[] {
  return [
    { accessorKey: 'name', header: '名称', meta: { label: '名称' } },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => {
        const type = row.original.type
        return (
          <Badge className={cn('bg-blue-600 hover:bg-blue-700')}>
            {type}
          </Badge>
        )
      },
      meta: { label: '类型' },
    },
    {
      accessorKey: 'type_group',
      header: '分组',
      cell: ({ getValue }) => {
        const group = getValue() as string
        return <Badge variant="outline">{group}</Badge>
      },
      meta: { label: '分组' },
    },
    {
      id: 'host_port',
      header: '主机',
      cell: ({ row }) => `${row.original.host}:${row.original.port}`,
      meta: { label: '主机' },
    },
    {
      id: 'username',
      header: '用户',
      cell: ({ row }) => row.original.username,
      meta: { label: '用户' },
    },
    {
      accessorKey: 'remark',
      header: '备注',
      cell: ({ row }) => {
        const desc = row.original.remark
        if (!desc) return <span className="text-muted-foreground">-</span>
        return (
          <span className="max-w-[200px] truncate block" title={desc}>
            {desc}
          </span>
        )
      },
      meta: { label: '备注' },
    },
    {
      accessorKey: 'created_at',
      header: '创建时间',
      cell: ({ row }) => {
        const d = row.original.created_at
        if (!d) return <span className="text-muted-foreground">-</span>
        return <span className="text-xs">{d.slice(0, 16).replace('T', ' ')}</span>
      },
      meta: { label: '创建时间' },
      size: 140,
    },
    {
      id: 'actions',
      enableHiding: false,
      header: '操作',
      size: 64,
      cell: ({ row }) => (
        <ActionDropdown
          row={row.original}
          openEdit={openEdit}
          handleDelete={handleDelete}
          handleTestConnection={handleTestConnection}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      ),
      meta: { label: '操作', pinned: 'right' as const },
    },
  ]
}
