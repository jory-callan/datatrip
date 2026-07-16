import { IconArrowsSort } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'

import type { ExampleConfig } from '../types'

interface SortRow {
  id: number
  name: string
  category: string
  price: number
  stock: number
  rating: number
  createdAt: string
}

const PRODUCTS: SortRow[] = [
  { id: 1, name: '无线蓝牙耳机', category: '数码', price: 299, stock: 1200, rating: 4.5, createdAt: '2025-01-15' },
  { id: 2, name: '机械键盘', category: '数码', price: 599, stock: 340, rating: 4.8, createdAt: '2025-02-20' },
  { id: 3, name: '羊绒围巾', category: '服饰', price: 199, stock: 89, rating: 4.2, createdAt: '2025-03-10' },
  { id: 4, name: '智能手表', category: '数码', price: 1299, stock: 560, rating: 4.6, createdAt: '2025-01-28' },
  { id: 5, name: '运动跑鞋', category: '运动', price: 459, stock: 234, rating: 4.3, createdAt: '2025-04-05' },
  { id: 6, name: '保温水杯', category: '家居', price: 89, stock: 2100, rating: 4.1, createdAt: '2025-02-14' },
  { id: 7, name: '笔记本电脑包', category: '数码', price: 159, stock: 456, rating: 3.9, createdAt: '2025-03-22' },
  { id: 8, name: '瑜伽垫', category: '运动', price: 69, stock: 1678, rating: 4.7, createdAt: '2025-01-08' },
  { id: 9, name: '台灯', category: '家居', price: 129, stock: 890, rating: 4.0, createdAt: '2025-04-18' },
  { id: 10, name: '羽绒服', category: '服饰', price: 899, stock: 120, rating: 4.4, createdAt: '2025-05-01' },
  { id: 11, name: '移动电源', category: '数码', price: 149, stock: 3400, rating: 4.2, createdAt: '2025-02-28' },
  { id: 12, name: '帆布鞋', category: '服饰', price: 129, stock: 567, rating: 3.8, createdAt: '2025-03-15' },
  { id: 13, name: '跳绳', category: '运动', price: 29, stock: 4500, rating: 4.6, createdAt: '2025-01-20' },
  { id: 14, name: '收纳箱', category: '家居', price: 49, stock: 2340, rating: 4.3, createdAt: '2025-04-12' },
  { id: 15, name: '显示器支架', category: '数码', price: 239, stock: 678, rating: 4.5, createdAt: '2025-05-10' },
]

const columns: ColumnDef<SortRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '商品名称' },
  { accessorKey: 'category', header: '分类' },
  {
    accessorKey: 'price',
    header: '价格 (¥)',
    cell: ({ getValue }) => `¥${getValue() as number}`,
  },
  {
    accessorKey: 'stock',
    header: '库存',
    cell: ({ getValue }) => (getValue() as number).toLocaleString(),
  },
  {
    accessorKey: 'rating',
    header: '评分',
    cell: ({ getValue }) => {
      const r = getValue() as number
      let color = 'text-red-500'
      if (r >= 4.5) color = 'text-green-600'
      else if (r >= 4.0) color = 'text-yellow-600'
      return <span className={color}>{r} ★</span>
    },
  },
  { accessorKey: 'createdAt', header: '上架日期' },
]

function SortingExample() {
  return (
    <DataTable
      columns={columns}
      data={PRODUCTS}
      enableSorting
      getRowId={(row) => String(row.id)}
    />
  )
}

export const sortingExample: ExampleConfig = {
  key: 'sorting',
  label: '排序',
  icon: IconArrowsSort,
  description: '多种数据类型排序：数字（价格/库存/评分）、字符串（名称/分类）、日期',
  Component: SortingExample,
  snippet: `// 每个列头均可点击排序（asc → desc → none）
// 数据类型自动处理：数字比大小，字符串比字典序

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'price', header: '价格 (¥)' },       // 数字排序
  { accessorKey: 'name', header: '商品名称' },         // 字符串排序
  { accessorKey: 'createdAt', header: '上架日期' },   // 日期字符串排序
]

<DataTable columns={columns} data={data} enableSorting />`,
}
