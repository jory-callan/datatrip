import { type ColumnDef } from '@tanstack/react-table'
import { IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { Ticket } from '@/lib/api/tickets'

import { STATUS_CONFIG, STATUS_LABEL } from './constants'

export function useTicketColumns(
  projects: { id: number; name: string }[],
  handleViewDetail: (ticket: Ticket) => void,
): ColumnDef<Ticket>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      meta: { label: 'ID' },
      size: 80,
    },
    {
      accessorKey: 'project_id',
      header: '项目名称',
      cell: ({ row }) => {
        const project = projects.find((p) => p.id === row.original.project_id)
        return project?.name ?? `#${row.original.project_id}`
      },
      meta: { label: '项目名称' },
    },
    {
      id: 'applicant',
      header: '申请人',
      cell: ({ row }) => `#${row.original.applicant_id}`,
      meta: { label: '申请人' },
    },
    {
      accessorKey: 'sql_snapshot',
      header: 'SQL',
      cell: ({ row }) => {
        const sql = row.original.sql_snapshot
        return (
          <span className="font-mono text-xs">{sql.length > 100 ? `${sql.slice(0, 100)}...` : sql}</span>
        )
      },
      meta: { label: 'SQL' },
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.original.status
        const config = STATUS_CONFIG[status]
        if (!config) return <Badge variant="outline">{status}</Badge>
        return <Badge className={config.className}>{STATUS_LABEL[status] ?? status}</Badge>
      },
      meta: { label: '状态' },
    },
    {
      accessorKey: 'approval_mode',
      header: '审批模式',
      cell: ({ row }) => {
        const mode = row.original.approval_mode
        return mode === 'any_one' ? '任意一人' : '全部通过'
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
          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(row.original)}>
            <IconEye className="size-4" />
            {'查看'}
          </Button>
        </div>
      ),
      meta: { label: '操作' },
    },
  ]
}
