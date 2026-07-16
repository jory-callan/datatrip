import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface Role {
  id: string
  
  code: string
  name: string
  description?: string
  is_system: boolean
  created_at: string
  updated_at: string
}

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => apiClient<Role[]>('/roles'),
  })
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { code: string; name: string; description?: string }) =>
      apiClient<Role>('/roles', { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string }) =>
      apiClient<Role>(`/roles/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient<null>(`/roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}
