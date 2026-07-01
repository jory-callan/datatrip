import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface Role {
  id: number
  role_code: string
  name: string
  created_at: string
  updated_at: string
}

export interface RoleListParams {
  page: number
  pageSize: number
  needCount?: boolean
  keyword?: string
}

export interface RoleListResponse {
  list: Role[]
  total: number
  page: number
  page_size: number
}

export interface CreateRoleInput {
  role_code: string
  name: string
}

export interface UpdateRoleInput {
  id: number
  role_code: string
  name: string
}

export const useRoles = ({ page, pageSize, needCount = true, keyword }: RoleListParams) => {
  return useQuery({
    queryKey: ['roles', page, pageSize, needCount, keyword ?? ''],
    queryFn: () => apiClient<RoleListResponse>('/roles', {
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

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRoleInput) => apiClient<Role>('/roles', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateRoleInput) => apiClient<Role>(`/roles/${id}`, {
      method: 'PUT',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient<null>(`/roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export const useBatchDeleteRoles = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => apiClient<null>('/roles/batch', {
      method: 'DELETE',
      body: { ids },
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}
