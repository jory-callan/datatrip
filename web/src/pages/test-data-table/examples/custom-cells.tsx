import { IconPalette } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'

import type { ExampleConfig } from '../types'

interface ComplexRow {
  id: number
  name: string
  progress: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  assignee: { name: string; avatar: string }
}

const DATA: ComplexRow[] = [
  { id: 1, name: '用户登录模块重构', progress: 75, priority: 'high', tags: ['前端', '认证'], assignee: { name: '张三', avatar: 'ZS' } },
  { id: 2, name: '数据库连接池优化', progress: 30, priority: 'urgent', tags: ['后端', '性能', '数据库'], assignee: { name: '李四', avatar: 'LS' } },
  { id: 3, name: 'API 文档生成', progress: 90, priority: 'low', tags: ['文档', '自动化'], assignee: { name: '王五', avatar: 'WW' } },
  { id: 4, name: '单元测试覆盖率提升', progress: 45, priority: 'medium', tags: ['测试', '质量'], assignee: { name: '赵六', avatar: 'ZL' } },
  { id: 5, name: '部署流水线改造', progress: 10, priority: 'urgent', tags: ['CI/CD', '运维'], assignee: { name: '钱七', avatar: 'QQ' } },
  { id: 6, name: '监控告警系统接入', progress: 60, priority: 'high', tags: ['监控', '运维'], assignee: { name: '张三', avatar: 'ZS' } },
]

const priorityConfig = {
  low: { label: '低', variant: 'outline' as const },
  medium: { label: '中', variant: 'secondary' as const },
  high: { label: '高', variant: 'default' as const },
  urgent: { label: '紧急', variant: 'destructive' as const },
}

const columns: ColumnDef<ComplexRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  {
    accessorKey: 'name',
    header: '任务名称',
    cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
  },
  {
    accessorKey: 'progress',
    header: '进度',
    cell: ({ getValue }) => {
      const p = getValue() as number
      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${p}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right">{p}%</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: '优先级',
    cell: ({ getValue }) => {
      const p = getValue() as keyof typeof priorityConfig
      const cfg = priorityConfig[p]
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>
    },
  },
  {
    accessorKey: 'tags',
    header: '标签',
    cell: ({ getValue }) => {
      const tags = getValue() as string[]
      return (
        <div className="flex gap-1 flex-wrap">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] h-5">
              {tag}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'assignee',
    header: '负责人',
    cell: ({ getValue }) => {
      const a = getValue() as ComplexRow['assignee']
      return (
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            {a.avatar}
          </div>
          <span className="text-sm">{a.name}</span>
        </div>
      )
    },
  },
]

function CustomCellsExample() {
  return (
    <DataTable
      columns={columns}
      data={DATA}
      enableSorting
      getRowId={(row) => String(row.id)}
    />
  )
}

export const customCellsExample: ExampleConfig = {
  key: 'custom-cells',
  label: '自定义单元格',
  icon: IconPalette,
  description: '进度条、优先级 Badge、标签组、头像等自定义渲染',
  Component: CustomCellsExample,
  snippet: `// 列定义支持任意 React 组件
{
  accessorKey: 'progress',
  header: '进度',
  cell: ({ getValue }) => {
    const p = getValue() as number
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all"
               style={{ width: p + '%' }} />
        </div>
        <span className="text-xs">{p}%</span>
      </div>
    )
  },
},
{
  accessorKey: 'tags',
  header: '标签',
  cell: ({ getValue }) => {
    const tags = getValue() as string[]
    return tags.map(tag => <Badge key={tag}>{tag}</Badge>)
  },
}`,
}
