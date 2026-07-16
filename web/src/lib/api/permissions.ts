import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface Permission {
  id: string
  
  code: string
  name: string
  description?: string
  module?: string
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface PermissionListParams {
  module?: string
}

export const usePermissions = (params?: PermissionListParams) => {
  return useQuery({
    queryKey: ['permissions', params?.module ?? ''],
    queryFn: () => apiClient<Permission[]>('/permissions', {
      query: params?.module ? { module: params.module } : undefined,
    }),
  })
}

export const useCreatePermission = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { code: string; name: string; description?: string; module?: string }) =>
      apiClient<Permission>('/permissions', { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] }),
  })
}

export const useUpdatePermission = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; module?: string }) =>
      apiClient<Permission>(`/permissions/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] }),
  })
}

export const useDeletePermission = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient<null>(`/permissions/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] }),
  })
}

// ---- Permission bindings ----

export interface PermissionBindingRole {
  id: string
  code: string
  name: string
}

export interface PermissionBindingUser {
  id: string
  username: string
  nickname: string
}

export interface PermissionBindings {
  permission: Permission
  roles: PermissionBindingRole[]
  users: PermissionBindingUser[]
}

export const usePermissionBindings = (id: string | null) => {
  return useQuery({
    queryKey: ['permission-bindings', id],
    queryFn: () => apiClient<PermissionBindings>(`/permissions/${id}/bindings`),
    enabled: id != null,
  })
}
