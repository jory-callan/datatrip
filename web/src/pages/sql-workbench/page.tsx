import { IconCopy, IconDatabase, IconHistory, IconPlus, IconShield, IconStar, IconTable, IconWand, IconX } from '@tabler/icons-react'
import { Group, Panel, Separator } from 'react-resizable-panels'

import { SqlEditor } from '@/components/sql-editor'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
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
import { IconClock } from '@tabler/icons-react'

import { useWorkbench } from './use-workbench'
import { VirtualResultTable } from './virtual-table'
import { TableContextMenu } from './table-context-menu'
import { TabExecuteBar } from './tab-execute-bar'

export function SqlWorkbenchPage() {

  const {
    leftPanelTab, setLeftPanelTab,
    tabs, activeTabIndex, activeTab,
    resultTabs, activeResultTabIndex, activeResult,
    isExecuting,
    projects, projectDatabasesMap,
    tables, isLoadingTables,
    selectedProjectIds, setSelectedProjectIds,
    activeDbForTables,
    executionHistory, historyFilter, setHistoryFilter,
    filteredHistory,
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
    myFavorites,
    handleExecute, addTab, closeTab, switchTab,
    updateTabSql, updateActiveTabContext,
    handleDatabaseSelect, handleDatabaseNewTab,
    handleTableContextMenu, handleCopySelect, handlePreviewTable,
    handleFormatSql,
    handleFavoriteClick,
    closeTabByIndex, closeOtherTabs, closeAllTabs,
    closeResultTabByIndex, closeOtherResultTabs, closeAllResultTabs,
    handleTicket, handleSubmitTicket,
    handleEscalatedExecute, handleEscalationRequest, handleSubmitEscalation,
    handleEditorMount, handleHistoryDoubleClick,
    savedHorizontalLayout, handleHorizontalLayoutChange,
  } = useWorkbench()

  const TAB_ICONS = [
    { key: 'database', icon: IconDatabase, label: '数据库' },
    { key: 'favorites', icon: IconStar, label: '收藏' },
    { key: 'history', icon: IconHistory, label: '执行历史' },
  ] as const

  return (
    <div className="-my-2 flex h-[calc(100dvh-var(--header-height))] flex-col overflow-hidden">
      <Group orientation="horizontal" id="sql-wb-horizontal" className="flex-1 min-h-0"
        defaultLayout={savedHorizontalLayout}
        onLayoutChanged={handleHorizontalLayoutChange}>
        <Panel collapsible id="left-panel" defaultSize="300px" minSize="20%" maxSize="600px" className="border-r">
          <div className="flex h-full">
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

            <div className="flex flex-col flex-1 min-w-0">
              {leftPanelTab === 'database' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="shrink-0 px-2 py-1.5 border-b">
                    <MultiProjectSelect projects={projects} selectedIds={selectedProjectIds} onChange={setSelectedProjectIds} />
                  </div>
                  <div className="flex-1 overflow-y-auto p-1.5">
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
                                        tables.map((tbl) => (
                                          <div key={`${tbl.database}-${tbl.table}`} onContextMenu={(e) => handleTableContextMenu(e, tbl.table, pid, tbl.database)}>
                                            <button type="button" className="flex w-full items-center gap-1 rounded px-2 py-0.5 text-xs hover:bg-accent text-left text-muted-foreground hover:text-foreground">
                                              <IconTable className="size-2.5 shrink-0" />
                                              <span className="truncate">{tbl.table}</span>
                                            </button>
                                          </div>
                                        ))
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

              {leftPanelTab === 'favorites' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="shrink-0 px-2 py-1.5 border-b">
                    <p className="text-xs font-medium">{'收藏'}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-1">
                    {myFavorites.isLoading ? (
                      <div className="space-y-1.5 p-2"><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-4/5" /></div>
                    ) : (myFavorites.data ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-4 text-center">{'暂无收藏'}</p>
                    ) : (myFavorites.data ?? []).map((fav) => (
                      <div key={fav.id} className="flex items-start gap-1 rounded-md px-2 py-1.5 hover:bg-accent mb-0.5 border border-transparent hover:border-border cursor-pointer group"
                        onDoubleClick={() => handleFavoriteClick(fav)}>
                        <IconStar className="size-3 shrink-0 mt-1 text-amber-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{fav.name}</p>
                          <pre className="text-[11px] text-muted-foreground truncate font-mono leading-tight">{fav.sql}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leftPanelTab === 'history' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="shrink-0 px-2 py-1.5 border-b">
                    <Input placeholder={'搜索执行历史...'} value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-1">
                    {filteredHistory.length === 0 && (
                      <p className="text-xs text-muted-foreground px-2 py-4 text-center">{'暂无执行历史'}</p>
                    )}
                    {filteredHistory.map((entry) => (
                      <button key={entry.id} type="button" className="flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-accent mb-0.5 border border-transparent hover:border-border cursor-pointer"
                        title={'双击在新标签页中打开'} onDoubleClick={() => handleHistoryDoubleClick(entry)}>
                        <div className="flex items-center gap-1.5 text-xs">
                          <IconClock className="size-3 shrink-0 text-muted-foreground" />
                          <span className="font-medium truncate">{entry.projectName}</span>
                          <span className="text-muted-foreground shrink-0">·</span>
                          <span className="text-muted-foreground truncate">{entry.database}</span>
                        </div>
                        <pre className="text-[11px] text-muted-foreground truncate font-mono leading-tight">{entry.sql}</pre>
                        <span className="text-[10px] text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
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
                {tabs.map((tab, index) => (
                  <div key={tab.id} className={cn('group flex items-center gap-1 px-3 py-1.5 text-sm border-r cursor-pointer shrink-0 min-w-0',
                    index === activeTabIndex ? 'bg-background border-b-2 border-b-primary' : 'hover:bg-accent/50',
                  )} onClick={() => switchTab(index)} onContextMenu={(e) => { e.preventDefault(); setTabContextMenu({ x: e.clientX, y: e.clientY, index }) }}>
                    <span className="truncate max-w-[100px]">{tab.title}</span>
                    {tabs.length > 1 && (
                      <button type="button" className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded-sm p-0.5"
                        onClick={(e) => { e.stopPropagation(); closeTab(tab.id, index) }}>
                        <IconX className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
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
                    onMount={handleEditorMount} language="sql" />
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
    </div>
  )
}
