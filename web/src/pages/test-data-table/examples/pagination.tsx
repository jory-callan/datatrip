import { useState } from 'react'
import { IconChevronsRight } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'

import type { ExampleConfig } from '../types'

interface PageRow {
  id: number
  title: string
  author: string
  status: string
  views: number
  updatedAt: string
}

function generateRows(page: number, pageSize: number): PageRow[] {
  const statuses = ['已发布', '草稿', '审核中', '已下线']
  return Array.from({ length: pageSize }, (_, i) => {
    const idx = (page - 1) * pageSize + i + 1
    return {
      id: idx,
      title: `文章标题 #${String(idx).padStart(4, '0')}`,
      author: ['张三', '李四', '王五', '赵六', '钱七'][idx % 5],
      status: statuses[idx % statuses.length],
      views: Math.floor(Math.random() * 10000),
      updatedAt: new Date(Date.now() - idx * 3600000).toISOString(),
    }
  })
}

const TOTAL = 157
const PAGE_SIZE = 15

const columns: ColumnDef<PageRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'title', header: '标题' },
  { accessorKey: 'author', header: '作者' },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ getValue }) => {
      const s = getValue() as string
      const variant = { '已发布': 'default', '草稿': 'secondary', '审核中': 'outline', '已下线': 'destructive' } as const
      return <Badge variant={variant[s] ?? 'outline'}>{s}</Badge>
    },
  },
  {
    accessorKey: 'views',
    header: '阅读量',
    cell: ({ getValue }) => (getValue() as number).toLocaleString(),
  },
  { accessorKey: 'updatedAt', header: '更新时间' },
]

function PaginationExample() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const data = generateRows(page, pageSize)

  return (
    <DataTable
      columns={columns}
      data={data}
      enableSorting
      getRowId={(row) => String(row.id)}
      pagination={{
        page,
        pageSize,
        total: TOTAL,
        needCount: true,
        onPageChange: setPage,
        onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
      }}
    />
  )
}

export const paginationExample: ExampleConfig = {
  key: 'pagination',
  label: '分页',
  icon: IconChevronsRight,
  description: '157 条数据，每页 15 条，支持切换每页条数',
  Component: PaginationExample,
  snippet: `const [page, setPage] = useState(1)
const [pageSize, setPageSize] = useState(15)

<DataTable
  columns={columns}
  data={data}
  enableSorting
  pagination={{
    page,
    pageSize,
    total: 157,
    needCount: true,
    onPageChange: setPage,
    onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
  }}
/>`,
}
