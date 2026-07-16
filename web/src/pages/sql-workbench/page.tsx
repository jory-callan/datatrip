import { useState } from 'react'
import { useCompletionTables } from './use-completion'
import { IconChevronLeft, IconChevronRight, IconClock, IconCode, IconCopy, IconDatabase, IconHistory, IconPlus, IconSearch, IconShield, IconTable, IconWand, IconX } from '@tabler/icons-react'
import { Group, Panel, Separator } from 'react-resizable-panels'

import { SqlEditor } from '@/components/sql-editor'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { MultiProjectSelect } from '@/components/multi-project-select'

import { useWorkbench } from './use-workbench'
import { VirtualResultTable } from './virtual-table'
import { TableContextMenu } from './table-context-menu'
import { TabExecuteBar } from './tab-execute-bar'

export function SqlWorkbenchPage() {

  const [renamingTabIndex, setRenamingTabIndex] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const {
    leftPanelTab, setLeftPanelTab,
    tabs, activeTabIndex, activeTab,
    resultTabs, activeResultTabIndex, setActiveResultTabIndex, activeResult,
    isExecuting,
    projects, projectDatabasesMap,
    tables, isLoadingTables,
    selectedProjectIds, setSelectedProjectIds,
    activeDbForTables,
    expandedTables, tableColumnsMap, loadingColumns, handleTableExpand,
    historyKeyword, setHistoryKeyword,
    historyTimeRange, setHistoryTimeRange,
    historyPage, setHistoryPage,
    auditQuery, filteredAuditHistory,
    historyContextMenu, setHistoryContextMenu,
    tableContextMenu, setTableContextMenu,
    tabContextMenu, setTabContextMenu,
    resultTabContextMenu, setResultTabContextMenu,
    ticketDialog, setTicketDialog,
    escalationDialog, setEscalationDialog,
    ticketTitleRef, ticketDescRef, escalationReasonRef,
    activeEscalationData,
    createTicketMutation, createEscalationMutation,
    editorRef,
    databaseQueries,
    mySnippets,
    snippetDialog, setSnippetDialog,
    handleSaveSnippet, handleDeleteSnippet,
    createSnippetMutation, deleteSnippetMutation,
    handleExecute, addTab, closeTab, switchTab,
    updateTabSql, updateActiveTabContext,
    handleDatabaseSelect, handleDatabaseNewTab,
    handleTableContextMenu, handleCopySelect, handlePreviewTable,
    handleFormatSql,
    handleFavoriteClick,
    renameTab, closeTabByIndex, closeOtherTabs, closeAllTabs,
    closeResultTabByIndex, closeOtherResultTabs, closeAllResultTabs,
    handleTicket, handleSubmitTicket,
    handleEscalatedExecute, handleEscalationRequest, handleSubmitEscalation,
    handleEditorMount, handleHistoryDoubleClick, handleHistoryContextMenu,
    savedHorizontalLayout, handleHorizontalLayoutChange,
  } = useWorkbench()

  const TAB_ICONS = [
    { key: 'database', icon: IconDatabase, label: '数据库' },
    { key: 'snippets', icon: IconCode, label: '代码片段' },
    { key: 'history', icon: IconHistory, label: '执行历史' },
  ] as const

  // 为 SQL 编辑器提供表名 + 列名自动补全（后台批量拉取列元数据）
  const completionTables = useCompletionTables(tables, activeDbForTables)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Group orientation="horizontal" id="sql-wb-horizontal" className="flex-1 min-h-0"
        defaultLayout={savedHorizontalLayout}
        onLayoutChanged={handleHorizontalLayoutChange}>
        <Panel collapsible id="left-panel" defaultSize="300px" minSize="20%" maxSize="600px" className="border-r">
          <div className="flex h-full overflow-hidden">
            <div className="shrink-0 w-9 flex flex-col items-center border-r bg-muted/20 pt-1 gap-0.5">
              {TAB_ICONS.map(({ key, icon: Icon, label }) => (
                <button key={key} type="button" className={cn('flex items-center justify-center w-7 h-7 rounded-md text-xs',
                  leftPanelTab === key ? 'bg-background text-foreground shadow-sm border' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )} onClick={() => setLeftPanelTab(key)} title={label}>
                  <Icon className="size-4" />
                </button>
              ))}
              <div className="flex-1" />
              <button type="button" onClick={() => {}} className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent mb-1" title={'折叠'}>
                <IconX className="size-3.5" />
              </button>
            </div>

            <div className="flex flex-col flex-1 min-w-0 min-h-0">
              {leftPanelTab === 'database' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="shrink-0 px-2 py-1.5 border-b">
                    <MultiProjectSelect projects={projects} selectedIds={selectedProjectIds} onChange={setSelectedProjectIds} />
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto p-1.5">
                    {selectedProjectIds.length === 0 && (
                      <p className="text-xs text-muted-foreground px-2 py-4 text-center">{'请先选择项目'}</p>
                    )}
                    {selectedProjectIds.map((pid) => {
                      const project = projects.find((p) => p.id === pid)
                      const projectName = project?.name ?? `Project ${pid}`
                      const dbList = projectDatabasesMap.get(pid) ?? []
                      const idx = selectedProjectIds.indexOf(pid)
                      const isLoading = (databaseQueries as any)?.[idx]?.isLoading ?? false
                      return (
                        <div key={pid} className="mb-2">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm">
                            <IconDatabase className="size-3.5 text-primary shrink-0" />
                            <span className="text-xs font-medium truncate">{projectName}</span>
                          </div>
                          <div className="ml-3 border-l pl-2">
                            {isLoading && (
                              <div className="space-y-1.5 py-1 px-2">
                                <Skeleton className="h-3.5 w-4/5" /><Skeleton className="h-3.5 w-3/5" />
                              </div>
                            )}
                            {!isLoading && dbList.length === 0 && (
                              <p className="px-2 py-1 text-xs text-muted-foreground">{'暂无数据库'}</p>
                            )}
                            {dbList.map((db) => {
                              const isActive = activeDbForTables?.projectId === pid && activeDbForTables?.database === db
                              const isExpanded = isActive
                              return (
                                <div key={`${pid}-${db}`}>
                                  <div className="flex items-center group">
                                    <button type="button" className={cn('flex flex-1 items-center gap-1 rounded-l px-2 py-1 text-xs hover:bg-accent text-left min-w-0', isActive && 'bg-accent')}
                                      onClick={() => handleDatabaseSelect(pid, db)}>
                                      <IconTable className="size-3 shrink-0 text-muted-foreground" />
                                      <span className="truncate">{db}</span>
                                    </button>
                                    <button type="button" className="shrink-0 flex items-center justify-center w-5 h-6 rounded-r text-muted-foreground hover:text-foreground hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                                      title={'New Tab'} onClick={(e) => { e.stopPropagation(); handleDatabaseNewTab(pid, db) }}>
                                      <IconPlus className="size-3" />
                                    </button>
                                  </div>
                                  {isExpanded && (
                                    <div className="ml-3 border-l pl-2 mt-0.5">
                                      {isLoadingTables && activeDbForTables?.projectId === pid ? (
                                        <div className="space-y-1 py-1"><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-3/5" /></div>
                                      ) : tables.length > 0 && activeDbForTables?.projectId === pid ? (
                                        tables.map((tbl) => {
                                          const tblKey = `${tbl.database}.${tbl.table}`
                                          const isTblExpanded = expandedTables.has(tblKey)
                                          const cols = tableColumnsMap.get(tblKey)
                                          const isColsLoading = loadingColumns.has(tblKey)
                                          return (
                                            <div key={`${tbl.database}-${tbl.table}`}>
                                              <div className="flex items-center group" onContextMenu={(e) => handleTableContextMenu(e, tbl.table, pid, tbl.database)}>
                                                <button type="button" className="flex flex-1 items-center gap-1 rounded-l px-2 py-0.5 text-xs hover:bg-accent text-left text-muted-foreground hover:text-foreground min-w-0"
                                                  onClick={() => handleTableExpand(tbl.table, pid, tbl.database)}>
                                                  <IconTable className="size-2.5 shrink-0" />
                                                  <span className="truncate">{tbl.table}</span>
                                                </button>
                                              </div>
                                              {isTblExpanded && (
                                                <div className="ml-2 border-l pl-2 mt-0.5 space-y-0.5">
                                                  {isColsLoading ? (
                                                    <div className="space-y-1 py-1"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                                                  ) : cols && cols.length > 0 ? cols.map((col) => (
                                                    <div key={col.name} className="flex items-center gap-1.5 px-2 py-0.5 text-xs">
                                                      <span className="text-foreground font-mono truncate">{col.name}</span>
                                                      <span className="text-muted-foreground/60 shrink-0">
                                                        {col.database_type}{col.length != null ? `(${col.length})` : ''}
                                                      </span>
                                                      {col.comment ? (
                                                        <span className="text-muted-foreground/40 truncate hidden 2xl:inline">— {col.comment}</span>
                                                      ) : null}
                                                    </div>
                                                  )) : (
                                                    <p className="px-2 py-0.5 text-xs text-muted-foreground">{'无列信息'}</p>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })
                                      ) : activeDbForTables?.projectId === pid ? (
                                        <p className="px-2 py-1 text-xs text-muted-foreground">{'暂无数据表'}</p>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {leftPanelTab === 'snippets' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="shrink-0 px-2 py-1.5 border-b flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{'代码片段'}</span>
                    <button type="button" className="inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs text-primary hover:bg-accent shrink-0"
                      onClick={() => setSnippetDialog((prev) => ({ ...prev, open: true, editingId: null, name: '', content: activeTab?.sql ?? '', datasource_type: '' }))}>
                      <IconPlus className="size-3" />
                      {'新建'}
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto p-1">
                    {mySnippets.isLoading ? (
                      <div className="space-y-1.5 p-2"><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-4/5" /></div>
                    ) : (mySnippets.data ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-4 text-center">{'暂无代码片段'}</p>
                    ) : (mySnippets.data ?? []).map((snippet) => (
                      <div key={snippet.id} className="flex items-start gap-1 rounded-md px-2 py-1.5 hover:bg-accent mb-0.5 border border-transparent hover:border-border cursor-pointer group"
                        onDoubleClick={() => {
                          setSnippetDialog((prev) => ({ ...prev, open: true, editingId: snippet.id, name: snippet.name, content: snippet.content, datasource_type: snippet.datasource_type }))
                        }}>
                        <IconCode className="size-3.5 shrink-0 mt-0.5 text-foreground/60" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{snippet.name}</p>
                          <pre className="text-[11px] text-muted-foreground truncate font-mono leading-tight">{snippet.content}</pre>
                        </div>
                        <button type="button" className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleDeleteSnippet(snippet.id) }}>
                          <IconX className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leftPanelTab === 'history' && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* 时间快捷 + 搜索 */}
                  <div className="shrink-0 px-2 py-1.5 border-b space-y-1.5">
                    <div className="flex items-center gap-1">
                      {[['7d', '近7天'], ['30d', '近30天'], ['90d', '近90天'], ['1y', '近1年']].map(([val, label]) => (
                        <button key={val} type="button" className={cn(
                          'rounded px-2 py-0.5 text-xs transition-colors',
                          historyTimeRange === val
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                        )} onClick={() => setHistoryTimeRange(historyTimeRange === val ? null : val)}>
                          {label}
                        </button>
                      ))}
                      {historyTimeRange && (
                        <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setHistoryTimeRange(null)}>
                          {'清除'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <IconSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/60" />
                      <Input placeholder={'搜索 SQL...'} value={historyKeyword}
                        onChange={(e) => { setHistoryKeyword(e.target.value); setHistoryPage(1) }} className="h-7 pl-7 text-xs" />
                    </div>
                  </div>

                  {/* 列表 */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-1">
                    {auditQuery.isFetching ? (
                      <div className="space-y-1.5 p-2">
                        <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-4/5" />
                      </div>
                    ) : filteredAuditHistory.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-4 text-center">{'暂无执行记录'}</p>
                    ) : filteredAuditHistory.items.map((entry, i) => {
                      const projectName = projects.find((p) => p.id === entry.project_id)?.name ?? `项目 ${entry.project_id.slice(0, 6)}`
                      return (
                        <button key={entry.id ?? i} type="button" className="flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-accent mb-0.5 border border-transparent hover:border-border cursor-pointer"
                          title={'双击在新标签页中打开'} onDoubleClick={() => handleHistoryDoubleClick(entry)}
                          onContextMenu={(e) => handleHistoryContextMenu(e, entry)}>
                          <div className="flex items-center gap-1.5 text-xs">
                            <IconClock className="size-3 shrink-0 text-muted-foreground" />
                            <span className="font-medium truncate">{projectName}</span>
                            <span className="text-muted-foreground shrink-0">·</span>
                            <span className="text-muted-foreground truncate">{entry.duration_ms != null ? `${entry.duration_ms}ms` : ''}</span>
                          </div>
                          <pre className="text-[11px] text-muted-foreground truncate font-mono leading-tight">{entry.raw_text}</pre>
                          <span className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* 分页 */}
                  {filteredAuditHistory.totalPages > 1 && (
                    <div className="shrink-0 px-2 py-1 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span>{filteredAuditHistory.total} 条</span>
                      <div className="flex items-center gap-1">
                        <button type="button" className="rounded p-0.5 hover:bg-accent disabled:opacity-30"
                          disabled={filteredAuditHistory.page <= 1} onClick={() => setHistoryPage((p) => p - 1)}>
                          <IconChevronLeft className="size-3.5" />
                        </button>
                        <span className="px-1">{(filteredAuditHistory.totalPages > 0 ? filteredAuditHistory.page : 0)}/{filteredAuditHistory.totalPages}</span>
                        <button type="button" className="rounded p-0.5 hover:bg-accent disabled:opacity-30"
                          disabled={filteredAuditHistory.page >= filteredAuditHistory.totalPages} onClick={() => setHistoryPage((p) => p + 1)}>
                          <IconChevronRight className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Separator className="relative w-1 data-[resize-handle-active]:bg-primary/30 hover:bg-primary/20 transition-colors">
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </Separator>

        <Panel id="main-panel" minSize={30}>
          <Group orientation="vertical" id="sql-wb-vertical" className="h-full">
            <Panel defaultSize={68} minSize={25} className="flex flex-col">
              <div className="shrink-0 flex items-center border-b bg-muted/30 overflow-x-auto h-9">
                {tabs.map((tab, index) => {
                  const isRenaming = renamingTabIndex === index
                  return (
                    <div key={tab.id} className={cn('group flex items-center gap-1 px-3 py-1.5 text-sm border-r cursor-pointer shrink-0 min-w-0',
                      index === activeTabIndex ? 'bg-background border-b-2 border-b-primary' : 'hover:bg-accent/50',
                    )} onClick={() => { if (!isRenaming) switchTab(index) }}
                      onContextMenu={(e) => { e.preventDefault(); setTabContextMenu({ x: e.clientX, y: e.clientY, index }) }}>
                      {isRenaming ? (
                        <input
                          autoFocus
                          className="w-20 h-5 px-1 text-xs border rounded bg-background outline-none"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => {
                            renameTab(renameValue, index)
                            setRenamingTabIndex(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              renameTab(renameValue, index)
                              setRenamingTabIndex(null)
                            } else if (e.key === 'Escape') {
                              setRenamingTabIndex(null)
                            }
                            e.stopPropagation()
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate max-w-[100px]"
                          onDoubleClick={() => {
                            setRenamingTabIndex(index)
                            setRenameValue(tab.title)
                          }}>
                          {tab.title}
                        </span>
                      )}
                      {tabs.length > 1 && (
                        <button type="button" className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded-sm p-0.5"
                          onClick={(e) => { e.stopPropagation(); closeTab(tab.id, index) }}>
                          <IconX className="size-3" />
                        </button>
                      )}
                    </div>
                  )
                })}
                <button type="button" className="shrink-0 px-2 py-1.5 hover:bg-accent" onClick={() => addTab()} title={'新建标签页'}>
                  <IconPlus className="size-4" />
                </button>
              </div>

              {activeTab && (
                <TabExecuteBar
                  tab={activeTab} projects={projects}
                  isExecuting={isExecuting} isEscalationActive={!!activeEscalationData?.active}
                  onUpdateTab={updateActiveTabContext}
                  onExecute={handleExecute} onTicket={handleTicket}
                  onEscalatedExecute={handleEscalatedExecute} onEscalationRequest={handleEscalationRequest}
                  onFormat={handleFormatSql}
                />
              )}

              {activeTab && (
                <div className="flex-1 min-h-0">
                  <SqlEditor key={activeTab.id} value={activeTab.sql} onChange={(val) => updateTabSql(val ?? '')}
                    onMount={handleEditorMount} language="sql" completionTables={completionTables} />
                </div>
              )}
            </Panel>

            <Separator className="h-1.5 data-[resize-handle-active]:bg-primary/30 hover:bg-primary/20 transition-colors" />

            <Panel defaultSize={32} minSize={8}>
              <div className="h-full border-t overflow-hidden flex flex-col">
                {resultTabs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    {'执行 SQL 后将在此处显示结果'}
                  </div>
                ) : (
                  <>
                    <div className="shrink-0 flex items-center border-b bg-muted/30 overflow-x-auto">
                      {resultTabs.map((rt, index) => (
                        <div key={rt.id} className={cn('group flex items-center gap-1.5 px-3 py-1 text-sm border-r cursor-pointer shrink-0',
                          index === activeResultTabIndex ? 'bg-background border-b-2 border-b-primary' : 'hover:bg-accent/50',
                        )} onClick={() => setActiveResultTabIndex(index)}
                          onContextMenu={(e) => { e.preventDefault(); setResultTabContextMenu({ x: e.clientX, y: e.clientY, index }) }}>
                          {rt.error ? <IconX className="size-3.5 text-destructive" /> : null}
                          <span className="truncate max-w-[120px]">{rt.title}</span>
                          {resultTabs.length > 1 && (
                            <button type="button" className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded-sm p-0.5"
                              onClick={(e) => { e.stopPropagation(); closeResultTabByIndex(index) }}>
                              <IconX className="size-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {activeResult ? (
                      <div className="flex-1 min-h-0">
                        <VirtualResultTable key={activeResult.id} tab={activeResult} />
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </Panel>
          </Group>
        </Panel>
      </Group>

      {/* Tab context menus */}
      {tabContextMenu && (
        <div className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md"
          style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
          ref={(el) => {
            if (!el) return
            const handleClickOutside = (e: MouseEvent) => {
              if (!el.contains(e.target as Node)) { setTabContextMenu(null); document.removeEventListener('mousedown', handleClickOutside) }
            }
            setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
          }}>
          <button type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { closeTabByIndex(tabContextMenu.index); setTabContextMenu(null) }}>
            <IconX className="size-3.5" />{'关闭当前'}
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { closeOtherTabs(tabContextMenu.index); setTabContextMenu(null) }}>
            <IconCopy className="size-3.5" />{'关闭其他'}
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { closeAllTabs(); setTabContextMenu(null) }}>
            <IconCopy className="size-3.5" />{'关闭全部'}
          </button>
        </div>
      )}

      {resultTabContextMenu && (
        <div className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md"
          style={{ left: resultTabContextMenu.x, top: resultTabContextMenu.y }}
          ref={(el) => {
            if (!el) return
            const handleClickOutside = (e: MouseEvent) => {
              if (!el.contains(e.target as Node)) { setResultTabContextMenu(null); document.removeEventListener('mousedown', handleClickOutside) }
            }
            setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
          }}>
          <button type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { closeResultTabByIndex(resultTabContextMenu.index); setResultTabContextMenu(null) }}>
            <IconX className="size-3.5" />{'关闭当前'}
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { closeOtherResultTabs(resultTabContextMenu.index); setResultTabContextMenu(null) }}>
            <IconCopy className="size-3.5" />{'关闭其他'}
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { closeAllResultTabs(); setResultTabContextMenu(null) }}>
            <IconCopy className="size-3.5" />{'关闭全部'}
          </button>
        </div>
      )}

      {tableContextMenu && (
        <TableContextMenu state={tableContextMenu} onCopySelect={handleCopySelect} onPreviewTable={handlePreviewTable} onClose={() => setTableContextMenu(null)} />
      )}

      {/* History Context Menu */}
      {historyContextMenu && (
        <div className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md"
          style={{ left: historyContextMenu.x, top: historyContextMenu.y }}
          ref={(el) => {
            if (!el) return
            const handleClickOutside = (e: MouseEvent) => {
              if (!el.contains(e.target as Node)) { setHistoryContextMenu(null); document.removeEventListener('mousedown', handleClickOutside) }
            }
            setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
          }}>
          <button type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => {
              setSnippetDialog((prev) => ({ ...prev, open: true, editingId: null, name: '', content: historyContextMenu.raw_text, datasource_type: '' }))
              setHistoryContextMenu(null)
            }}>
            <IconCode className="size-3.5" />{'添加到代码片段'}
          </button>
        </div>
      )}

      {/* Ticket Dialog */}
      <Dialog open={ticketDialog.open} onOpenChange={(open) => setTicketDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconDatabase className="h-5 w-5" />{'提交工单'}
            </DialogTitle>
            <DialogDescription>{'检测到写操作，请填写工单信息后提交审批'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><Label className="text-muted-foreground">{'项目'}</Label><p className="font-medium">{ticketDialog.projectName}</p></div>
              <div><Label className="text-muted-foreground">{'数据库'}</Label><p className="font-medium">{ticketDialog.database}</p></div>
            </div>
            <div>
              <Label className="text-muted-foreground">SQL</Label>
              <pre className="mt-1 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap overflow-auto max-h-32 border">{ticketDialog.sql}</pre>
            </div>
            <div>
              <Label htmlFor="ticket-title">{'工单标题'} <span className="text-destructive">*</span></Label>
              <Input id="ticket-title" placeholder={'简要描述此次变更内容'} className="mt-1"
                ref={(el) => { if (el) el.value = ticketTitleRef.current }}
                onChange={(e) => { ticketTitleRef.current = e.target.value }} />
            </div>
            <div>
              <Label htmlFor="ticket-desc">{'说明'}</Label>
              <Textarea id="ticket-desc" placeholder={'可选，补充变更原因或注意事项'} className="mt-1" rows={3}
                ref={(el) => { if (el) el.value = ticketDescRef.current }}
                onChange={(e) => { ticketDescRef.current = e.target.value }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketDialog((prev) => ({ ...prev, open: false }))} disabled={createTicketMutation.isPending}>{'取消'}</Button>
            <Button onClick={handleSubmitTicket} disabled={createTicketMutation.isPending}>
              {createTicketMutation.isPending ? '提交中...' : '提交工单'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalation Dialog */}
      <Dialog open={escalationDialog.open} onOpenChange={(open) => setEscalationDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconShield className="size-5 text-purple-600" />{'申请提权'}
            </DialogTitle>
            <DialogDescription>{`为项目`}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{'申请原因'} <span className="text-destructive">*</span></Label>
              <Textarea defaultValue={escalationReasonRef.current} onChange={(e) => { escalationReasonRef.current = e.target.value }}
                placeholder={'请说明为什么需要执行写操作...'} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalationDialog((prev) => ({ ...prev, open: false }))}>{'取消'}</Button>
            <Button onClick={handleSubmitEscalation} disabled={createEscalationMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
              {createEscalationMutation.isPending ? '提交中...' : '提交申请'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snippet Dialog */}
      <Dialog open={snippetDialog.open} onOpenChange={(open) => setSnippetDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCode className="size-5 text-primary" />
              {snippetDialog.editingId ? '编辑代码片段' : '保存代码片段'}
            </DialogTitle>
            <DialogDescription>{snippetDialog.editingId ? '修改代码片段信息' : '将当前 SQL 保存为代码片段，方便后续复用'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{'片段名称'} <span className="text-destructive">*</span></Label>
              <Input value={snippetDialog.name} onChange={(e) => setSnippetDialog((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={'为代码片段起个名字'} />
            </div>
            <div className="grid gap-2">
              <Label>{'数据源类型'} <span className="text-destructive">*</span></Label>
              <Select value={snippetDialog.datasource_type}
                onValueChange={(val) => setSnippetDialog((prev) => ({ ...prev, datasource_type: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder={'选择数据源类型'} />
                </SelectTrigger>
                <SelectContent>
                  {['mysql', 'redis', 'mongo', 'es', 'other'].map((t) => (
                    <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{'代码内容'}</Label>
              <Textarea value={snippetDialog.content} onChange={(e) => setSnippetDialog((prev) => ({ ...prev, content: e.target.value }))}
                rows={6} className="font-mono text-sm" placeholder={'SQL / Redis 命令等'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnippetDialog((prev) => ({ ...prev, open: false }))}>{'取消'}</Button>
            <Button onClick={handleSaveSnippet} disabled={createSnippetMutation.isPending || deleteSnippetMutation.isPending}>
              {createSnippetMutation.isPending ? '保存中...' : (snippetDialog.editingId ? '更新' : '保存')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
