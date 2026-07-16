import { IconFileDescription, IconLoader2, IconPlayerPlay, IconShield, IconWand } from '@tabler/icons-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectDatabases } from '@/lib/api/sqlexec'
import type { EditorTab } from './types'

export function TabExecuteBar({
  tab,
  projects,
  isExecuting,
  isEscalationActive,
  onUpdateTab,
  onExecute,
  onTicket,
  onEscalatedExecute,
  onEscalationRequest,
  onFormat,
}: {
  tab: EditorTab
  projects: { id: string; name: string }[]
  isExecuting: boolean
  isEscalationActive: boolean
  onUpdateTab: (updates: Partial<EditorTab>) => void
  onExecute: () => void
  onTicket: () => void
  onEscalatedExecute: () => void
  onEscalationRequest: () => void
  onFormat: () => void
}) {

  const { data: databasesData } = useProjectDatabases(tab.projectId)
  const databases = databasesData?.databases ?? []

  const currentDb = tab.database ?? ''
  const hasSql = !!tab.sql?.trim()
  const canExecute = !isExecuting && !!tab.projectId && !!tab.database && hasSql

  return (
    <div className="shrink-0 flex items-center gap-2 border-b border-l-[3px] border-l-primary bg-primary/[0.04] px-3 py-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground shrink-0">{'选择项目'}</span>
        <Select
          value={tab.projectId ?? ''}
          onValueChange={(val) => {
            onUpdateTab({ projectId: val, database: undefined })
          }}
        >
          <SelectTrigger className="h-7 w-[140px] text-xs border-primary/20 focus:border-primary">
            <SelectValue placeholder={'选择项目'} />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground shrink-0">{'选择数据库'}</span>
        <Select
          value={currentDb}
          onValueChange={(val) => onUpdateTab({ database: val })}
          disabled={!tab.projectId}
        >
          <SelectTrigger className="h-7 w-[140px] text-xs border-primary/20 focus:border-primary">
            <SelectValue placeholder={'选择数据库'} />
          </SelectTrigger>
          <SelectContent>
            {databases.map((db) => (
              <SelectItem key={db} value={db} className="text-xs">
                {db}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        onClick={onFormat}
        disabled={!hasSql}
        title={`Ctrl+S ${'格式化'}`}
      >
        <IconWand className="size-3.5" />
        {'格式化'}
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:shadow-none disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none transition-all"
        onClick={onExecute}
        disabled={!canExecute || isExecuting}
        title={`Ctrl+Enter ${'执行'}`}
      >
        {isExecuting ? (
          <IconLoader2 className="size-4 animate-spin" />
        ) : (
          <IconPlayerPlay className="size-4" />
        )}
        {'执行'}
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold border border-amber-500/40 text-amber-600 bg-amber-50 hover:bg-amber-100 active:shadow-none disabled:opacity-50 disabled:pointer-events-none dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40 transition-all"
        onClick={onTicket}
        disabled={!canExecute || isExecuting}
      >
        <IconFileDescription className="size-4" />
        {'提交工单'}
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold border border-purple-300 text-purple-600 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 disabled:pointer-events-none dark:bg-purple-950/20 dark:text-purple-400 dark:hover:bg-purple-950/40 transition-all"
        onClick={onEscalationRequest}
        disabled={!canExecute || isExecuting || isEscalationActive}
        title={'申请提权以执行写操作'}
      >
        <IconShield className="size-4" />
        {'申请提权'}
      </button>

      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold border transition-all ${
          isEscalationActive
            ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-sm'
            : 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40'
        } disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none`}
        onClick={onEscalatedExecute}
        disabled={!canExecute || isExecuting}
      >
        <IconShield className="size-4" />
        {'提权执行'}
      </button>
    </div>
  )
}
