import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { DatasourceRule } from '@/lib/api/datasource-rules'

function ActionDropdown({
  row,
  openEdit,
  handleDelete,
  isUpdating,
  isDeleting,
}: {
  row: DatasourceRule
  openEdit: (rule: DatasourceRule) => void
  handleDelete: (rule: DatasourceRule) => void
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

export function useDatasourceRuleColumns(
  handleToggleEnabled: (rule: DatasourceRule) => void,
  openEdit: (rule: DatasourceRule) => void,
  handleDelete: (rule: DatasourceRule) => void,
  isUpdating: boolean,
  isDeleting: boolean,
) {
  const columns: ColumnDef<DatasourceRule>[] = [
    { accessorKey: 'name', header: '规则名称', meta: { label: '规则名称' } },
    {
      accessorKey: 'type_group',
      header: '分组',
      cell: ({ row }) => {
        const group = row.original.type_group
        const label = group || '全部'
        return <Badge variant="outline" className="text-xs">{label}</Badge>
      },
      meta: { label: '分组' },
    },
    {
      accessorKey: 'type_scope',
      header: '适用范围',
      cell: ({ row }) => {
        const scope = row.original.type_scope
        const label = scope || '全部'
        return <Badge variant="outline">{label}</Badge>
      },
      meta: { label: '适用范围' },
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => {
        const cat = row.original.category
        const variant = cat === 'dangerous' ? 'destructive' : cat === 'write' ? 'default' : 'secondary'
        return <Badge variant={variant}>{cat}</Badge>
      },
      meta: { label: '分类' },
    },
    {
      accessorKey: 'priority',
      header: '优先级',
      meta: { label: '优先级' },
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
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      ),
      meta: { label: '操作', pinned: 'right' as const },
    },
  ]
  return columns
}
