import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

export interface DataTablePagination {
  page: number
  pageSize: number
  total?: number
  needCount?: boolean
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export interface DataTableToolbarAction<TData> {
  label: string
  icon?: ReactNode
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'
  onClick: (rows: TData[]) => void
}

export interface DataTableToolbar<TData> {
  searchPlaceholder?: string
  createLabel?: string
  deleteLabel?: string
  refreshLabel?: string
  /** 自动刷新间隔选项（秒），例如 [10, 30, 60] */
  refreshIntervalOptions?: number[]
  extraActions?: DataTableToolbarAction<TData>[]
  onCreate?: () => void
  onRefresh?: () => void
  onBatchDelete?: (rows: TData[]) => void
}

/** 列级筛选器定义。DataTable 只负责渲染控件和吐回值，不碰数据。 */
export interface DataTableFilter {
  id: string
  label: string
  type: 'select' | 'input' | 'date'
  options?: { value: string; label: string }[]
  placeholder?: string
  /** 默认值（如 '_all'），变化时以此值为准触发 onFiltersChange */
  defaultValue?: string
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  loading?: boolean
  emptyText?: string
  /** 启用左侧勾选列（行选择） */
  enableRowSelection?: boolean
  /** 启用列头排序，默认 true */
  enableSorting?: boolean
  getRowId?: (row: TData, index: number) => string
  toolbar?: DataTableToolbar<TData>
  pagination?: DataTablePagination
  /** 列级筛选器定义 — 紧凑渲染在工具栏下方 */
  filters?: DataTableFilter[]
  /** 列级筛选当前值（受控）— 配合 onFiltersChange 使用 */
  filterValues?: Record<string, string>
  /** 列级筛选值变化回调 — 父组件应在此重置页码 */
  onFiltersChange?: (values: Record<string, string>) => void
  className?: string
}
