import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export const DATA_TABLE_MAX_PAGE_SIZE = 2000
export const DATA_TABLE_VIRTUAL_THRESHOLD = 1000

export type DataTableLoadingMode = 'text' | 'skeleton'
export type DataTableLayout = 'auto' | 'fill'

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
  extraActions?: DataTableToolbarAction<TData>[]
  onCreate?: () => void
  onRefresh?: () => void
  onBatchDelete?: (rows: TData[]) => void
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  loadingMode?: DataTableLoadingMode
  skeletonRows?: number
  emptyText?: string
  storageKey?: string
  pageSizeOptions?: number[]
  columnWidth?: DataTableColumnWidth
  enableRowSelection?: boolean
  enableSorting?: boolean
  enableColumnPinning?: boolean
  getRowId?: (row: TData, index: number) => string
  toolbar?: DataTableToolbar<TData>
  pagination?: DataTablePagination
  virtualThreshold?: number
  estimateRowHeight?: number
  layout?: DataTableLayout
  className?: string
  tableContainerClassName?: string
}

function getColumnLabel<TData, TValue>(column: ColumnDef<TData, TValue>) {
  if (typeof column.header === 'string') return column.header
  if (column.meta && typeof column.meta === 'object' && 'label' in column.meta) {
    const label = column.meta.label
    if (typeof label === 'string') return label
  }
  if ('accessorKey' in column && typeof column.accessorKey === 'string') return column.accessorKey
  return undefined
}

interface TablePersistedState {
  columnVisibility: VisibilityState
  sorting: SortingState
  columnPinning: ColumnPinningState
}

function loadTableState(storageKey?: string): TablePersistedState {
  const empty = { columnVisibility: {}, sorting: [], columnPinning: {} }
  if (!storageKey || typeof window === 'undefined') return empty
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TablePersistedState>
      return {
        columnVisibility: parsed.columnVisibility ?? {},
        sorting: parsed.sorting ?? [],
        columnPinning: parsed.columnPinning ?? {},
      }
    }
  } catch { /* ignore */ }
  return empty
}

function saveTableState(storageKey: string, state: TablePersistedState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  } catch { /* ignore */ }
}

function normalizePageSizeOptions(options?: number[]) {
  const values = options ?? [10, 20, 50, 100, 200, 500, 1000, 2000]
  return Array.from(new Set(values.map((size) => Math.min(size, DATA_TABLE_MAX_PAGE_SIZE))))
    .filter((size) => size > 0)
    .sort((a, b) => a - b)
}

/** Return sticky CSS class based on pin position */
function getPinnedClass(position: false | 'left' | 'right'): string {
  if (position === 'left') return 'sticky left-0 z-[2] bg-background shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]'
  if (position === 'right') return 'sticky right-0 z-[2] bg-background shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.08)]'
  return ''
}

export interface DataTableColumnWidth {
  minWidth?: number
  maxWidth?: number
  wrap?: boolean
}

const DEFAULT_COL_MIN_WIDTH = 60
const DEFAULT_COL_MAX_WIDTH = 500

function getColumnWidthStyle(width: DataTableColumnWidth) {
  const minWidth = width.minWidth ?? DEFAULT_COL_MIN_WIDTH
  const maxWidth = width.maxWidth ?? DEFAULT_COL_MAX_WIDTH
  return {
    minWidth: `${minWidth}px`,
    maxWidth: `${maxWidth}px`,
  }
}

