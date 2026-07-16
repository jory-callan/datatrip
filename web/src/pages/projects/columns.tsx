import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { IconDotsVertical, IconEdit, IconTrash, IconUsers } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'
import type { DataProject } from '@/lib/api/projects'

function ActionDropdown({
  row,
  openMembers,
  openEdit,
  handleDelete,
  isUpdating,
  isDeleting,
}: {
  row: DataProject
  openMembers: (proj: DataProject) => void
  openEdit: (proj: DataProject) => void
  handleDelete: (proj: DataProject) => void
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
          className={itemClass}
          onClick={() => { setOpen(false); openMembers(row) }}
        >
          <IconUsers className="size-4" /> 成员管理
        </button>
        <button
          type="button"
          disabled={isUpdating}
          className={cn(itemClass, isUpdating && 'opacity-50 pointer-events-none')}
          onClick={() => { setOpen(false); openEdit(row) }}
        >
          <IconEdit className="size-4" /> 编辑
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

export function useProjectColumns(
  datasources: { id: string; name: string }[],
  openMembers: (proj: DataProject) => void,
  openEdit: (proj: DataProject) => void,
  handleDelete: (proj: DataProject) => void,
  isUpdating: boolean,
  isDeleting: boolean,
): ColumnDef<DataProject>[] {
  return [
    { accessorKey: 'name', header: '项目名称', meta: { label: '项目名称' } },
    {
      id: 'datasource_id',
      header: '数据源',
      cell: ({ row }) => {
        const ds = datasources.find((d) => d.id === row.original.datasource_id)
        return ds?.name ?? String(row.original.datasource_id)
      },
      meta: { label: '数据源' },
    },
    {
      accessorKey: 'scope',
      header: '资源范围',
      cell: ({ row }) => {
        const scope = row.original.scope
        if (!scope || scope.length === 0) return <span className="text-muted-foreground">-</span>
        return scope.join(', ')
      },
      meta: { label: '资源范围' },
    },
    {
      accessorKey: 'approval_mode',
      header: '审批模式',
      cell: ({ row }) => {
        const mode = row.original.approval_mode
        return <Badge variant="outline">{mode === 'any_one' ? '任意一人' : '全部'}</Badge>
      },
      meta: { label: '审批模式' },
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
          openMembers={openMembers}
          openEdit={openEdit}
          handleDelete={handleDelete}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      ),
      meta: { label: '操作', pinned: 'right' as const },
    },
  ]
}
