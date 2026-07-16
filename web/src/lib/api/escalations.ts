import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface Escalation {
  id: string
  user_id: string
  project_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  expires_at?: string
  approved_by?: string
  approved_at?: string
  created_at: string
}

export interface EscalationListParams {
  page: number
  pageSize: number
  needCount?: boolean
  scope?: 'my' | 'pending' | 'all'
  project_id?: string
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
        ...(project_id ? { project_id } : {}),
        ...(status ? { status } : {}),
      },
    }),
    placeholderData: keepPreviousData,
  })
}

export const useActiveEscalation = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['escalation-active', projectId],
    queryFn: () => apiClient<ActiveEscalationResponse>(`/escalations/active`, {
      query: { project_id: projectId! },
    }),
    enabled: !!projectId,
  })
}

export const useCreateEscalation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { project_id: string; reason: string }) =>
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
    mutationFn: ({ id, duration }: { id: string; duration?: string }) =>
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
    mutationFn: ({ id }: { id: string }) =>
      apiClient<Escalation>(`/escalations/${id}/reject`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
      queryClient.invalidateQueries({ queryKey: ['escalation-active'] })
    },
  })
}

export const useUpdateEscalation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient<Escalation>(`/escalations/${id}`, {
        method: 'PUT',
        body: { reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
    },
  })
}

export const useDeleteEscalation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<null>(`/escalations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
      queryClient.invalidateQueries({ queryKey: ['escalation-active'] })
    },
  })
}

export const useBatchDeleteEscalations = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiClient<null>('/escalations/batch', {
        method: 'DELETE',
        body: { ids },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] })
      queryClient.invalidateQueries({ queryKey: ['escalation-active'] })
    },
  })
}
