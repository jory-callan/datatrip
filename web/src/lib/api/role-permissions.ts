import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface RolePermission {
  id: string
  
  role_id: string
  permission_id: string
}

export const useRolePermissions = (roleId: string | null) => {
  return useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => apiClient<RolePermission[]>(`/roles/${roleId}/permissions`),
    enabled: roleId != null,
  })
}

export const useAssignPermission = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      apiClient<RolePermission>(`/roles/${roleId}/permissions`, { method: 'POST', body: { permission_id: permissionId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
    },
  })
}

export const useUnassignPermission = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      apiClient<null>(`/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
    },
  })
}
