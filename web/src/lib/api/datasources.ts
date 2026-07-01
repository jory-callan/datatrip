import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface Datasource {
  id: number
  name: string
  type: string
  host: string
  port: number
  username: string
  remark?: string
  status: string
  created_at: string
  updated_at: string
}

export interface DatasourceListParams {
  page: number
  pageSize: number
  needCount?: boolean
  keyword?: string
}

export interface DatasourceListResponse {
  list: Datasource[]
  total: number
  page: number
  page_size: number
}

export interface CreateDatasourceInput {
  name: string
  type: string
  host: string
  port: number
  username: string
  password: string
  database?: string
  remark?: string
}

export interface UpdateDatasourceInput {
  id: number
  name: string
  type: string
  host: string
  port: number
  username: string
  password?: string
  database?: string
  remark?: string
}

export const useDatasources = ({ page, pageSize, needCount = true, keyword }: DatasourceListParams) => {
  return useQuery({
    queryKey: ['datasources', page, pageSize, needCount, keyword ?? ''],
    queryFn: () => apiClient<DatasourceListResponse>('/datasources', {
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

export const useCreateDatasource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDatasourceInput) => apiClient<Datasource>('/datasources', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasources'] }),
  })
}

export const useUpdateDatasource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateDatasourceInput) => apiClient<Datasource>(`/datasources/${id}`, {
      method: 'PUT',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasources'] }),
  })
}

export const useTestDatasource = () => {
  return useMutation({
    mutationFn: (id: number) => apiClient<{ success: boolean; message: string }>(`/datasources/${id}/test`, {
      method: 'POST',
    }),
  })
}

export const useDeleteDatasource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient<null>(`/datasources/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasources'] }),
  })
}
