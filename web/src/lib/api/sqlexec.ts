import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface SqlExecution {
  id: number
  project_id: number
  sql: string
  statements: string
  classification: string
  status: string
  row_count: number
  affected_rows: number
  duration_ms: number
}

export interface QueryResultData {
  columns: string[]
  rows: unknown[][]
  total: number
}

export interface ExecuteSqlResponse {
  mode: 'direct' | 'ticket'
  execution?: SqlExecution
  results?: QueryResultData[]
  message?: string
}

export interface ExecuteSqlInput {
  project_id: number
  database: string
  sql: string
  selected_text?: string
}

export interface DatabaseInfo {
  database: string
  schema?: string
  table: string
  type: string
}

export interface ProjectDatabasesResponse {
  databases: string[]
}

export interface ProjectTablesResponse {
  tables: DatabaseInfo[]
}

export const useProjectDatabases = (projectId: number | undefined) => {
  return useQuery({
    queryKey: ['project-databases', projectId],
    queryFn: () =>
      apiClient<ProjectDatabasesResponse>(`/projects/${projectId}/meta/databases`),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  })
}

export const useProjectTables = (projectId: number | undefined, database: string | undefined) => {
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

export const useExecuteSql = () => {
  return useMutation({
    mutationFn: (data: ExecuteSqlInput) =>
      apiClient<ExecuteSqlResponse>('/sql/execute', {
        method: 'POST',
        body: data,
      }),
  })
}

export const useExecuteEscalated = () => {
  return useMutation({
    mutationFn: (data: ExecuteSqlInput) =>
      apiClient<ExecuteSqlResponse>('/sql/execute/escalated', {
        method: 'POST',
        body: data,
      }),
  })
}
