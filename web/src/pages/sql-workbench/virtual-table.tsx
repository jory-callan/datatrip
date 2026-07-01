import { useRef, useEffect, useState, useCallback } from 'react'

import { ListTable } from '@visactor/vtable'
import { exportVTableToCsv, downloadCsv, exportVTableToExcel, downloadExcel } from '@visactor/vtable-export'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Search, X } from 'lucide-react'
import type { ResultTab } from './types'

// ─── Types ────────────────────────────────────────────

interface Props {
  tab: ResultTab | null
}

// ─── Theme builders ───────────────────────────────────

function buildTheme(isDark: boolean) {
  const headerBg = isDark ? '#1e293b' : '#f8fafc'
  const headerColor = isDark ? '#e2e8f0' : '#334155'
  const bodyBg = isDark ? '#0f172a' : '#ffffff'
  const bodyColor = isDark ? '#cbd5e1' : '#334155'
  const borderColor = isDark ? '#334155' : '#e2e8f0'
  const hoverBg = isDark ? '#1e293b' : '#f1f5f9'
  const selectionBg = isDark ? 'rgba(96,165,250,0.15)' : 'rgba(59,130,246,0.10)'
  const scrollbarColor = isDark ? '#475569' : '#cbd5e1'

  return {
    headerStyle: {
      bgColor: headerBg,
      color: headerColor,
      borderColor,
      textAlign: 'left' as const,
      fontWeight: '600' as const,
      fontSize: 13,
      padding: [8, 12] as [number, number],
    },
    bodyStyle: {
      bgColor: bodyBg,
      color: bodyColor,
      borderColor,
      textAlign: 'left' as const,
      fontSize: 13,
      padding: [6, 12] as [number, number],
    },
    frameStyle: {
      borderColor,
      borderLineWidth: 1,
    },
    hoverStyle: {
      cellBgColor: hoverBg,
    },
    selectionStyle: {
      cellBgColor: selectionBg,
      cellBorderColor: 'transparent',
    },
    rowSeriesNumberStyle: {
      bgColor: headerBg,
      color: isDark ? '#64748b' : '#94a3b8',
      borderColor,
      fontSize: 11,
      textAlign: 'center' as const,
      padding: [4, 4] as [number, number],
    },
    scrollStyle: {
      scrollSliderColor: scrollbarColor,
      width: 10,
      height: 10,
    },
  }
}

// ─── Main Component ──────────────────────────────────

