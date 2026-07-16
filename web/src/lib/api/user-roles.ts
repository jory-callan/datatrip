import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface UserRole {
  id: string
  
  user_id: string
  role_id: string
}

export const useUserRoles = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => apiClient<UserRole[]>(`/users/${userId}/roles`),
    enabled: userId != null,
  })
}

export const useAssignRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiClient<UserRole>(`/users/${userId}/roles`, { method: 'POST', body: { role_id: roleId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] })
    },
  })
}

export const useUnassignRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiClient<null>(`/users/${userId}/roles/${roleId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] })
    },
  })
}
