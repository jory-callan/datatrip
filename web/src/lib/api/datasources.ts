import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface Datasource {
  id: string
  name: string
  type: string
  type_group: string
  host: string
  port: number
  username: string
  remark?: string
  password_saved: boolean
  status: string
  created_at: string
  updated_at: string
}

export interface DatasourceTypeInfo {
  type: string
  label: string
}

export interface DatasourceTypeGroup {
  group: string
  label: string
  types: DatasourceTypeInfo[]
}

export type DatasourceTypesResponse = DatasourceTypeGroup[]

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
  remark?: string
}

export interface UpdateDatasourceInput {
  id: string
  name?: string
  type?: string
  host?: string
  port?: number
  username?: string
  password?: string
  remark?: string
}

export interface BatchDeleteRequest {
  ids: string[]
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

export const useDatasourceTypes = () => {
  return useQuery({
    queryKey: ['datasource-types'],
    queryFn: () => apiClient<DatasourceTypesResponse>('/datasource-types'),
    staleTime: 24 * 60 * 60 * 1000,
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
    mutationFn: (id: string) => apiClient<{ success: boolean; message: string }>(`/datasources/${id}/test`, {
      method: 'POST',
    }),
  })
}

export const useDeleteDatasource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient<null>(`/datasources/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasources'] }),
  })
}

export const useBatchDeleteDatasource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => apiClient<null>('/datasources/batch-delete', {
      method: 'POST',
      body: { ids },
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasources'] }),
  })
}
