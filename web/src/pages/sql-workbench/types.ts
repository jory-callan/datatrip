export interface EditorTab {
  id: number
  title: string
  sql: string
  projectId?: string
  database?: string
}

export interface ColumnInfo {
  name: string
  database_type?: string
  length?: number | null
  precision?: number | null
  scale?: number | null
  nullable?: boolean
  comment?: string
}

export interface ResultTab {
  id: number
  title: string
  sql?: string
  columns?: ColumnInfo[]
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

export interface TableContextMenuState {
  x: number
  y: number
  tableName: string
  projectId: string
  database: string
}
