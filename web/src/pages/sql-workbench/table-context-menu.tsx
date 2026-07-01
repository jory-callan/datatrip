import { useEffect, useRef } from 'react'
import { IconCopy, IconEye } from '@tabler/icons-react'

import type { TableContextMenuState } from './types'

export function TableContextMenu({
  state,
  onCopySelect,
  onPreviewTable,
  onClose,
}: {
  state: TableContextMenuState
  onCopySelect: (tableName: string, projectId: number, database: string) => void
  onPreviewTable: (tableName: string, projectId: number, database: string) => void
  onClose: () => void
}) {

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md"
      style={{ left: state.x, top: state.y }}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
        onClick={() => {
          onCopySelect(state.tableName, state.projectId, state.database)
          onClose()
        }}
      >
        <IconCopy className="size-3.5" />
        {'复制查询语句'}
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
        onClick={() => {
          onPreviewTable(state.tableName, state.projectId, state.database)
          onClose()
        }}
      >
        <IconEye className="size-3.5" />
        {'查看前100行'}
      </button>
    </div>
  )
}
