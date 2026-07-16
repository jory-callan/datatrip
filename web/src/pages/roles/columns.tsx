import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { IconDotsVertical, IconEdit, IconShield, IconTrash } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn, formatDateTime } from '@/lib/utils'
import type { Role } from '@/lib/api/roles'

function ActionDropdown({
  row,
  openEdit,
  openAssignPerms,
  handleDelete,
  isDeleting,
}: {
  row: Role
  openEdit: (role: Role) => void
  openAssignPerms: (role: Role) => void
  handleDelete: (role: Role) => void
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
          onClick={() => { setOpen(false); openEdit(row) }}
        >
          <IconEdit className="size-4" /> 编辑
        </button>
        <button
          type="button"
          className={itemClass}
          onClick={() => { setOpen(false); openAssignPerms(row) }}
        >
          <IconShield className="size-4" /> 分配权限码
        </button>
        <div className="h-px bg-border my-1" />
        <button
          type="button"
          disabled={row.is_system || isDeleting}
          className={cn(itemClass, destClass, (row.is_system || isDeleting) && 'opacity-50 pointer-events-none')}
          onClick={() => { setOpen(false); handleDelete(row) }}
        >
          <IconTrash className="size-4" /> 删除
        </button>
      </HoverCardContent>
    </HoverCard>
  )
}

export function useRoleColumns(
  openEdit: (role: Role) => void,
  openAssignPerms: (role: Role) => void,
  handleDelete: (role: Role) => void,
  isDeleting: boolean,
): ColumnDef<Role>[] {
  return [
    {
      accessorKey: 'code',
      header: '角色标识',
      meta: { label: '角色标识' },
      cell: ({ row }) => (
        <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs">
          {row.original.code}
        </code>
      ),
    },
    {
      accessorKey: 'name',
      header: '角色名称',
      meta: { label: '角色名称' },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: '描述',
      meta: { label: '描述' },
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
          {row.original.description || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'is_system',
      header: '类型',
      meta: { label: '类型' },
      cell: ({ row }) =>
        row.original.is_system ? (
          <Badge variant="default" className="text-[10px] h-5">系统</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] h-5">自定义</Badge>
        ),
    },
    {
      accessorKey: 'created_at',
      header: '创建时间',
      meta: { label: '创建时间' },
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: 'actions',
      enableHiding: false,
      header: '操作',
      size: 64,
      meta: { label: '操作', pinned: 'right' as const },
      cell: ({ row }) => (
        <ActionDropdown
          row={row.original}
          openEdit={openEdit}
          openAssignPerms={openAssignPerms}
          handleDelete={handleDelete}
          isDeleting={isDeleting}
        />
      ),
    },
  ]
}
