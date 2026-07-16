import { useEffect, useMemo, useRef, useState } from 'react'
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconLoader2,
} from '@tabler/icons-react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { DataTablePaginationInner } from './data-table-pagination'
import { DataTableToolbarInner } from './data-table-toolbar'
import type { DataTableProps } from './types'

/**
 * 通用数据表格组件。
 *
 * 简化版：去除列固定（pinning）、虚拟滚动、列显隐、
 * localStorage 持久化、列宽配置等过度设计的功能。
 *
 * 核心功能：
 *   - 数据展示
 *   - 列头排序（点击切换 asc / desc / none）
 *   - 全局搜索过滤
 *   - 列级筛选（select / input），紧凑渲染，受控模式
 *   - 可选的左侧勾选列（行选择）
 *   - 分页控件
 *   - 工具栏（刷新 / 创建 / 批量删除 / 自定义操作）
 *   - 加载态 / 空态
 */
export function DataTable<TData>({
  columns,
  data,
  loading = false,
  emptyText,
  enableRowSelection,
  enableSorting = true,
  getRowId,
  toolbar,
  pagination,
  filters,
  filterValues,
  onFiltersChange,
  className,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [refreshInterval, setRefreshInterval] = useState(0)

  // 切换页 / 刷新时清除选择
  useEffect(() => {
    setRowSelection({})
  }, [data])

  // 用 ref 存储 onRefresh，避免 interval 因函数引用变化而反复重启
  const onRefreshRef = useRef(toolbar?.onRefresh)
  onRefreshRef.current = toolbar?.onRefresh

  // 自动刷新
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0 || !onRefreshRef.current) return
    const id = setInterval(() => onRefreshRef.current?.(), refreshInterval * 1000)
    return () => clearInterval(id)
  }, [refreshInterval])

  // 选择列
  const tableColumns = useMemo<ColumnDef<TData>[]>(() => {
    if (!enableRowSelection) return columns
    return [
      {
        id: 'select',
        size: 40,
        minSize: 40,
        maxSize: 40,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="全选当前页"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="选择当前行"
          />
        ),
      } as ColumnDef<TData>,
      ...columns,
    ]
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { globalFilter, rowSelection, sorting },
    enableRowSelection,
    enableSorting,
    getRowId,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rows = table.getRowModel().rows
  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)
  const showInitialLoading = loading && rows.length === 0
  const totalColumns = tableColumns.length

  // 筛选值变化处理
  const handleFilterChange = (id: string, value: string) => {
    if (!onFiltersChange) return
    onFiltersChange({ ...filterValues, [id]: value })
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {toolbar ? (
        <DataTableToolbarInner
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          loading={loading}
          selectedRows={selectedRows}
          config={toolbar}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
        />
      ) : null}

      {/* 列级筛选器 — 紧凑单行，受控模式 */}
      {filters?.length ? (
        <div className="flex flex-wrap items-center gap-2 px-3">
          <span className='text-sm'>  
            筛选:
          </span>
          {filters.map((filter) =>
            filter.type === 'select' ? (
              <div key={filter.id} className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{filter.label}</span>
                <Select
                  value={filterValues?.[filter.id] ?? filter.defaultValue ?? ''}
                  onValueChange={(v) => handleFilterChange(filter.id, v)}
                >
                  <SelectTrigger className="h-7 text-xs w-auto min-w-[100px]">
                    <SelectValue placeholder={filter.placeholder ?? filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : filter.type === 'date' ? (
              <div key={filter.id} className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{filter.label}</span>
                <Input
                  type="date"
                  value={filterValues?.[filter.id] ?? ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  className="h-7 text-xs w-[140px]"
                />
              </div>
            ) : (
              <div key={filter.id} className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{filter.label}</span>
                <Input
                  value={filterValues?.[filter.id] ?? ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  placeholder={filter.placeholder}
                  className="h-7 text-xs w-[130px]"
                />
              </div>
            ),
          )}
        </div>
      ) : null}

      {/* 信息栏 */}
      <div className="px-3 shrink-0 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {loading ? (
          <Badge variant="secondary" className="gap-1">
            <IconLoader2 className="size-3 animate-spin" />
            {rows.length > 0 ? '正在更新' : '加载中...'}
          </Badge>
        ) : null}
        {/* <span className="flex items-center gap-1">
          <span className="font-medium tabular-nums">{rows.length}</span>
          <span>行</span>
        </span> */}
      </div>

      {/* 表格 */}
      <div className="rounded-md border mx-3 overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSelect = header.column.id === 'select'
                  const isPinnedRight = (header.column.columnDef.meta as Record<string, unknown> | undefined)?.pinned === 'right'
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'select-none',
                        enableSorting &&
                          header.column.getCanSort() &&
                          'cursor-pointer hover:bg-accent/50',
                        isSelect && 'sticky left-0 z-10 bg-background after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border',
                        isPinnedRight && 'sticky right-0 z-10 bg-background after:absolute after:left-0 after:top-0 after:h-full after:w-px after:bg-border',
                      )}
                      onClick={
                        enableSorting && header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {enableSorting && header.column.getCanSort()
                          ? header.column.getIsSorted() === 'asc'
                            ? (
                              <IconArrowUp className="size-3.5 shrink-0" />
                            )
                            : header.column.getIsSorted() === 'desc'
                            ? (
                              <IconArrowDown className="size-3.5 shrink-0" />
                            )
                            : (
                              <IconArrowsSort className="size-3.5 shrink-0 text-muted-foreground/60" />
                            )
                          : null}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showInitialLoading
              ? (
                <TableRow>
                  <TableCell
                    colSpan={totalColumns}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <IconLoader2 className="size-4 animate-spin" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              )
              : rows.length
              ? rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isSelectCell = cell.column.id === 'select'
                    const isPinnedRightCell = (cell.column.columnDef.meta as Record<string, unknown> | undefined)?.pinned === 'right'
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          isSelectCell && 'sticky left-0 z-10 bg-background after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border',
                          isPinnedRightCell && 'sticky right-0 z-10 bg-background after:absolute after:left-0 after:top-0 after:h-full after:w-px after:bg-border',
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
              : (
                <TableRow>
                  <TableCell
                    colSpan={totalColumns}
                    className="h-40 text-center text-muted-foreground"
                  >
                    {emptyText ?? '暂无数据'}
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>

      {pagination
        ? (
          <DataTablePaginationInner
            pagination={pagination}
            loading={loading}
            dataLength={data.length}
            selectedCount={enableRowSelection ? selectedRows.length : undefined}
          />
        )
        : null}
    </div>
  )
}
