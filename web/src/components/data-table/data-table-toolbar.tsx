import { useEffect, useRef } from 'react'
import { IconChevronDown, IconLoader2, IconPlus, IconRefresh, IconSearch, IconTrash } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { DataTableToolbar } from './types'

interface DataTableToolbarProps<TData> {
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  loading: boolean
  selectedRows: TData[]
  config: DataTableToolbar<TData>
  /** 当前自动刷新间隔（秒），0 表示关闭 */
  refreshInterval: number
  /** 修改自动刷新间隔 */
  onRefreshIntervalChange: (interval: number) => void
}

const INTERVAL_LABELS: Record<number, string> = {
  0: '关闭',
  5: '5s',
  10: '10s',
  15: '15s',
  30: '30s',
  60: '60s',
}

export function DataTableToolbarInner<TData>({
  globalFilter,
  onGlobalFilterChange,
  loading,
  selectedRows,
  config,
  refreshInterval,
  onRefreshIntervalChange,
}: DataTableToolbarProps<TData>) {
  // 显示自动刷新状态提示
  const showAutoRefresh = refreshInterval > 0

  return (
    <div className="shrink-0 flex flex-col gap-3 px-3">
      {/* 上排：按钮行 — 左到右，移动端自动换行 */}
      <div className="flex flex-wrap items-center gap-2">
        {config.onRefresh ? (
          <div className="flex items-center -space-x-px">
            <Button
              variant="outline"
              size="sm"
              className="rounded-r-none h-8"
              disabled={loading}
              onClick={config.onRefresh}
            >
              {loading ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconRefresh className="size-4" />
              )}
              {config.refreshLabel ?? '刷新'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-none h-8 px-1.5 border-l-0"
                  disabled={loading}
                >
                  {showAutoRefresh ? (
                    <span className="text-xs mr-1">{INTERVAL_LABELS[refreshInterval] ?? `${refreshInterval}s`}</span>
                  ) : null}
                  <IconChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">自动刷新间隔</div>
                {getIntervalOptions(config.refreshIntervalOptions).map((sec) => (
                  <DropdownMenuItem
                    key={sec}
                    className={cn('gap-2', sec === refreshInterval && 'bg-accent font-medium')}
                    onClick={() => onRefreshIntervalChange(sec === refreshInterval ? 0 : sec)}
                  >
                    <span className="size-4 inline-flex items-center justify-center">
                      {sec === refreshInterval ? '✓' : ''}
                    </span>
                    {INTERVAL_LABELS[sec] ?? `每 ${sec} 秒`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        {config.onCreate ? (
          <Button size="sm" onClick={config.onCreate}>
            <IconPlus className="size-4" />
            {config.createLabel ?? '创建'}
          </Button>
        ) : null}

        {config.onBatchDelete ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => config.onBatchDelete?.(selectedRows)}
            disabled={!selectedRows.length || loading}
          >
            <IconTrash className="size-4" />
            {config.deleteLabel ?? '批量删除'}
            {selectedRows.length ? ` (${selectedRows.length})` : ''}
          </Button>
        ) : null}

        {config.extraActions?.map((action) => (
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
      </div>

      {/* 搜索框 */}
      {config.searchPlaceholder ? (
        <div className="relative w-full md:max-w-sm">
          <IconSearch className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => onGlobalFilterChange(event.target.value)}
            placeholder={config.searchPlaceholder}
            className="pl-8"
          />
        </div>
      ) : null}
    </div>
  )
}

function getIntervalOptions(options?: number[]): number[] {
  const defaults = [0, 5, 10, 15, 30, 60]
  if (!options || options.length === 0) return defaults
  return Array.from(new Set([0, ...options]))
    .sort((a, b) => a - b)
}
