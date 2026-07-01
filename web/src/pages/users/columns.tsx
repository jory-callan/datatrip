import { type ColumnDef } from '@tanstack/react-table'
import { IconPencil, IconTrash } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime, cn } from '@/lib/utils'
import type { User } from '@/lib/api/users'

export function useUserColumns(
  openEdit: (user: User) => void,
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
      accessorKey: 'role_code',
      header: '角色',
      cell: ({ row }) => {
        const role = row.original.role_code
        if (!role) return '-'
        return <Badge variant="outline" className="font-mono">{role}</Badge>
      },
      meta: { label: '角色' },
    },
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
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => openEdit(row.original)}>
            <IconPencil className="size-4" />
            {'编辑'}
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={isDeleting} onClick={() => { void handleDelete(row.original) }}>
            <IconTrash className="size-4" />
            {'删除'}
          </Button>
        </div>
      ),
      meta: { label: '操作' },
    },
  ]
}
