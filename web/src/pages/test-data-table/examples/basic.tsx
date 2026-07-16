import { IconList } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'

import type { ExampleConfig } from '../types'

interface TestRow {
  id: number
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

const SAMPLE_DATA: TestRow[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['Admin', 'Editor', 'Viewer', 'Guest'][i % 4],
  status: i % 4 === 0 ? 'Disabled' : 'Active',
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}))

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'email', header: '邮箱' },
  {
    accessorKey: 'role',
    header: '角色',
    cell: ({ getValue }) => {
      const role = getValue() as string
      const variant = { Admin: 'default', Editor: 'secondary', Viewer: 'outline', Guest: 'outline' } as const
      return <Badge variant={variant[role] ?? 'outline'}>{role}</Badge>
    },
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return <Badge variant={v === 'Active' ? 'default' : 'secondary'}>{v}</Badge>
    },
  },
  { accessorKey: 'createdAt', header: '创建时间' },
]

function BasicExample() {
  return (
    <DataTable
      columns={columns}
      data={SAMPLE_DATA}
      enableSorting
      getRowId={(row) => String(row.id)}
    />
  )
}

export const basicExample: ExampleConfig = {
  key: 'basic',
  label: '基础用法',
  icon: IconList,
  description: '50 条模拟数据，启用排序，无行选择、无分页',
  Component: BasicExample,
  snippet: `interface TestRow {
  id: number
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'email', header: '邮箱' },
  // ... 更多列
]

return (
  <DataTable
    columns={columns}
    data={data}
    enableSorting
    getRowId={(row) => String(row.id)}
  />
)`,
}
