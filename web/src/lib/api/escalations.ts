import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface Escalation {
  id: number
  user_id: number
  project_id: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  expires_at: string
  approved_by?: number
  approved_at?: string
  created_at: string
}

export interface EscalationListParams {
  page: number
  pageSize: number
  needCount?: boolean
  scope?: 'my' | 'pending' | 'all'
  project_id?: number
  status?: string
}

export interface EscalationListResponse {
  list: Escalation[]
  total: number
  page: number
  page_size: number
}

export interface ActiveEscalationResponse {
  active: boolean
  escalation?: Escalation
  expires_at?: string
}

export const useEscalations = ({ page, pageSize, needCount = true, scope, project_id, status }: EscalationListParams) => {
  return useQuery({
    queryKey: ['escalations', page, pageSize, needCount, scope ?? '', project_id ?? '', status ?? ''],
    queryFn: () => apiClient<EscalationListResponse>('/escalations', {
      query: {
        page,
        page_size: pageSize,
        need_count: String(needCount),
        ...(scope ? { scope } : {}),
        ...(project_id ? { project_id: String(project_id) } : {}),
        ...(status ? { status } : {}),
      },
    }),
    placeholderData: keepPreviousData,
  })
}

export const useActiveEscalation = (projectId: number | undefined) => {
  return useQuery({
    queryKey: ['escalation-active', projectId],
    queryFn: () => apiClient<ActiveEscalationResponse>(`/escalations/active`, {
      query: { project_id: String(projectId!) },
    }),
    enabled: !!projectId,
  })
}

export const useCreateEscalation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { project_id: number; reason: string }) =>
      apiClient<Escalation>('/escalations', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
      queryClient.invalidateQueries({ queryKey: ['escalation-active'] })
    },
  })
}

export const useApproveEscalation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, duration }: { id: number; duration?: string }) =>
      apiClient<Escalation>(`/escalations/${id}/approve`, {
        method: 'POST',
        body: { duration },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
      queryClient.invalidateQueries({ queryKey: ['escalation-active'] })
    },
  })
}

export const useRejectEscalation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiClient<Escalation>(`/escalations/${id}/reject`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
      queryClient.invalidateQueries({ queryKey: ['escalation-active'] })
    },
  })
}
