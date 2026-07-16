import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface DashboardStats {
  project_count: number
  datasource_count: number
  today_exec_count: number
  pending_ticket_count: number
  recent_executions: {
    id: string
    project_id: string
    project_name: string
    sql: string
    classification: string
    status: string
    duration_ms: number
    created_at: string
  }[]
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient<DashboardStats>('/dashboard/stats'),
    placeholderData: keepPreviousData,
  })
}
