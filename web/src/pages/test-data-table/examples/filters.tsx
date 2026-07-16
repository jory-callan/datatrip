import { useCallback, useMemo, useState } from 'react'
import { IconFilter } from '@tabler/icons-react'
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
      return <span className={{ P0: 'text-red-600 font-bold', P1: 'text-orange-600 font-semibold', P2: 'text-yellow-600', P3: 'text-muted-foreground' }[p] ?? ''}>{p}</span>
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

function FiltersExample() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [data] = useState(TASKS)
  // 受控筛选值 — 模拟：筛选变化时重置页码 (真实场景会触发 API 请求)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})

  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize)

  const handleFiltersChange = useCallback((values: Record<string, string>) => {
    setFilterValues(values)
    setPage(1) // 筛选变化 → 重置到第一页
  }, [])

  // 模拟拼出的 query string 预览
  const queryPreview = useMemo(() => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(filterValues)) {
      if (v && v !== '_all') params.set(k, v)
    }
    const qs = params.toString()
    return qs ? `?${qs}` : '(无筛选条件)'
  }, [filterValues])

  return (
    <div>
      <DataTable
        columns={columns}
        data={paginatedData}
        enableRowSelection
        enableSorting
        getRowId={(row) => String(row.id)}
        filterValues={filterValues}
        onFiltersChange={handleFiltersChange}
        filters={[
          {
            id: 'status',
            label: '状态',
            type: 'select',
            options: [
              { value: '_all', label: '全部状态' },
              { value: '=todo', label: '待办' },
              { value: '=in_progress', label: '进行中' },
              { value: '=done', label: '已完成' },
              { value: '=cancelled', label: '已取消' },
            ],
          },
          {
            id: 'priority',
            label: '优先级',
            type: 'select',
            options: [
              { value: '_all', label: '全部优先级' },
              { value: '=P0', label: 'P0 紧急' },
              { value: '=P1', label: 'P1 高' },
              { value: '=P2', label: 'P2 中' },
              { value: '=P3', label: 'P3 低' },
            ],
          },
          {
            id: 'assignee',
            label: '负责人',
            type: 'input',
            placeholder: '输入姓名...',
          },
        ]}
        toolbar={{
          searchPlaceholder: '全文搜索...',
          onRefresh: () => {},
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
      {/* 模拟查询参数预览 */}
      <div className="mt-3 px-3 text-xs text-muted-foreground">
        <span className="font-medium">模拟 query string：</span>
        <code className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono">
          {queryPreview}
        </code>
      </div>
    </div>
  )
}

export const filtersExample: ExampleConfig = {
  key: 'filters',
  label: '列级筛选',
  icon: IconFilter,
  description: '受控模式 — DataTable 只渲染控件和吐回值，父组件收到 onFiltersChange 后自行触发 API 请求',
  Component: FiltersExample,
}
