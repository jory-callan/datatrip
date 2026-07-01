import { type ColumnDef } from '@tanstack/react-table'
import { IconPencil } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatDateTime } from '@/lib/utils'
import type { DatasourceRule } from '@/lib/api/datasource-rules'

export function useDatasourceRuleColumns(
  handleToggleEnabled: (rule: DatasourceRule) => void,
  openEdit: (rule: DatasourceRule) => void,
  isUpdating: boolean,
) {

  const columns: ColumnDef<DatasourceRule>[] = [
    { accessorKey: 'id', header: 'ID', meta: { label: 'ID' } },
    { accessorKey: 'name', header: '规则名称', meta: { label: '规则名称' } },
    {
      accessorKey: 'db_type',
      header: '数据库类型',
      cell: ({ row }) => <Badge variant="outline">{row.original.db_type}</Badge>,
      meta: { label: '数据库类型' },
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => {
        const cat = row.original.category
        const variant = cat === 'danger' ? 'destructive' : cat === 'write' ? 'default' : 'secondary'
        return <Badge variant={variant}>{cat}</Badge>
      },
      meta: { label: '分类' },
    },
    {
      accessorKey: 'pattern',
      header: '匹配模式',
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{row.original.pattern}</code>
      ),
      meta: { label: '匹配模式' },
    },
    {
      accessorKey: 'enabled',
      header: '启用',
      cell: ({ row }) => (
        <Switch
          checked={row.original.enabled}
          onCheckedChange={() => { void handleToggleEnabled(row.original) }}
          disabled={isUpdating}
        />
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
          <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => openEdit(row.original)}>
            <IconPencil className="size-4" />
            {'编辑'}
          </Button>
        </div>
      ),
      meta: { label: '操作' },
    },
  ]
  return columns
}