function CellContent({ children, wrap, className }: { children: ReactNode; wrap?: boolean; className?: string }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
    }
  }, [children])

  if (wrap) {
    return <div className="whitespace-normal break-words min-w-0">{children}</div>
  }

  return (
    <Tooltip open={isTruncated ? undefined : false}>
      <TooltipTrigger asChild>
        <div ref={contentRef} className={cn('truncate min-w-0', className)}>{children}</div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="max-w-md break-words">
        {children}
      </TooltipContent>
    </Tooltip>
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  loadingMode = 'text',
  skeletonRows = 5,
  emptyText,
  storageKey,
  pageSizeOptions: propPageSizeOptions,
  columnWidth: columnWidthProp = {},
  enableRowSelection,
  enableSorting = true,
  getRowId,
  toolbar,
  pagination,
  virtualThreshold = DATA_TABLE_VIRTUAL_THRESHOLD,
  estimateRowHeight = 44,
  layout = 'fill',
  className,
  tableContainerClassName,
}: DataTableProps<TData, TValue>) {

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const saved = loadTableState(storageKey).columnVisibility
    // Drop saved visibility entries for columns that no longer exist,
    // otherwise TanStack Table throws "Column with id 'xxx' does not exist".
    const validIds = new Set<string>()
    for (const col of columns) {
      const id = (col as { id?: string }).id
        ?? (col as { accessorKey?: string }).accessorKey
      if (id) validIds.add(id)
    }
    const filtered: VisibilityState = {}
    for (const [id, visible] of Object.entries(saved)) {
      if (validIds.has(id)) filtered[id] = visible
    }
    return filtered
  })
  const [sorting, setSorting] = useState<SortingState>(() =>
    loadTableState(storageKey).sorting
  )
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() => {
    const saved = loadTableState(storageKey).columnPinning
    const validIds = new Set<string>()
    for (const col of columns) {
      const id = (col as { id?: string }).id
        ?? (col as { accessorKey?: string }).accessorKey
      if (id) validIds.add(id)
    }
    const filterPins = (ids: string[] | undefined) =>
      (ids ?? []).filter((id) => validIds.has(id))
    const next: ColumnPinningState = {
      left: filterPins(saved.left),
      right: filterPins(saved.right),
    }
    if (enableRowSelection) {
      const left = next.left ?? []
      if (!left.includes('select')) {
        next.left = ['select', ...left]
      }
    }
    return next
  })

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    saveTableState(storageKey, { columnVisibility, sorting, columnPinning })
  }, [columnVisibility, sorting, columnPinning, storageKey])

  useEffect(() => {
    setRowSelection({})
  }, [data])

  const tableColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return columns
    return [
      {
        id: 'select',
        enableHiding: false,
        enableSorting: false,
        enablePinning: false,
        size: 24,
        minSize: 24,
        maxSize: 24,
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label={'全选当前页'}
            checked={table.getIsAllPageRowsSelected()}
            onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
            className="size-4 rounded border-input"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={'选择当前行'}
            checked={row.getIsSelected()}
            onChange={(event) => row.toggleSelected(event.target.checked)}
            className="size-4 rounded border-input"
          />
        ),
      } as ColumnDef<TData, TValue>,
      ...columns,
    ]
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
      sorting,
      columnPinning,
    },
    enableRowSelection,
    enableSorting,
    getRowId,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rows = table.getRowModel().rows
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
  const pageSizeOptions = normalizePageSizeOptions(propPageSizeOptions ?? pagination?.pageSizeOptions)
  const needCount = pagination?.needCount ?? true
  const total = pagination?.total ?? 0
  const totalPages = pagination && needCount
    ? Math.max(1, Math.ceil(total / pagination.pageSize))
    : undefined
  const canPrevious = pagination ? pagination.page > 1 : false
  const canNext = pagination
    ? needCount
      ? pagination.page < (totalPages ?? 1)
      : data.length >= pagination.pageSize
    : false
  const virtualizationEnabled = rows.length > virtualThreshold
  const showInitialLoading = loading && rows.length === 0
  const showUpdating = loading && rows.length > 0
  const showSkeleton = showInitialLoading && loadingMode === 'skeleton'

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 12,
    enabled: virtualizationEnabled,
  })
  const virtualRows = virtualizationEnabled ? rowVirtualizer.getVirtualItems() : []

  const visibleColumns = table.getVisibleLeafColumns()
  const visibleColumnCount = visibleColumns.length
  const isFillLayout = layout === 'fill'

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <TooltipProvider>
      <div className="shrink-0 flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-3">
        <div className="relative w-full md:max-w-sm">
          <IconSearch className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={toolbar?.searchPlaceholder ?? '搜索...'}
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {toolbar?.onRefresh ? (
            <Button variant="outline" size="sm" onClick={toolbar.onRefresh} disabled={loading}>
              {loading ? <IconLoader2 className="size-4 animate-spin" /> : <IconRefresh className="size-4" />}
              {toolbar.refreshLabel ?? '刷新'}
            </Button>
          ) : null}

          {toolbar?.onCreate ? (
            <Button size="sm" onClick={toolbar.onCreate}>
              <IconPlus className="size-4" />
              {toolbar.createLabel ?? '创建'}
            </Button>
          ) : null}

          {toolbar?.onBatchDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => toolbar.onBatchDelete?.(selectedRows)}
              disabled={!selectedRows.length || loading}
            >
              <IconTrash className="size-4" />
              {toolbar.deleteLabel ?? '批量删除'}
              {selectedRows.length ? ` (${selectedRows.length})` : ''}
            </Button>
          ) : null}

          {toolbar?.extraActions?.map((action) => (
            <Button
              key={action.label}
              variant={action.variant ?? 'outline'}
              size="sm"
              onClick={() => action.onClick(selectedRows)}
              disabled={!selectedRows.length || loading}
            >
              {action.icon}
              {action.label}
              {selectedRows.length ? ` (${selectedRows.length})` : ''}
            </Button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconSettings className="size-4" />
                {'显示列'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuLabel>{'表格列'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const label = getColumnLabel(column.columnDef) ?? column.id
                  const pinned = column.getIsPinned()
                  return (
                    <DropdownMenuItem
                      key={column.id}
                      className="group flex items-center gap-0 pr-0 cursor-default"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span
                        className="flex flex-1 cursor-pointer items-center gap-2 py-1.5 pl-2"
                        onClick={() => column.toggleVisibility()}
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          readOnly
                          className="size-4 shrink-0 rounded border-input accent-primary pointer-events-none"
                        />
                        <span className="truncate text-sm">{label}</span>
                      </span>
                      <span className="flex h-full shrink-0 items-stretch">
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            column.pin(pinned === 'left' ? false : 'left')
                          }}
                          className={cn(
                            'flex items-center justify-center px-1.5 text-muted-foreground hover:bg-accent',
                            pinned === 'left' && 'bg-accent text-foreground'
                          )}
                          title={'固定左侧'}
                        >
                          <IconChevronLeft className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            column.pin(pinned === 'right' ? false : 'right')
                          }}
                          className={cn(
                            'flex items-center justify-center px-1.5 text-muted-foreground hover:bg-accent',
                            pinned === 'right' && 'bg-accent text-foreground'
                          )}
                          title={'固定右侧'}
                        >
                          <IconChevronRight className="size-3.5" />
                        </button>
                      </span>
                    </DropdownMenuItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-3 shrink-0 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <Badge variant={virtualizationEnabled ? 'default' : 'outline'}>
          {virtualizationEnabled
            ? '虚拟滚动：已启用'
            : '虚拟滚动：未启用'}
        </Badge>
        {loading ? (
          <Badge variant="secondary" className="gap-1">
            <IconLoader2 className="size-3 animate-spin" />
            {showUpdating ? '正在更新' : '加载中...'}
          </Badge>
        ) : null}
        <span>{`当前 ${rows.length} 行`}</span>
      </div>

      <div
        ref={tableContainerRef}
        className={cn(
          'rounded-md border mx-3',
          isFillLayout ? 'overflow-auto' : 'overflow-auto max-h-[640px]',
          tableContainerClassName
        )}
      >
        <Table>
          <TableHeader className={virtualizationEnabled || isFillLayout ? 'sticky top-0 z-10 bg-background' : undefined}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const pinnedPos = header.column.getIsPinned()
                  const isPinned = pinnedPos !== false
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'relative select-none',
                        getPinnedClass(pinnedPos),
                        enableSorting && header.column.getCanSort() && 'cursor-pointer hover:bg-accent/50'
                      )}
                      style={{
                        width: header.getSize() || undefined,
                        ...(header.column.id !== 'select' ? getColumnWidthStyle(columnWidthProp) : {}),
                        ...(isPinned
                          ? { [pinnedPos === 'left' ? 'left' : 'right']: `${header.getStart(pinnedPos)}px` }
                          : {}),
                      }}
                      onClick={
                        enableSorting && header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        {header.isPlaceholder
                          ? null
                          : (
                            <CellContent className="truncate">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </CellContent>
                          )}
                        {enableSorting && header.column.getCanSort() ? (
                          header.column.getIsSorted() === 'asc' ? (
                            <IconArrowUp className="size-3.5 shrink-0 text-foreground" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <IconArrowDown className="size-3.5 shrink-0 text-foreground" />
                          ) : (
                            <IconArrowsSort className="size-3.5 shrink-0 text-muted-foreground/60" />
                          )
                        ) : null}
                      </div>
                      {/* Column resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                        />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            style={virtualizationEnabled ? {
              display: 'grid',
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            } : undefined}
          >
            {showSkeleton ? (
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} style={getColumnWidthStyle(columnWidthProp)}>
                      <Skeleton className={cn('h-8', column.id === 'select' ? 'w-12' : 'w-full')} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : showInitialLoading ? (
              <TableRow>
                <TableCell colSpan={visibleColumnCount || tableColumns.length} className="h-40 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <IconLoader2 className="size-4 animate-spin" />
                    {'加载中...'}
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              virtualizationEnabled ? (
                virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <TableRow
                      key={row.id}
                      data-index={virtualRow.index}
                      data-state={row.getIsSelected() && 'selected'}
                      ref={(node) => rowVirtualizer.measureElement(node)}
                      style={{
                        display: 'flex',
                        position: 'absolute',
                        transform: `translateY(${virtualRow.start}px)`,
                        width: '100%',
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const pinnedPos = cell.column.getIsPinned()
                        const isPinned = pinnedPos !== false
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(getPinnedClass(pinnedPos))}
                            style={{
                              display: 'flex',
                              flex: isPinned ? undefined : 1,
                              width: cell.column.getSize() || undefined,
                              ...(cell.column.id !== 'select' ? getColumnWidthStyle(columnWidthProp) : {}),
                              ...(isPinned
                                ? { [pinnedPos === 'left' ? 'left' : 'right']: `${cell.column.getStart(pinnedPos)}px` }
                                : {}),
                            }}
                          >
                            <CellContent wrap={columnWidthProp.wrap}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </CellContent>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => {
                      const pinnedPos = cell.column.getIsPinned()
                      const isPinned = pinnedPos !== false
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(getPinnedClass(pinnedPos))}
                          style={{
                            width: cell.column.getSize() || undefined,
                            ...(cell.column.id !== 'select' ? getColumnWidthStyle(columnWidthProp) : {}),
                            ...(isPinned
                              ? { [pinnedPos === 'left' ? 'left' : 'right']: `${cell.column.getStart(pinnedPos)}px` }
                              : {}),
                          }}
                        >
                          <CellContent wrap={columnWidthProp.wrap}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </CellContent>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              )
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumnCount || tableColumns.length} className="h-40 text-center text-muted-foreground">
                  {emptyText ?? '暂无数据'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination ? (
        <div className="shrink-0 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between px-3">
          <div className="flex flex-wrap items-center gap-3">
            {needCount ? (
              <span>{`共 ${total} 条`}</span>
            ) : (
              <span>{'未统计总数'}</span>
            )}
            {enableRowSelection ? (
              <span>{`已选 ${selectedRows.length} 条`}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span>{'每页'}</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
              disabled={loading}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="min-w-24 text-center">
              {needCount && totalPages
                ? `第 ${pagination.page} / ${totalPages} 页`
                : `第 ${pagination.page} 页`}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={!canPrevious || loading}
            >
              <IconChevronLeft className="size-4" />
              {'上一页'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={!canNext || loading}
            >
              {'下一页'}
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
      </TooltipProvider>
    </div>
  )
}
