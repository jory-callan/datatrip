import { IconDatabase } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'

import type { ExampleConfig } from '../types'

interface BigDataRow {
  id: number
  name: string
  email: string
  department: string
  level: string
  score: number
  active: boolean
  lastLogin: string
}

function generateBigData(count: number): BigDataRow[] {
  const depts = ['技术部', '产品部', '市场部', '运营部', '财务部', '人力资源部', '研发中心', '客服部']
  const levels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'M1', 'M2', 'M3']
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `员工_${String(i + 1).padStart(6, '0')}`,
    email: `employee.${i + 1}@company.com`,
    department: depts[i % depts.length],
    level: levels[i % levels.length],
    score: Number((Math.random() * 100).toFixed(1)),
    active: Math.random() > 0.15,
    lastLogin: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000).toISOString(),
  }))
}

const bigData = generateBigData(10000)

const columns: ColumnDef<BigDataRow>[] = [
  { accessorKey: 'id', header: '工号' },
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'email', header: '邮箱' },
  { accessorKey: 'department', header: '部门' },
  { accessorKey: 'level', header: '职级' },
  {
    accessorKey: 'score',
    header: '绩效分',
    cell: ({ getValue }) => {
      const score = getValue() as number
      let variant: 'default' | 'secondary' | 'destructive' = 'secondary'
      if (score >= 90) variant = 'default'
      else if (score < 60) variant = 'destructive'
      return <Badge variant={variant}>{score}</Badge>
    },
  },
  {
    accessorKey: 'active',
    header: '状态',
    cell: ({ getValue }) => {
      const active = getValue() as boolean
      return <Badge variant={active ? 'default' : 'secondary'}>{active ? '在职' : '离职'}</Badge>
    },
  },
  { accessorKey: 'lastLogin', header: '最后登录', cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('zh-CN') },
]

function BigDataExample() {
  return (
    <DataTable
      columns={columns}
      data={bigData}
      enableSorting
      getRowId={(row) => String(row.id)}
    />
  )
}

export const bigDataExample: ExampleConfig = {
  key: 'big-data',
  label: '大数据（10,000 行）',
  icon: IconDatabase,
  description: '10,000 条模拟员工数据，无虚拟滚动，测试渲染性能',
  Component: BigDataExample,
  snippet: `// 10,000 行数据
const data = generateBigData(10000)

// 使用方式与基础用法完全一致
<DataTable
  columns={columns}
  data={data}
  enableSorting
  getRowId={(row) => String(row.id)}
/>`,
}
