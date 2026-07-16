import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface SqlExecutionRecord {
  id: string
  project_id: string
  status: string
  duration_ms: number
  row_count?: number
  affected_rows?: number
  error_message?: string
  created_at: string
}

export interface ColumnInfoData {
  name: string
  database_type?: string
  length?: number | null
  precision?: number | null
  scale?: number | null
  nullable?: boolean
  comment?: string
}

export interface QueryResultData {
  columns: ColumnInfoData[]
  rows: unknown[][]
  total: number
}

export interface ExecuteSqlResponse {
  mode: 'direct' | 'ticket'
  execution?: SqlExecutionRecord
  results?: QueryResultData[]
  message?: string
}

export interface ExecuteSqlInput {
  project_id: string
  sql: string
  database?: string
  selected_text?: string
}

export interface ProjectDatabasesResponse {
  databases: string[]
}

export interface DatabaseTableInfo {
  database: string
  schema?: string
  table: string
  type: string
}

export interface ProjectTablesResponse {
  tables: DatabaseTableInfo[]
}

export const useProjectDatabases = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project-databases', projectId],
    queryFn: () =>
      apiClient<ProjectDatabasesResponse>(`/projects/${projectId}/meta/databases`),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  })
}

export const useProjectTables = (projectId: string | undefined, database: string | undefined) => {
  return useQuery({
    queryKey: ['project-tables', projectId, database],
    queryFn: () =>
      apiClient<ProjectTablesResponse>(`/projects/${projectId}/meta/tables`, {
        query: { database },
      }),
    enabled: !!projectId && !!database,
    placeholderData: keepPreviousData,
  })
}

export interface ProjectColumnsResponse {
  columns: ColumnInfoData[]
}

export const useProjectColumns = (projectId: string | undefined, database: string | undefined, table: string | undefined) => {
  return useQuery({
    queryKey: ['project-columns', projectId, database, table],
    queryFn: () =>
      apiClient<ProjectColumnsResponse>(`/projects/${projectId}/meta/columns`, {
        query: { database, table },
      }),
    enabled: !!projectId && !!database && !!table,
    placeholderData: keepPreviousData,
  })
}

export const useExecuteSql = () => {
  return useMutation({
    mutationFn: (data: ExecuteSqlInput) =>
      apiClient<ExecuteSqlResponse>('/execute', {
        method: 'POST',
        body: data,
      }),
  })
}

export const useExecuteEscalated = () => {
  return useMutation({
    mutationFn: (data: ExecuteSqlInput) =>
      apiClient<ExecuteSqlResponse>('/execute/escalated', {
        method: 'POST',
        body: data,
      }),
  })
}
