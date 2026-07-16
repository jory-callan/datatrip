import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { keepPreviousData, useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { format } from 'sql-formatter'

import { apiClient, getApiErrorMessage } from '@/lib/api-client'
import { useAppStore } from '@/stores/app-store'
import { useProjects } from '@/lib/api/projects'
import { useExecuteSql, useExecuteEscalated, useProjectTables, type ProjectColumnsResponse, type ColumnInfoData } from '@/lib/api/sqlexec'
import { useCreateTicket } from '@/lib/api/tickets'
import { useActiveEscalation, useCreateEscalation } from '@/lib/api/escalations'
import { useCreateSnippet, useDeleteSnippet, useUpdateSnippet, useMySnippets } from '@/lib/api/snippets'
import { useAudits } from '@/lib/api/audits'
import type { AuditLog } from '@/lib/api/audits'
import type { ProjectDatabasesResponse } from '@/lib/api/sqlexec'

import type { EditorTab, ResultTab, TableContextMenuState } from './types'
import { LS_KEYS, loadFromStorage, nextTabId, saveToStorage } from './utils'

export function useWorkbench() {

  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.user)

  // Persisted state
  const [leftPanelTab, setLeftPanelTab] = useState(() => loadFromStorage(LS_KEYS.leftPanelTab, 'database'))
  const [storedSelectedProjectIds] = useState<string[]>(() => loadFromStorage(LS_KEYS.selectedProjects, []))

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
    open: boolean; projectId: string; projectName: string; database: string; sql: string
  }>({ open: false, projectId: '', projectName: '', database: '', sql: '' })
  const ticketTitleRef = useRef('')
  const ticketDescRef = useRef('')

  // Escalation dialog
  const createEscalationMutation = useCreateEscalation()
  const [escalationDialog, setEscalationDialog] = useState<{
    open: boolean; projectId: string; database: string; sql: string
  }>({ open: false, projectId: '', database: '', sql: '' })
  const escalationReasonRef = useRef('')

  // Snippet management
  const createSnippetMutation = useCreateSnippet()
  const deleteSnippetMutation = useDeleteSnippet()
  const updateSnippetMutation = useUpdateSnippet()
  const [snippetDialog, setSnippetDialog] = useState<{
    open: boolean; editingId: string | null; name: string; content: string; datasource_type: string
  }>({ open: false, editingId: null, name: '', content: '', datasource_type: '' })

  const handleSaveSnippet = useCallback(async () => {
    if (!snippetDialog.name.trim() || !snippetDialog.content.trim()) {
      toast.error('请填写片段名称和内容')
      return
    }
    if (!snippetDialog.datasource_type) {
      toast.error('请选择数据源类型')
      return
    }
    try {
      if (snippetDialog.editingId) {
        await updateSnippetMutation.mutateAsync({
          id: snippetDialog.editingId,
          name: snippetDialog.name.trim(),
          content: snippetDialog.content.trim(),
          datasource_type: snippetDialog.datasource_type || '',
        })
        toast.success('代码片段已更新')
      } else {
        await createSnippetMutation.mutateAsync({
          name: snippetDialog.name.trim(),
          content: snippetDialog.content.trim(),
          datasource_type: snippetDialog.datasource_type || '',
        })
        toast.success('代码片段已保存')
      }
      setSnippetDialog((prev) => ({ ...prev, open: false, editingId: null, name: '', content: '' }))
    } catch (err) {
      toast.error(getApiErrorMessage(err, '保存失败'))
    }
  }, [snippetDialog, createSnippetMutation, updateSnippetMutation])

  const handleDeleteSnippet = useCallback(async (id: string) => {
    const ok = window.confirm('确定删除此代码片段？')
    if (!ok) return
    try {
      await deleteSnippetMutation.mutateAsync(id)
      toast.success('代码片段已删除')
    } catch (err) {
      toast.error(getApiErrorMessage(err, '删除失败'))
    }
  }, [deleteSnippetMutation])

  // Table context menu
  const [tableContextMenu, setTableContextMenu] = useState<TableContextMenuState | null>(null)

  // Multi-project state
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(storedSelectedProjectIds)
  const [activeDbForTables, setActiveDbForTables] = useState<{ projectId: string; database: string } | null>(null)

  // ─── Execution history (via Audit API) ───────────────────

  const [historyPage, setHistoryPage] = useState(1)
  const [historyPageSize] = useState(50)
  const [historyTimeRange, setHistoryTimeRange] = useState<string | null>('7d') // '7d' | '30d' | '90d' | '1y' | null
  const [historyKeyword, setHistoryKeyword] = useState('')

  const timeRangeStart = useMemo(() => {
    if (!historyTimeRange) return undefined
    const now = Date.now()
    const ranges: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
    return new Date(now - (ranges[historyTimeRange] ?? 7) * 86400000).toISOString()
  }, [historyTimeRange])

  const auditQuery = useAudits({
    page: 1,
    pageSize: historyPageSize,
    needCount: false,
    actor_id: currentUser?.id,
    start_time: timeRangeStart,
  })

  // Client-side filter + paginate
  const filteredAuditHistory = useMemo(() => {
    const list = auditQuery.data?.list ?? []
    const kw = historyKeyword.trim().toLowerCase()
    let filtered = kw ? list.filter((a) => a.raw_text?.toLowerCase().includes(kw)) : list
    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / historyPageSize))
    const page = Math.min(historyPage, totalPages)
    const start = (page - 1) * historyPageSize
    return {
      items: filtered.slice(start, start + historyPageSize),
      total,
      page,
      totalPages,
    }
  }, [auditQuery.data, historyKeyword, historyPage, historyPageSize])

  // History right-click context menu
  const [historyContextMenu, setHistoryContextMenu] = useState<{
    x: number; y: number; raw_text: string; project_id: string
  } | null>(null)

  // Tab right-click context menus
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; index: number } | null>(null)
  const [resultTabContextMenu, setResultTabContextMenu] = useState<{ x: number; y: number; index: number } | null>(null)

  // Monaco editor ref
  const editorRef = useRef<Parameters<import('@monaco-editor/react').OnMount>[0] | null>(null)
  // Decorations for executed SQL highlight
  const executedDecorationsRef = useRef<string[]>([])

  // Auto-execute trigger for table preview
  const pendingAutoExecuteRef = useRef(false)

  // Table column expansion (database tree)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [tableColumnsMap, setTableColumnsMap] = useState<Map<string, ColumnInfoData[]>>(new Map())
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set())

  const handleTableExpand = useCallback(async (tableName: string, projectId: string, database: string) => {
    const key = `${database}.${tableName}`
    if (expandedTables.has(key)) {
      setExpandedTables((prev) => { const n = new Set(prev); n.delete(key); return n })
      return
    }
    setExpandedTables((prev) => { const n = new Set(prev); n.add(key); return n })
    if (tableColumnsMap.has(key)) return
    setLoadingColumns((prev) => { const n = new Set(prev); n.add(key); return n })
    try {
      const res = await apiClient<ProjectColumnsResponse>(`/projects/${projectId}/meta/columns`, {
        query: { database, table: tableName },
      })
      setTableColumnsMap((prev) => { const n = new Map(prev); n.set(key, res.columns); return n })
    } catch {
      // apiClient handles error toast
    } finally {
      setLoadingColumns((prev) => { const n = new Set(prev); n.delete(key); return n })
    }
  }, [expandedTables, tableColumnsMap])

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
  const mySnippets = useMySnippets()

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

      const resultTabId = Date.now()

      if (result.mode === 'direct') {
        const newResultTabs: ResultTab[] = result.results?.length
          ? result.results.map((qr, i) => ({
              id: resultTabId + i,
              title: `结果 ${resultTabs.length + i + 1}`,
              sql: sqlToExecute,
              columns: qr.columns,
              rows: qr.rows.map((row) => {
                const obj: Record<string, unknown> = {}
                qr.columns.forEach((col, ci) => { obj[col.name] = row[ci] })
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
  const addTab = useCallback((params?: { sql?: string; projectId?: string; database?: string }) => {
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
  const handleDatabaseSelect = useCallback((projectId: string, db: string) => {
    if (activeDbForTables?.projectId === projectId && activeDbForTables?.database === db) {
      setActiveDbForTables(null)
    } else {
      setActiveDbForTables({ projectId, database: db })
    }
  }, [activeDbForTables])

  const handleDatabaseNewTab = useCallback((projectId: string, db: string) => {
    addTab({ projectId, database: db })
    if (!selectedProjectIds.includes(projectId)) {
      setSelectedProjectIds((prev) => [...prev, projectId])
    }
  }, [addTab, selectedProjectIds])

  const handleTableContextMenu = useCallback((e: React.MouseEvent, tableName: string, projectId: string, database: string) => {
    e.preventDefault()
    setTableContextMenu({ x: e.clientX, y: e.clientY, tableName, projectId, database })
  }, [])

  const handleCopySelect = useCallback((tableName: string, projectId: string, database: string) => {
    const sql = `SELECT * FROM ${tableName} LIMIT 100`
    addTab({ sql, projectId, database })
  }, [addTab])

  const handlePreviewTable = useCallback((tableName: string, projectId: string, database: string) => {
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
  const handleFavoriteClick = useCallback((fav: { content: string }) => {
    addTab({ sql: fav.content })
  }, [addTab])

  // Tab right-click handlers
  const renameTab = useCallback((newTitle: string, index: number) => {
    setTabs((prev) => prev.map((t, i) => (i === index ? { ...t, title: newTitle || `SQL ${i + 1}` } : t)))
  }, [])

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
        instruction_json: JSON.stringify([{ raw: ticketDialog.sql }]),
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

      const resultTabId = Date.now()
      const newResultTabs: ResultTab[] = result.results?.length
        ? result.results.map((qr, i) => ({
            id: resultTabId + i,
            title: `结果 ${resultTabs.length + i + 1}`,
            sql: sqlToExecute,
            columns: qr.columns,
            rows: qr.rows.map((row) => {
              const obj: Record<string, unknown> = {}
              qr.columns.forEach((col, ci) => { obj[col.name] = row[ci] })
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
  const handleHistoryDoubleClick = useCallback((entry: AuditLog) => {
    addTab({ sql: entry.raw_text, projectId: entry.project_id })
    if (!selectedProjectIds.includes(entry.project_id)) {
      setSelectedProjectIds((prev) => [...prev, entry.project_id])
    }
  }, [addTab, selectedProjectIds])

  const handleHistoryContextMenu = useCallback((e: React.MouseEvent, entry: AuditLog) => {
    e.preventDefault()
    setHistoryContextMenu({ x: e.clientX, y: e.clientY, raw_text: entry.raw_text, project_id: entry.project_id })
  }, [])

  // Build project databases map for tree
  const projectDatabasesMap = useMemo(() => {
    const map = new Map<string, string[]>()
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
    expandedTables, tableColumnsMap, loadingColumns,
    handleTableExpand,
    historyKeyword, setHistoryKeyword,
    historyTimeRange, setHistoryTimeRange,
    historyPage, setHistoryPage,
    auditQuery,
    filteredAuditHistory,
    historyContextMenu, setHistoryContextMenu,
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
    mySnippets,
    snippetDialog, setSnippetDialog,
    handleSaveSnippet, handleDeleteSnippet,
    createSnippetMutation, deleteSnippetMutation,

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
    renameTab, closeTabByIndex, closeOtherTabs, closeAllTabs,
    closeResultTabByIndex, closeOtherResultTabs, closeAllResultTabs,
    handleTicket, handleSubmitTicket,
    handleEscalatedExecute, handleEscalationRequest, handleSubmitEscalation,
    handleEditorMount, handleHistoryDoubleClick, handleHistoryContextMenu,
  }
}
