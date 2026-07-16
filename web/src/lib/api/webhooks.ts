import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WebhookListParams {
  page: number
  pageSize: number
  needCount?: boolean
  keyword?: string
}

export interface WebhookListResponse {
  list: Webhook[]
  total: number
  page: number
  page_size: number
}

export interface CreateWebhookInput {
  name: string
  url: string
  events: string[]
  is_active?: boolean
}

export interface UpdateWebhookInput {
  id: string
  name?: string
  url?: string
  events?: string[]
  is_active?: boolean
}

export interface DeliveryLog {
  id: string
  webhook_id: string
  event: string
  url: string
  status: string
  status_code: number
  duration_ms: number
  error_msg: string
  created_at: string
}

export interface DeliveryLogResponse {
  list: DeliveryLog[]
  total: number
  page: number
  page_size: number
}

export const WEBHOOK_EVENTS = [
  'ticket.created',
  'ticket.approved',
  'ticket.partially_approved',
  'ticket.rejected',
  'ticket.executed',
  'ticket.execution_failed',
  'ticket.urged',
  'escalation.created',
  'escalation.approved',
  'escalation.rejected',
]

export const useWebhooks = ({ page, pageSize, needCount = true, keyword }: WebhookListParams) => {
  return useQuery({
    queryKey: ['webhooks', page, pageSize, needCount, keyword ?? ''],
    queryFn: () => apiClient<WebhookListResponse>('/webhooks', {
      query: {
        page,
        page_size: pageSize,
        need_count: String(needCount),
        ...(keyword ? { keyword } : {}),
      },
    }),
    placeholderData: keepPreviousData,
  })
}

export const useCreateWebhook = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateWebhookInput) => apiClient<Webhook>('/webhooks', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export const useUpdateWebhook = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateWebhookInput) => apiClient<Webhook>(`/webhooks/${id}`, {
      method: 'PUT',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export const useWebhookDeliveryLogs = (webhookId: string, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['webhook-delivery-logs', webhookId, page, pageSize],
    queryFn: () => apiClient<DeliveryLogResponse>(`/webhooks/${webhookId}/delivery-logs`, {
      query: { page: String(page), page_size: String(pageSize) },
    }),
    enabled: !!webhookId,
    placeholderData: keepPreviousData,
  })
}
