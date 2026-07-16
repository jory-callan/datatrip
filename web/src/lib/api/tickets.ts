import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'
import type { AuditLog } from './audits'

export interface Ticket {
  id: string
  project_id: string
  applicant_id: string
  title: string
  description: string
  instruction_json: string
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'executed' | 'execute_failed'
  approval_mode: 'any_one' | 'all'
  execution_status?: string
  execution_error?: string
  executed_at?: string
  created_at: string
}

export interface ApprovalRecord {
  id: string
  ticket_id: string
  approver_id: string
  action: 'approved' | 'rejected' | 'urged'
  comment?: string
  created_at: string
}

export interface TicketDetail {
  ticket: Ticket
  approvals: ApprovalRecord[]
  audits: AuditLog[]
}

export interface TicketListParams {
  page: number
  pageSize: number
  needCount?: boolean
  scope?: 'my' | 'pending' | 'all'
  status?: string
  project_id?: number
}

export interface TicketListResponse {
  list: Ticket[]
  total: number
  page: number
  page_size: number
}

export const useTickets = ({ page, pageSize, needCount = true, scope, status, project_id }: TicketListParams) => {
  return useQuery({
    queryKey: ['tickets', page, pageSize, needCount, scope ?? '', status ?? '', project_id ?? ''],
    queryFn: () => apiClient<TicketListResponse>('/tickets', {
      query: {
        page,
        page_size: pageSize,
        need_count: String(needCount),
        ...(scope ? { scope } : {}),
        ...(status ? { status } : {}),
        ...(project_id ? { project_id: String(project_id) } : {}),
      },
    }),
    placeholderData: keepPreviousData,
  })
}

export const useTicketDetail = (id: string | null) => {
  return useQuery({
    queryKey: ['ticket-detail', id],
    queryFn: () => apiClient<TicketDetail>(`/tickets/${id}`),
    enabled: id != null,
  })
}

export const useCreateTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { project_id: string; instruction_json: string; title?: string; description?: string }) =>
      apiClient<Ticket>('/tickets', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export const useApproveTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      apiClient<null>(`/tickets/${id}/approve`, {
        method: 'POST',
        body: { comment },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket-detail'] })
    },
  })
}

export const useRejectTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      apiClient<null>(`/tickets/${id}/reject`, {
        method: 'POST',
        body: { comment },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket-detail'] })
    },
  })
}

export const useUrgeTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<Ticket>(`/tickets/${id}/urge`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-detail'] })
    },
  })
}

export const useResubmitTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; project_id: string; instruction_json: string; title?: string; description?: string }) =>
      apiClient<Ticket>(`/tickets/${id}/resubmit`, {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
