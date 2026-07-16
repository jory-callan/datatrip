import { useState } from 'react'
import { IconDotsVertical, IconEdit, IconLink, IconTrash } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn, formatDateTime } from '@/lib/utils'
import type { Permission } from '@/lib/api/permissions'

function ActionDropdown({
  row,
  openEdit,
  openViewBindings,
  handleDelete,
  isUpdating,
  isDeleting,
}: {
  row: Permission
  openEdit: (perm: Permission) => void
  openViewBindings: (perm: Permission) => void
  handleDelete: (perm: Permission) => void
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
      <HoverCardContent align="end" sideOffset={4} className="w-36 p-1">
        <button
          type="button"
          disabled={row.is_system || isUpdating}
          className={cn(itemClass, (row.is_system || isUpdating) && 'opacity-50 pointer-events-none')}
          onClick={() => { setOpen(false); openEdit(row) }}
        >
          <IconEdit className="size-4" /> 编辑
        </button>
        <button
          type="button"
          className={itemClass}
          onClick={() => { setOpen(false); openViewBindings(row) }}
        >
          <IconLink className="size-4" /> 查看绑定
        </button>
        <div className="h-px bg-border my-1" />
        <button
          type="button"
          disabled={row.is_system || isDeleting}
          className={cn(itemClass, destClass, (row.is_system || isDeleting) && 'opacity-50 pointer-events-none')}
          onClick={() => { setOpen(false); void handleDelete(row) }}
        >
          <IconTrash className="size-4" /> 删除
        </button>
      </HoverCardContent>
    </HoverCard>
  )
}

export function usePermissionColumns(
  openEdit: (perm: Permission) => void,
  openViewBindings: (perm: Permission) => void,
  handleDelete: (perm: Permission) => void,
  isUpdating: boolean,
  isDeleting: boolean,
): ColumnDef<Permission>[] {
  return [
    {
      accessorKey: 'code',
      header: '权限码',
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          {row.original.code}
        </code>
      ),
      meta: { label: '权限码' },
    },
    { accessorKey: 'name', header: '名称', meta: { label: '名称' } },
    {
      accessorKey: 'module',
      header: '所属模块',
      cell: ({ row }) => {
        const module = row.original.module
        if (!module) return <span className="text-muted-foreground">-</span>
        return (
          <Badge variant="outline" className="font-mono text-xs">
            {module}
          </Badge>
        )
      },
      meta: { label: '所属模块' },
    },
    {
      accessorKey: 'is_system',
      header: '类型',
      cell: ({ row }) => (
        <Badge variant={row.original.is_system ? 'default' : 'secondary'}>
          {row.original.is_system ? '系统' : '自定义'}
        </Badge>
      ),
      meta: { label: '类型' },
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
          openEdit={openEdit}
          openViewBindings={openViewBindings}
          handleDelete={handleDelete}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      ),
      meta: { label: '操作', pinned: 'right' as const },
    },
  ]
}
