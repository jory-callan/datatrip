import { useCallback, useMemo, useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DataTablePagination } from './types'

const DATA_TABLE_MAX_PAGE_SIZE = 2000

interface DataTablePaginationProps {
  pagination: DataTablePagination
  loading?: boolean
  dataLength: number
  selectedCount?: number
}

function normalizePageSizeOptions(options?: number[]) {
  const values = options ?? [10, 20, 50, 100, 200, 500, 1000, 2000]
  return Array.from(new Set(values.map((size) => Math.min(size, DATA_TABLE_MAX_PAGE_SIZE))))
    .filter((size) => size > 0)
    .sort((a, b) => a - b)
}

/** 生成页码列表：第一页 + 当前页窗口 + 最后一页，间隙用 'ellipsis' 占位 */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)
  return pages
}

export function DataTablePaginationInner({
  pagination,
  loading,
  dataLength,
  selectedCount,
}: DataTablePaginationProps) {
  const {
    page,
    pageSize,
    total,
    needCount = true,
    pageSizeOptions,
    onPageChange,
    onPageSizeChange,
  } = pagination

  const [jumpValue, setJumpValue] = useState('')

  const normalizedOptions = normalizePageSizeOptions(pageSizeOptions)
  const totalPages = needCount ? Math.max(1, Math.ceil((total ?? 0) / pageSize)) : undefined
  const canPrevious = page > 1
  const canNext = needCount
    ? page < (totalPages ?? 1)
    : dataLength >= pageSize

  const handleJump = useCallback(() => {
    const target = parseInt(jumpValue, 10)
    if (isNaN(target)) return
    const clamped = Math.max(1, Math.min(target, totalPages ?? 1))
    onPageChange(clamped)
    setJumpValue('')
  }, [jumpValue, totalPages, onPageChange])

  const pageNumbers = useMemo(
    () => (totalPages ? getPageNumbers(page, totalPages) : []),
    [page, totalPages],
  )

  const showPageButtons = needCount && totalPages && totalPages > 1

  return (
    <div className="shrink-0 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between px-3">
      {/* Left: total + selected */}
      <div className="flex flex-wrap items-center gap-3">
        {needCount ? (
          <span>{`共 ${total ?? 0} 条`}</span>
        ) : (
          <span>未统计总数</span>
        )}
        {selectedCount != null && selectedCount > 0 ? (
          <span>{`已选 ${selectedCount} 条`}</span>
        ) : null}
      </div>

      {/* Right: pagination controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Page size */}
        <span>每页</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={loading}
        >
          <SelectTrigger className="w-20 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {normalizedOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Page info */}
        <span className="min-w-20 text-center">
          {needCount && totalPages
            ? `${page}/${totalPages}`
            : `第${page}页`}
        </span>

        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrevious || loading}
        >
          <IconChevronLeft className="size-4" />
        </Button>

        {/* Page number buttons (hidden on small screens) */}
        {showPageButtons ? (
          <div className="hidden sm:flex items-center gap-1">
            {pageNumbers.map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e-${i}`} className="px-1 text-xs select-none">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'min-w-8 h-8 p-0 text-xs',
                    p === page && 'pointer-events-none',
                  )}
                  onClick={() => onPageChange(p)}
                  disabled={loading}
                >
                  {p}
                </Button>
              ),
            )}
          </div>
        ) : null}

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext || loading}
        >
          <IconChevronRight className="size-4" />
        </Button>

        {/* Jump input (hidden on small screens) */}
        {showPageButtons ? (
          <div className="hidden sm:flex items-center gap-1 ml-2">
            <span className="text-xs text-muted-foreground">跳至</span>
            <Input
              className="w-14 h-8 text-xs text-center"
              placeholder=""
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJump()
              }}
              onBlur={handleJump}
              disabled={loading}
            />
            <span className="text-xs text-muted-foreground">页</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
