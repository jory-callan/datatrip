export interface EditorTab {
  id: number
  title: string
  sql: string
  projectId?: number
  database?: string
}

export interface ResultTab {
  id: number
  title: string
  sql?: string
  columns?: { name: string; type?: string }[]
  rows?: Record<string, unknown>[]
  rowCount?: number
  affectedRows?: number
  durationMs?: number
  error?: string
  ticket?: {
    id: number
    status: string
  }
}

export interface ExecutionHistoryEntry {
  id: number
  sql: string
  projectId: number
  projectName: string
  database: string
  timestamp: number
}

export interface TableContextMenuState {
  x: number
  y: number
  tableName: string
  projectId: number
  database: string
}
