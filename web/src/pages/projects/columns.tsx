import { type ColumnDef } from '@tanstack/react-table'
import { IconPencil, IconTrash, IconUsers } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { DbProject } from '@/lib/api'

export function useProjectColumns(
  datasources: { id: number; name: string }[],
  openMembers: (proj: DbProject) => void,
  openEdit: (proj: DbProject) => void,
  handleDelete: (proj: DbProject) => void,
  isUpdating: boolean,
  isDeleting: boolean,
): ColumnDef<DbProject>[] {
  return [
    { accessorKey: 'id', header: 'ID', meta: { label: 'ID' } },
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
      accessorKey: 'databases',
      header: '数据库',
      cell: ({ row }) => {
        const dbs = row.original.databases
        if (!dbs || dbs.length === 0) return '-'
        return dbs.map((db) => (db === '*' ? '\u6240\u6709\u6570\u636e\u5e93' : db.includes('*') || db.includes('?') ? db : db)).join(', ')
      },
      meta: { label: '数据库' },
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
      cell: ({ row }) => formatDateTime(row.original.created_at),
      meta: { label: '创建时间' },
    },
    {
      id: 'actions',
      enableHiding: false,
      header: '操作',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openMembers(row.original)}>
            <IconUsers className="size-4" />
            {'成员管理'}
          </Button>
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
