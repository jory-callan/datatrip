import { useState } from 'react'
import { IconCheckbox, IconTrash } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'

import type { ExampleConfig } from '../types'

interface SelectRow {
  id: number
  name: string
  email: string
  role: string
  status: string
}

const DATA: SelectRow[] = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', status: 'active' },
  { id: 2, name: '李四', email: 'lisi@example.com', role: '编辑', status: 'active' },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: '编辑', status: 'disabled' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: '访客', status: 'active' },
  { id: 5, name: '钱七', email: 'qianqi@example.com', role: '管理员', status: 'disabled' },
  { id: 6, name: '孙八', email: 'sunba@example.com', role: '访客', status: 'active' },
  { id: 7, name: '周五', email: 'zhouwu@example.com', role: '编辑', status: 'active' },
  { id: 8, name: '吴九', email: 'wujiu@example.com', role: '访客', status: 'active' },
]

const columns: ColumnDef<SelectRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'email', header: '邮箱' },
  {
    accessorKey: 'role',
    header: '角色',
    cell: ({ getValue }) => {
      const role = getValue() as string
      const v = { '管理员': 'default', '编辑': 'secondary', '访客': 'outline' } as const
      return <Badge variant={v[role] ?? 'outline'}>{role}</Badge>
    },
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ getValue }) => {
      const s = getValue() as string
      return <Badge variant={s === 'active' ? 'default' : 'secondary'}>{s === 'active' ? '正常' : '禁用'}</Badge>
    },
  },
]

function RowSelectionExample() {
  const [data, setData] = useState(DATA)

  return (
    <DataTable
      columns={columns}
      data={data}
      enableRowSelection
      enableSorting
      getRowId={(row) => String(row.id)}
      toolbar={{
        deleteLabel: '批量删除',
        onBatchDelete: (rows) => {
          const ids = new Set(rows.map((r: SelectRow) => r.id))
          setData((prev) => prev.filter((d) => !ids.has(d.id)))
        },
        extraActions: [
          {
            label: '批量禁用',
            icon: <IconTrash className="size-4" />,
            variant: 'destructive',
            onClick: (rows) => {
              const ids = new Set(rows.map((r: SelectRow) => r.id))
              setData((prev) => prev.map((d) => ids.has(d.id) ? { ...d, status: 'disabled' } : d))
            },
          },
        ],
      }}
    />
  )
}

export const rowSelectionExample: ExampleConfig = {
  key: 'row-selection',
  label: '行选择',
  icon: IconCheckbox,
  description: '左侧勾选列，选中后可通过工具栏批量操作',
  Component: RowSelectionExample,
  snippet: `<DataTable
  columns={columns}
  data={data}
  enableRowSelection      // 启用左侧勾选列
  enableSorting
  getRowId={(row) => String(row.id)}
  toolbar={{
    deleteLabel: '批量删除',
    onBatchDelete: (rows) => {
      // rows 是选中行数据数组
      handleDelete(rows)
    },
    extraActions: [
      {
        label: '批量禁用',
        icon: <IconTrash className="size-4" />,
        variant: 'destructive',
        onClick: (rows) => handleBatchAction(rows),
      },
    ],
  }}
/>`,
}
