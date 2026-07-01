import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { keepPreviousData, useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { format } from 'sql-formatter'

import { apiClient, getApiErrorMessage } from '@/lib/api-client'
import { useProjects } from '@/lib/api/projects'
import { useExecuteSql, useExecuteEscalated, useProjectTables } from '@/lib/api/sqlexec'
import { useCreateTicket } from '@/lib/api/tickets'
import { useActiveEscalation, useCreateEscalation } from '@/lib/api/escalations'
import { useMyFavorites } from '@/lib/api/sql-favorites'
import type { ProjectDatabasesResponse } from '@/lib/api/sqlexec'

import type { EditorTab, ExecutionHistoryEntry, ResultTab, TableContextMenuState } from './types'
import { LS_KEYS, loadFromStorage, nextHistoryId, nextTabId, saveToStorage, historyIdCounter } from './utils'

export function useWorkbench() {

  const navigate = useNavigate()

  // Persisted state
  const [leftPanelTab, setLeftPanelTab] = useState(() => loadFromStorage(LS_KEYS.leftPanelTab, 'database'))
  const [storedHistory] = useState<ExecutionHistoryEntry[]>(() => loadFromStorage(LS_KEYS.executionHistory, []))
  const [storedSelectedProjectIds] = useState<number[]>(() => loadFromStorage(LS_KEYS.selectedProjects, []))

  // Editor tabs
  const initialTabId = useRef(nextTabId())
  const [tabs, setTabs] = useState<EditorTab[]>([{ id: initialTabId.current,      title: `SQL ${1}`,sql: '' }])
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  // Results
  const [resultTabs, setResultTabs] = useState<ResultTab[]>([])
  const [activeResultTabIndex, setActiveResultTabIndex] = useState(0)

  // UI state
  const [isExecuting, setIsExecuting] = useState(false)

  // Ticket dialog
  const createTicketMutation = useCreateTicket()
  const [ticketDialog, setTicketDialog] = useState<{
    open: boolean; projectId: number; projectName: string; database: string; sql: string
  }>({ open: false, projectId: 0, projectName: '', database: '', sql: '' })
  const ticketTitleRef = useRef('')
  const ticketDescRef = useRef('')

  // Escalation dialog
  const createEscalationMutation = useCreateEscalation()
  const [escalationDialog, setEscalationDialog] = useState<{
    open: boolean; projectId: number; database: string; sql: string
  }>({ open: false, projectId: 0, database: '', sql: '' })
  const escalationReasonRef = useRef('')

  // Table context menu
  const [tableContextMenu, setTableContextMenu] = useState<TableContextMenuState | null>(null)

  // Multi-project state
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>(storedSelectedProjectIds)
  const [activeDbForTables, setActiveDbForTables] = useState<{ projectId: number; database: string } | null>(null)

  // Execution history
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistoryEntry[]>(storedHistory)
  const [historyFilter, setHistoryFilter] = useState('')

  // Tab right-click context menus
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; index: number } | null>(null)
  const [resultTabContextMenu, setResultTabContextMenu] = useState<{ x: number; y: number; index: number } | null>(null)

  // Monaco editor ref
  const editorRef = useRef<Parameters<import('@monaco-editor/react').OnMount>[0] | null>(null)
  // Decorations for executed SQL highlight
  const executedDecorationsRef = useRef<string[]>([])

  // Auto-execute trigger for table preview
  const pendingAutoExecuteRef = useRef(false)

  // Column width state for resizable columns
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})

  // Panel layout persistence
  const [savedHorizontalLayout, setSavedHorizontalLayout] = useState<Record<string, number> | undefined>(
    () => loadFromStorage(LS_KEYS.horizontalLayout, undefined) as Record<string, number> | undefined,
  )
  const handleHorizontalLayoutChange = useCallback((layout: Record<string, number>) => {
    saveToStorage(LS_KEYS.horizontalLayout, layout)
  }, [])

  // Persist effects
  useEffect(() => { saveToStorage(LS_KEYS.selectedProjects, selectedProjectIds) }, [selectedProjectIds])
  useEffect(() => { saveToStorage(LS_KEYS.leftPanelTab, leftPanelTab) }, [leftPanelTab])
  useEffect(() => {
    saveToStorage(LS_KEYS.executionHistory, executionHistory)
    saveToStorage('sql-wb-history-counter', historyIdCounter)
  }, [executionHistory])

  // Data
  const { data: projectsData } = useProjects({ page: 1, pageSize: 200, needCount: false })
  const projects = projectsData?.list ?? []

  // Fetch databases for all selected projects
  const databaseQueries = useQueries({
    queries: selectedProjectIds.map((pid) => ({
      queryKey: ['project-databases', pid],
      queryFn: () => apiClient<ProjectDatabasesResponse>(`/projects/${pid}/meta/databases`),
      enabled: selectedProjectIds.length > 0,
      placeholderData: keepPreviousData,
    })),
  })

  // Fetch tables for the active (project, db) pair
  const { data: tablesData, isLoading: isLoadingTables } = useProjectTables(
    activeDbForTables?.projectId,
    activeDbForTables?.database,
  )
  const tables = tablesData?.tables ?? []

  const activeTab = tabs[activeTabIndex]

  // Escalation
  const escalatedExecuteMutation = useExecuteEscalated()
  const { data: activeEscalationData } = useActiveEscalation(activeTab?.projectId)

  // SQL Favorites
  const myFavorites = useMyFavorites()

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleExecute()
      }
      // Ctrl+Shift+F or Ctrl+S — format SQL
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        handleFormatSql()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  // Auto-execute when a new tab is created for table preview
  useEffect(() => {
    if (pendingAutoExecuteRef.current) {
      pendingAutoExecuteRef.current = false
      const timer = setTimeout(() => handleExecute(), 50)
      return () => clearTimeout(timer)
    }
  }, [tabs, activeTabIndex])

  // Get SQL text from editor
  const getEditorSql = useCallback((): string | undefined => {
    const selection = editorRef.current?.getSelection()
    const model = editorRef.current?.getModel()
    const selectedText = selection && !selection.isEmpty() && model
      ? model.getValueInRange(selection!)
      : undefined
    return selectedText?.trim() || activeTab?.sql?.trim()
  }, [activeTab])

  // Apply execution highlight to the editor
  const applyExecutionHighlight = useCallback(() => {
    const editor = editorRef.current
    const model = editor?.getModel()
    if (!editor || !model) return

    const selection = editor.getSelection()
    let range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }

    if (selection && !selection.isEmpty()) {
      range = {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn,
      }
    } else {
      const fullRange = model.getFullModelRange()
      const lineCount = model.getLineCount()
      const lastLine = model.getLineMaxColumn(lineCount)
      if (lineCount === 1 && fullRange.startColumn === lastLine) {
        return // empty document
      }
      range = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: lineCount,
        endColumn: lastLine,
      }
    }

    const newDecorations = editor.deltaDecorations(executedDecorationsRef.current, [{
      range,
      options: { className: 'sql-executed-highlight' },
    }])
    executedDecorationsRef.current = newDecorations
  }, [])

  // Execute SQL
  const executeMutation = useExecuteSql()

  const handleExecute = useCallback(async () => {
    if (!activeTab?.projectId || !activeTab?.database) return
    if (isExecuting) return
    setIsExecuting(true)

    const sqlToExecute = getEditorSql()
    if (!sqlToExecute) { setIsExecuting(false); return }
    applyExecutionHighlight()

    const projectId = activeTab.projectId
    const database = activeTab.database
    const projectName = projects.find((p) => p.id === projectId)?.name ?? `Project ${projectId}`

    try {
      const result = await executeMutation.mutateAsync({ project_id: projectId, database, sql: sqlToExecute })

      const entry: ExecutionHistoryEntry = {
        id: nextHistoryId(), sql: sqlToExecute, projectId, projectName, database, timestamp: Date.now(),
      }
      setExecutionHistory((prev) => [entry, ...prev].slice(0, 500))

      const resultTabId = Date.now()

      if (result.mode === 'direct') {
        const newResultTabs: ResultTab[] = result.results?.length
          ? result.results.map((qr, i) => ({
              id: resultTabId + i,
              title: `结果 ${resultTabs.length + i + 1}`,
              sql: sqlToExecute,
              columns: qr.columns.map((col) => ({ name: col })),
              rows: qr.rows.map((row) => {
                const obj: Record<string, unknown> = {}
                qr.columns.forEach((col, ci) => { obj[col] = row[ci] })
                return obj
              }),
              rowCount: qr.total,
              durationMs: result.execution?.duration_ms,
            }))
          : [{
              id: resultTabId,
              title: `结果 ${resultTabs.length + 1}`,
              sql: sqlToExecute,
              rowCount: result.execution?.row_count,
              affectedRows: result.execution?.affected_rows,
              durationMs: result.execution?.duration_ms,
            }]
        setResultTabs((prev) => [...prev, ...newResultTabs])
        setActiveResultTabIndex(resultTabs.length + newResultTabs.length - 1)
      } else if (result.mode === 'ticket') {
        setTicketDialog({ open: true, projectId, projectName, database, sql: sqlToExecute })
      }
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, '执行 SQL 失败')
      const errorTab: ResultTab = { id: Date.now(), title: `错误 ${resultTabs.length + 1}`, sql: sqlToExecute, error: errorMsg }
      setResultTabs((prev) => [...prev, errorTab])
      setActiveResultTabIndex(resultTabs.length)
    } finally {
      setIsExecuting(false)
    }
  }, [activeTab, isExecuting, executeMutation, projects, resultTabs.length, getEditorSql])

  // Tab management
  const addTab = useCallback((params?: { sql?: string; projectId?: number; database?: string }) => {
    const newId = nextTabId()
    const newTab: EditorTab = {
      id: newId,
      title: params?.database ? params.database : `SQL ${tabs.length + 1}`,
      sql: params?.sql ?? '',
      projectId: params?.projectId,
      database: params?.database,
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabIndex(tabs.length)
  }, [tabs.length])

  const closeTab = useCallback((tabId: number, index: number) => {
    if (tabs.length <= 1) return
    setTabs((prev) => prev.filter((t) => t.id !== tabId))
    setActiveTabIndex((_prev) => {
      if (index < _prev) return _prev - 1
      if (index > _prev) return _prev
      return Math.max(0, _prev - 1)
    })
  }, [tabs.length])

  const switchTab = useCallback((index: number) => setActiveTabIndex(index), [])
  const updateTabSql = useCallback((sql: string) => {
    setTabs((prev) => prev.map((t, i) => (i === activeTabIndex ? { ...t, sql } : t)))
  }, [activeTabIndex])

  const updateActiveTabContext = useCallback((updates: Partial<EditorTab>) => {
    setTabs((prev) => prev.map((t, i) => (i === activeTabIndex ? { ...t, ...updates } : t)))
  }, [activeTabIndex])

  // Database tree
  const handleDatabaseSelect = useCallback((projectId: number, db: string) => {
    if (activeDbForTables?.projectId === projectId && activeDbForTables?.database === db) {
      setActiveDbForTables(null)
    } else {
      setActiveDbForTables({ projectId, database: db })
    }
  }, [activeDbForTables])

  const handleDatabaseNewTab = useCallback((projectId: number, db: string) => {
    addTab({ projectId, database: db })
    if (!selectedProjectIds.includes(projectId)) {
      setSelectedProjectIds((prev) => [...prev, projectId])
    }
  }, [addTab, selectedProjectIds])

  const handleTableContextMenu = useCallback((e: React.MouseEvent, tableName: string, projectId: number, database: string) => {
    e.preventDefault()
    setTableContextMenu({ x: e.clientX, y: e.clientY, tableName, projectId, database })
  }, [])

  const handleCopySelect = useCallback((tableName: string, projectId: number, database: string) => {
    const sql = `SELECT * FROM ${tableName} LIMIT 100`
    addTab({ sql, projectId, database })
  }, [addTab])

  const handlePreviewTable = useCallback((tableName: string, projectId: number, database: string) => {
    const sql = `SELECT * FROM ${tableName} LIMIT 100`
    addTab({ sql, projectId, database })
    // Mark for auto-execution after tab switch
    pendingAutoExecuteRef.current = true
  }, [addTab])

  // Format SQL in the active editor
  const handleFormatSql = useCallback(() => {
    const sql = activeTab?.sql
    if (!sql?.trim()) return
    try {
      const formatted = format(sql, { language: 'sql', tabWidth: 2 })
      updateTabSql(formatted)
      toast.success('SQL 格式化成功')
    } catch {
      toast.error('SQL 格式化失败')
    }
  }, [activeTab, updateTabSql])

  // Favorite click: open SQL in a new tab
  const handleFavoriteClick = useCallback((fav: { sql: string; project_id: number; database: string }) => {
    addTab({ sql: fav.sql, projectId: fav.project_id, database: fav.database })
  }, [addTab])

  // Tab right-click handlers
  const closeTabByIndex = useCallback((index: number) => {
    if (tabs.length <= 1) return
    setTabs((prev) => prev.filter((_, i) => i !== index))
    setActiveTabIndex((prev) => {
      if (index < prev) return prev - 1
      if (index > prev) return prev
      return Math.max(0, prev - 1)
    })
  }, [tabs.length])

  const closeOtherTabs = useCallback((keepIndex: number) => {
    setTabs((prev) => [prev[keepIndex]])
    setActiveTabIndex(0)
  }, [])

  const closeAllTabs = useCallback(() => {
    const newId = nextTabId()
    setTabs([{ id: newId,      title: `SQL ${1}`,sql: '' }])
    setActiveTabIndex(0)
  }, [])

  // Result tab close handlers
  const closeResultTabByIndex = useCallback((index: number) => {
    setResultTabs((prev) => prev.filter((_, i) => i !== index))
    setActiveResultTabIndex((prev) => {
      if (index < prev) return prev - 1
      if (index > prev) return prev
      return Math.max(0, prev - 1)
    })
  }, [])

  const closeOtherResultTabs = useCallback((keepIndex: number) => {
    setResultTabs((prev) => [prev[keepIndex]])
    setActiveResultTabIndex(0)
  }, [])

  const closeAllResultTabs = useCallback(() => {
    setResultTabs([])
    setActiveResultTabIndex(0)
  }, [])

  // Ticket handler
  const handleTicket = useCallback(() => {
    if (!activeTab?.projectId || !activeTab?.database) return
    const sqlToExecute = getEditorSql()
    if (!sqlToExecute) return
    const projectName = projects.find((p) => p.id === activeTab.projectId)?.name ?? `Project ${activeTab.projectId}`
    setTicketDialog({ open: true, projectId: activeTab.projectId, projectName, database: activeTab.database, sql: sqlToExecute })
  }, [activeTab, projects, getEditorSql])

  const handleSubmitTicket = useCallback(async () => {
    const title = ticketTitleRef.current.trim()
    if (!title) { toast.error('请填写工单标题'); return }
    try {
      await createTicketMutation.mutateAsync({
        project_id: ticketDialog.projectId,
        sql_snapshot: ticketDialog.sql,
        title,
        description: ticketDescRef.current.trim(),
      })
      toast.success('工单已提交')
      setTicketDialog((prev) => ({ ...prev, open: false }))
      ticketTitleRef.current = ''
      ticketDescRef.current = ''
      navigate('/tickets')
    } catch (err) {
      toast.error(getApiErrorMessage(err, '提交工单失败'))
    }
  }, [createTicketMutation, ticketDialog, navigate])

  // Escalation handlers
  const handleEscalatedExecute = useCallback(async () => {
    if (!activeTab?.projectId || !activeTab?.database) return
    if (isExecuting) return
    setIsExecuting(true)
    const sqlToExecute = getEditorSql()
    if (!sqlToExecute) { setIsExecuting(false); return }
    applyExecutionHighlight()

    const projectId = activeTab.projectId
    const database = activeTab.database
    const projectName = projects.find((p) => p.id === projectId)?.name ?? `Project ${projectId}`

    try {
      const result = await escalatedExecuteMutation.mutateAsync({
        project_id: projectId,
        database,
        sql: sqlToExecute,
      })

      const entry: ExecutionHistoryEntry = {
        id: nextHistoryId(), sql: sqlToExecute, projectId, projectName, database, timestamp: Date.now(),
      }
      setExecutionHistory((prev) => [entry, ...prev].slice(0, 500))

      const resultTabId = Date.now()
      const newResultTabs: ResultTab[] = result.results?.length
        ? result.results.map((qr, i) => ({
            id: resultTabId + i,
            title: `结果 ${resultTabs.length + i + 1}`,
            sql: sqlToExecute,
            columns: qr.columns.map((col) => ({ name: col })),
            rows: qr.rows.map((row) => {
              const obj: Record<string, unknown> = {}
              qr.columns.forEach((col, ci) => { obj[col] = row[ci] })
              return obj
            }),
            rowCount: qr.total,
            durationMs: result.execution?.duration_ms,
          }))
        : [{
            id: resultTabId,
            title: `结果 ${resultTabs.length + 1}`,
            sql: sqlToExecute,
            rowCount: result.execution?.row_count,
            affectedRows: result.execution?.affected_rows,
            durationMs: result.execution?.duration_ms,
          }]
      setResultTabs((prev) => [...prev, ...newResultTabs])
      setActiveResultTabIndex(resultTabs.length + newResultTabs.length - 1)
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, '提权执行失败')
      const errorTab: ResultTab = { id: Date.now(), title: `错误 ${resultTabs.length + 1}`, sql: sqlToExecute, error: errorMsg }
      setResultTabs((prev) => [...prev, errorTab])
      setActiveResultTabIndex(resultTabs.length)
    } finally {
      setIsExecuting(false)
    }
  }, [activeTab, isExecuting, escalatedExecuteMutation, projects, resultTabs.length, getEditorSql])

  const handleEscalationRequest = useCallback(() => {
    if (!activeTab?.projectId || !activeTab?.database) return
    escalationReasonRef.current = ''
    const sqlToExecute = getEditorSql()
    setEscalationDialog({ open: true, projectId: activeTab.projectId, database: activeTab.database, sql: sqlToExecute ?? '' })
  }, [activeTab, getEditorSql])

  const handleSubmitEscalation = useCallback(async () => {
    if (!escalationDialog.projectId || !escalationReasonRef.current.trim()) {
      toast.error('请填写申请原因')
      return
    }
    try {
      await createEscalationMutation.mutateAsync({
        project_id: escalationDialog.projectId,
        reason: escalationReasonRef.current.trim(),
      })
      toast.success('提权申请已提交，等待审批')
      setEscalationDialog((prev) => ({ ...prev, open: false }))
    } catch (error) {
      toast.error(getApiErrorMessage(error, '提权申请失败'))
    }
  }, [escalationDialog.projectId, createEscalationMutation])

  // Monaco mount
  const handleEditorMount = useCallback((editor: Parameters<import('@monaco-editor/react').OnMount>[0]) => {
    editorRef.current = editor
  }, [])

  // History handlers
  const handleHistoryDoubleClick = useCallback((entry: ExecutionHistoryEntry) => {
    addTab({ sql: entry.sql, projectId: entry.projectId, database: entry.database })
    if (!selectedProjectIds.includes(entry.projectId)) {
      setSelectedProjectIds((prev) => [...prev, entry.projectId])
    }
  }, [addTab, selectedProjectIds])

  const filteredHistory = useMemo(() => {
    if (!historyFilter.trim()) return executionHistory
    const q = historyFilter.toLowerCase()
    return executionHistory.filter(
      (h) => h.sql.toLowerCase().includes(q) || h.projectName.toLowerCase().includes(q) || h.database.toLowerCase().includes(q),
    )
  }, [executionHistory, historyFilter])

  // Build project databases map for tree
  const projectDatabasesMap = useMemo(() => {
    const map = new Map<number, string[]>()
    selectedProjectIds.forEach((pid, idx) => {
      const qResult = databaseQueries[idx]
      if (qResult?.data?.databases) map.set(pid, qResult.data.databases)
    })
    return map
  }, [selectedProjectIds, databaseQueries])

  const activeResult = resultTabs[activeResultTabIndex]

  return {
    // State
    leftPanelTab, setLeftPanelTab,
    tabs, activeTabIndex, activeTab,
    resultTabs, activeResultTabIndex, setActiveResultTabIndex, activeResult,
    isExecuting,
    projects, projectDatabasesMap,
    tables, isLoadingTables,
    selectedProjectIds, setSelectedProjectIds,
    activeDbForTables, setActiveDbForTables,
    executionHistory, historyFilter, setHistoryFilter,
    filteredHistory,
    tableContextMenu, setTableContextMenu,
    tabContextMenu, setTabContextMenu,
    resultTabContextMenu, setResultTabContextMenu,
    columnWidths, setColumnWidths,
    ticketDialog, setTicketDialog,
    escalationDialog, setEscalationDialog,
    ticketTitleRef, ticketDescRef, escalationReasonRef,
    activeEscalationData,
    createTicketMutation, createEscalationMutation,
    editorRef,
    myFavorites,

    // Queries (for DB tree loading state)
    databaseQueries: databaseQueries as any,

    // Panel layout persistence
    savedHorizontalLayout, handleHorizontalLayoutChange,

    // Handlers
    handleExecute, addTab, closeTab, switchTab,
    updateTabSql, updateActiveTabContext,
    handleDatabaseSelect, handleDatabaseNewTab,
    handleTableContextMenu, handleCopySelect,
    handlePreviewTable,
    handleFormatSql,
    handleFavoriteClick,
    closeTabByIndex, closeOtherTabs, closeAllTabs,
    closeResultTabByIndex, closeOtherResultTabs, closeAllResultTabs,
    handleTicket, handleSubmitTicket,
    handleEscalatedExecute, handleEscalationRequest, handleSubmitEscalation,
    handleEditorMount, handleHistoryDoubleClick,
  }
}
