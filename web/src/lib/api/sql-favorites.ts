import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface SqlFavorite {
  id: number
  user_id: number
  name: string
  sql: string
  scope: 'personal' | 'team'
  project_id: number
  database: string
  created_at: string
  updated_at: string
}

export interface CreateFavoriteInput {
  name: string
  sql: string
  scope?: 'personal' | 'team'
  project_id?: number
  database?: string
}

export const useMyFavorites = () => {
  return useQuery({
    queryKey: ['sql-favorites', 'my'],
    queryFn: () => apiClient<SqlFavorite[]>('/sql-favorites/my'),
    placeholderData: keepPreviousData,
  })
}

export const useCreateFavorite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFavoriteInput) => apiClient<SqlFavorite>('/sql-favorites', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sql-favorites'] }),
  })
}

export const useDeleteFavorite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient<null>(`/sql-favorites/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sql-favorites'] }),
  })
}
