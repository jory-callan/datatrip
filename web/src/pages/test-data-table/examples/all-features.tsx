import { useState } from 'react'
import { IconStar } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'

import type { ExampleConfig } from '../types'

interface TaskRow {
  id: number
  title: string
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  assignee: string
  progress: number
  createdAt: string
}

const TASKS: TaskRow[] = Array.from({ length: 86 }, (_, i) => ({
  id: i + 1,
  title: [
    '实现用户权限管理',
    '优化数据库查询性能',
    '编写 API 文档',
    '修复登录页面样式 bug',
    '添加日志收集功能',
    '重构审批流程模块',
    '集成钉钉通知',
    '升级前端构建工具',
    '设计系统监控面板',
    '编写单元测试',
  ][i % 10],
  status: (['todo', 'in_progress', 'done', 'cancelled'] as const)[i % 4],
  priority: (['P0', 'P1', 'P2', 'P3'] as const)[i % 4],
  assignee: ['张三', '李四', '王五', '赵六'][i % 4],
  progress: Math.min(100, i * 13),
  createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
}))

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  todo: { label: '待办', variant: 'outline' },
  in_progress: { label: '进行中', variant: 'default' },
  done: { label: '已完成', variant: 'secondary' },
  cancelled: { label: '已取消', variant: 'destructive' },
}

const priorityColor: Record<string, string> = {
  P0: 'text-red-600 font-bold',
  P1: 'text-orange-600 font-semibold',
  P2: 'text-yellow-600',
  P3: 'text-muted-foreground',
}

const columns: ColumnDef<TaskRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  {
    accessorKey: 'title',
    header: '任务',
    cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ getValue }) => {
      const s = getValue() as keyof typeof statusConfig
      return <Badge variant={statusConfig[s].variant}>{statusConfig[s].label}</Badge>
    },
  },
  {
    accessorKey: 'priority',
    header: '优先级',
    cell: ({ getValue }) => {
      const p = getValue() as string
      return <span className={priorityColor[p]}>{p}</span>
    },
  },
  { accessorKey: 'assignee', header: '负责人' },
  {
    accessorKey: 'progress',
    header: '进度',
    cell: ({ getValue }) => {
      const p = getValue() as number
      return (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p}%` }} />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right">{p}%</span>
        </div>
      )
    },
  },
  { accessorKey: 'createdAt', header: '创建时间' },
]

function AllFeaturesExample() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [data, setData] = useState(TASKS)

  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize)

  return (
    <DataTable
      columns={columns}
      data={paginatedData}
      loading={false}
      enableRowSelection
      enableSorting
      getRowId={(row) => String(row.id)}
      toolbar={{
        searchPlaceholder: '搜索任务...',
        createLabel: '新建任务',
        refreshLabel: '刷新',
        refreshIntervalOptions: [10, 30, 60],
        onCreate: () => alert('新建任务 (演示)'),
        onRefresh: () => alert('刷新 (演示)'),
        onBatchDelete: (rows) => {
          const ids = new Set(rows.map((r: TaskRow) => r.id))
          setData((prev) => prev.filter((d) => !ids.has(d.id)))
        },
      }}
      pagination={{
        page,
        pageSize,
        total: data.length,
        needCount: true,
        onPageChange: setPage,
        onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
      }}
    />
  )
}

export const allFeaturesExample: ExampleConfig = {
  key: 'all-features',
  label: '全部功能',
  icon: IconStar,
  description: '排序 + 分页 + 行选择 + 工具栏 + 自定义单元格，完整场景',
  Component: AllFeaturesExample,
  snippet: `<DataTable
  columns={columns}
  data={paginatedData}
  enableRowSelection
  enableSorting
  getRowId={(row) => String(row.id)}
  toolbar={{
    searchPlaceholder: '搜索...',
    createLabel: '新建',
    refreshIntervalOptions: [10, 30, 60],
    onCreate: () => handleCreate(),
    onRefresh: () => handleRefresh(),
    onBatchDelete: (rows) => handleBatchDelete(rows),
  }}
  pagination={{
    page, pageSize,
    total: data.length,
    needCount: true,
    onPageChange: setPage,
    onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
  }}
/>`,
}
