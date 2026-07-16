import { IconDotsVertical, IconEdit, IconKey, IconTrash, IconUserCheck } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime, cn } from '@/lib/utils'
import type { User } from '@/lib/api/users'

export function useUserColumns(
  openEdit: (user: User) => void,
  openResetPassword: (user: User) => void,
  openAssignRoles: (user: User) => void,
  handleDelete: (user: User) => void,
  isUpdating: boolean,
  isDeleting: boolean,
): ColumnDef<User>[] {
  return [
    { accessorKey: 'id', header: 'ID', meta: { label: 'ID' } },
    {
      accessorKey: 'nickname',
      header: '昵称',
      cell: ({ row }) => row.original.nickname || '-',
      meta: { label: '昵称' },
    },
    { accessorKey: 'username', header: '用户名', meta: { label: '用户名' } },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.original.status
        if (!status) return '-'
        const isActive = status === 'active'
        return (
          <Badge variant={isActive ? 'default' : 'secondary'} className={cn(isActive && 'bg-emerald-600 hover:bg-emerald-700')}>
            {status}
          </Badge>
        )
      },
      meta: { label: '状态' },
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={isUpdating} onClick={() => openEdit(row.original)}>
              <IconEdit className="size-4 mr-2" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openResetPassword(row.original)}>
              <IconKey className="size-4 mr-2" />
              重置密码
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openAssignRoles(row.original)}>
              <IconUserCheck className="size-4 mr-2" />
              分配角色
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              disabled={isDeleting}
              onClick={() => { void handleDelete(row.original) }}
            >
              <IconTrash className="size-4 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      meta: { label: '操作', pinned: 'right' as const },
    },
  ]
}
