import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface AuditLog {
  id: string
  actor_id: string
  project_id: string
  datasource_id: string
  action: string
  raw_text: string
  instruction_json: string
  classification: string
  status: string
  duration_ms: number
  error_message?: string
  ticket_id?: string
  ip: string
  created_at: string
}

export interface AuditListParams {
  page: number
  pageSize: number
  needCount?: boolean
  actor_id?: string
  project_id?: string
  datasource_id?: string
  action?: string
  status?: string
  classification?: string
  start_time?: string
  end_time?: string
}

export interface AuditListResponse {
  list: AuditLog[]
  total: number
  page: number
  page_size: number
}

export const useAudits = ({ page, pageSize, needCount = true, actor_id, project_id, datasource_id, action, status, classification, start_time, end_time }: AuditListParams) => {
  return useQuery({
    queryKey: ['audits', page, pageSize, needCount, actor_id ?? '', project_id ?? '', datasource_id ?? '', action ?? '', status ?? '', classification ?? '', start_time ?? '', end_time ?? ''],
    queryFn: () => apiClient<AuditListResponse>('/audits', {
      query: {
        page,
        page_size: pageSize,
        need_count: String(needCount),
        ...(actor_id ? { actor_id } : {}),
        ...(project_id ? { project_id } : {}),
        ...(datasource_id ? { datasource_id } : {}),
        ...(action ? { action } : {}),
        ...(status ? { status } : {}),
        ...(classification ? { classification } : {}),
        ...(start_time ? { start_time } : {}),
        ...(end_time ? { end_time } : {}),
      },
    }),
    placeholderData: keepPreviousData,
  })
}
