import { type ColumnDef } from '@tanstack/react-table'
import { IconPencil, IconTrash } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime, cn } from '@/lib/utils'
import type { Datasource } from '@/lib/api/datasources'

export function useDatasourceColumns(
  openEdit: (ds: Datasource) => void,
  handleDelete: (ds: Datasource) => void,
  isUpdating: boolean,
  isDeleting: boolean,
): ColumnDef<Datasource>[] {
  return [
    { accessorKey: 'id', header: 'ID', meta: { label: 'ID' }, size: 80 },
    { accessorKey: 'name', header: '名称', meta: { label: '名称' } },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => {
        const type = row.original.type
        const isMySQL = type === 'mysql'
        return (
          <Badge className={cn(isMySQL ? 'bg-blue-600 hover:bg-blue-700' : 'bg-sky-600 hover:bg-sky-700')}>
            {type}
          </Badge>
        )
      },
      meta: { label: '类型' },
    },
    {
      id: 'host_port',
      header: '主机',
      cell: ({ row }) => `${row.original.host}:${row.original.port}`,
      meta: { label: '主机' },
    },
    {
      accessorKey: 'database',
      header: '数据库',
      cell: ({ row }) => row.original.database || '-',
      meta: { label: '数据库' },
    },
    {
      accessorKey: 'remark',
      header: '备注',
      cell: ({ row }) => {
        const remark = row.original.remark
        if (!remark) return <span className="text-muted-foreground">-</span>
        return (
          <span className="max-w-[260px] truncate block" title={remark}>
            {remark}
          </span>
        )
      },
      meta: { label: '备注' },
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
          <Button
            variant="ghost" size="sm"
            className="text-destructive hover:text-destructive"
            disabled={isDeleting}
            onClick={() => { void handleDelete(row.original) }}
          >
            <IconTrash className="size-4" />
            {'删除'}
          </Button>
        </div>
      ),
      meta: { label: '操作' },
    },
  ]
}
