import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface DatasourceRule {
  id: number
  name: string
  db_type: string
  category: string
  pattern: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface DatasourceRuleListParams {
  page: number
  pageSize: number
  needCount?: boolean
  keyword?: string
}

export interface DatasourceRuleListResponse {
  list: DatasourceRule[]
  total: number
  page: number
  page_size: number
}

export interface CreateDatasourceRuleInput {
  name: string
  db_type: string
  category: string
  pattern: string
  enabled?: boolean
}

export interface UpdateDatasourceRuleInput {
  id: number
  name: string
  db_type: string
  category: string
  pattern: string
  enabled?: boolean
}

export const useDatasourceRules = ({ page, pageSize, needCount = true, keyword }: DatasourceRuleListParams) => {
  return useQuery({
    queryKey: ['datasource-rules', page, pageSize, needCount, keyword ?? ''],
    queryFn: () => apiClient<DatasourceRuleListResponse>('/datasource-rules', {
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

export const useCreateDatasourceRule = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDatasourceRuleInput) => apiClient<DatasourceRule>('/datasource-rules', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasource-rules'] }),
  })
}

export const useUpdateDatasourceRule = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateDatasourceRuleInput) => apiClient<DatasourceRule>(`/datasource-rules/${id}`, {
      method: 'PUT',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasource-rules'] }),
  })
}