export function VirtualResultTable({ tab }: Props) {

  const containerRef = useRef<HTMLDivElement>(null)
  const tableInstance = useRef<ListTable | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // ── Search/filter state ───────────────────────────

  const [filterInput, setFilterInput] = useState('')
  const [deferredFilter, setDeferredFilter] = useState('')
  const filterTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const isComposingRef = useRef(false)

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterInput(e.target.value)
  }, [])

  // Debounce: update deferredFilter after 2s of no typing
  useEffect(() => {
    if (isComposingRef.current) return
    if (filterTimerRef.current) clearTimeout(filterTimerRef.current)
    filterTimerRef.current = setTimeout(() => {
      setDeferredFilter(filterInput)
    }, 2000)
    return () => {
      if (filterTimerRef.current) clearTimeout(filterTimerRef.current)
    }
  }, [filterInput])

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
  }, [])

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false
    // Fire debounce immediately when IME composition ends
    if (filterTimerRef.current) clearTimeout(filterTimerRef.current)
    filterTimerRef.current = setTimeout(() => {
      setDeferredFilter(filterInput)
    }, 2000)
  }, [filterInput])

  const clearFilter = useCallback(() => {
    setFilterInput('')
    setDeferredFilter('')
  }, [])

  // Apply filter to VTable via filterRules
  useEffect(() => {
    const table = tableInstance.current
    if (!table) return

    const q = deferredFilter.trim()
    if (!q) {
      // Clear all filter rules
      table.updateFilterRules([], { clearRowHeightCache: true })
      return
    }

    const lowerQ = q.toLowerCase()
    table.updateFilterRules(
      [
        {
          filterFunc: (row: Record<string, any>) => {
            return Object.values(row).some((v) => {
              if (v === null || v === undefined) return false
              return String(v).toLowerCase().includes(lowerQ)
            })
          },
        },
      ],
      { clearRowHeightCache: true },
    )
  }, [deferredFilter])

  // ── Watch for dark mode ──────────────────────────

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // ── Build VTable instance ─────────────────────────

  useEffect(() => {
    const container = containerRef.current
    if (!container || !tab?.columns || !tab?.rows || tab.rows.length === 0) {
      if (tableInstance.current) {
        tableInstance.current.release()
        tableInstance.current = null
      }
      return
    }

    const cols = tab.columns

    const vcolumns = cols.map((col) => ({
      field: col.name,
      title: col.name,
      width: 120,
      minWidth: 60,
      maxWidth: 600,
      sort: true as const,
    }))

    const records = tab.rows ?? []

    if (tableInstance.current) {
      tableInstance.current.release()
      tableInstance.current = null
    }

    const theme = buildTheme(isDark)
    container.innerHTML = ''

    const table = new ListTable(container, {
      columns: vcolumns,
      records,
      widthMode: 'standard',
      autoFillWidth: true,
      defaultRowHeight: 34,
      columnResizeMode: 'all',
      dragHeaderMode: 'column',
      showHeader: true,
      theme,
      rowSeriesNumber: {
        width: 'auto',
        title: '#',
      },
      // Enable keyboard copy and selection
      keyboardOptions: {
        copySelected: true,
        selectAllOnCtrlA: true,
        moveSelectedCellOnArrowKeys: true,
        ctrlMultiSelect: true,
        shiftMultiSelect: true,
      },
    })

    tableInstance.current = table

    return () => {
      table.release()
      tableInstance.current = null
    }
  }, [tab, isDark])

  // Re-apply filter when VTable is recreated (tab change)
  useEffect(() => {
    if (deferredFilter) {
      // Will be triggered by the deferredFilter useEffect above
      // This ensures filter is re-applied after VTable rebuild
    }
  }, [tableInstance.current])

  // Handle filter re-apply after table recreation
  const prevTableRef = useRef<ListTable | null>(null)
  useEffect(() => {
    const currentTable = tableInstance.current
    if (currentTable && currentTable !== prevTableRef.current) {
      prevTableRef.current = currentTable
      // Re-apply filter on new table instance
      if (deferredFilter.trim()) {
        const lowerQ = deferredFilter.trim().toLowerCase()
        currentTable.updateFilterRules(
          [
            {
              filterFunc: (row: Record<string, any>) => {
                return Object.values(row).some((v) => {
                  if (v === null || v === undefined) return false
                  return String(v).toLowerCase().includes(lowerQ)
                })
              },
            },
          ],
          { clearRowHeightCache: true },
        )
      }
    }
  }, [tableInstance.current, deferredFilter])

  // ── Resize observer for container ─────────────────

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      tableInstance.current?.resize()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // ── Export handlers ────────────────────────────────

  const handleExportCsv = useCallback(() => {
    const t = tableInstance.current
    if (!t) return
    setIsExporting(true)
    try {
      const csvStr = exportVTableToCsv(t, { exportAllData: true })
      downloadCsv(csvStr, 'query-result.csv')
    } finally {
      setIsExporting(false)
    }
  }, [])

  const handleExportExcel = useCallback(async () => {
    const t = tableInstance.current
    if (!t) return
    setIsExporting(true)
    try {
      const buffer = await exportVTableToExcel(t, { exportAllData: true })
      downloadExcel(buffer, 'query-result.xlsx')
    } catch {
      // fallback to CSV on Excel export failure
      try {
        const csvStr = exportVTableToCsv(t, { exportAllData: true })
        downloadCsv(csvStr, 'query-result.csv')
      } catch { /* silent */ }
    } finally {
      setIsExporting(false)
    }
  }, [])

  // ── Empty / Error / DML states (no VTable) ─────────

  // Error state
  if (tab?.error) {
    return (
      <div className="flex items-start justify-center h-full p-6 text-sm">
        <div className="max-w-xl">
          <p className="font-medium text-red-600 dark:text-red-400 mb-1">{'执行出错'}</p>
          <pre className="whitespace-pre-wrap font-mono text-xs text-red-500/80 dark:text-red-400/80 bg-red-50 dark:bg-red-950/30 rounded p-3 border border-red-200 dark:border-red-900">
            {tab.error}
          </pre>
          {tab.durationMs != null && (
            <p className="mt-2 text-xs text-muted-foreground">{'耗时'}: {tab.durationMs}ms</p>
          )}
        </div>
      </div>
    )
  }

  // DML result (no columns, has affectedRows)
  if (tab && tab.affectedRows != null && !tab.columns) {
    return (
      <div className="flex items-start justify-center h-full p-6 text-sm">
        <div className="text-center">
          <p className="text-base font-medium text-emerald-600 dark:text-emerald-400 mb-2">{'执行成功'}</p>
          <p className="text-muted-foreground">
            {'影响行数'}: <span className="font-semibold text-foreground">{tab.affectedRows}</span>
          </p>
          {tab.rowCount != null && (
            <p className="text-muted-foreground">
              {'返回行数'}: <span className="font-semibold text-foreground">{tab.rowCount}</span>
            </p>
          )}
          {tab.durationMs != null && (
            <p className="mt-2 text-xs text-muted-foreground">{'耗时'}: {tab.durationMs}ms</p>
          )}
        </div>
      </div>
    )
  }

  // No data / empty
  if (!tab?.columns || !tab?.rows || tab.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        {tab?.rows && tab.rows.length === 0
          ? '查询未返回数据'
          : '执行 SQL 后查看结果'}
      </div>
    )
  }

  // ── Normal query result with VTable ────────────────

  const rowCount = tab.rowCount ?? tab.rows.length

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0 px-3 py-1 border-b bg-muted/30">
        {/* Filter input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            value={filterInput}
            onChange={handleFilterChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={'搜索… (2s 防抖)'}
            className="w-full h-7 pl-7 pr-7 rounded border bg-background text-xs outline-none focus:border-primary transition-colors"
          />
          {filterInput && (
            <button
              type="button"
              onClick={clearFilter}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded hover:bg-accent text-muted-foreground/60"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" disabled={isExporting}>
                <Download className="h-3.5 w-3.5" />
                {'导出'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-32">
              <DropdownMenuItem onClick={handleExportCsv} className="text-xs gap-2" disabled={isExporting}>
                {'导出 CSV'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} className="text-xs gap-2" disabled={isExporting}>
                {'导出 Excel'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
          <span>{rowCount.toLocaleString()} {'行'}</span>
          <span>{tab.columns.length} {'列'}</span>
          {tab.durationMs != null && <span>{tab.durationMs}ms</span>}
        </div>
      </div>

      {/* VTable Container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0"
        style={{ position: 'relative', overflow: 'hidden' }}
      />
    </div>
  )
}
