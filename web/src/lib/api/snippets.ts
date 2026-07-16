import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface Snippet {
  id: string
  user_id: string
  name: string
  content: string
  datasource_type: string
  created_at: string
  updated_at: string
}

export interface CreateSnippetInput {
  name: string
  content: string
  datasource_type: string
}

export const useMySnippets = () => {
  return useQuery({
    queryKey: ['snippets', 'my'],
    queryFn: () => apiClient<Snippet[]>('/snippets/my'),
    placeholderData: keepPreviousData,
  })
}

export const useCreateSnippet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSnippetInput) => apiClient<Snippet>('/snippets', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['snippets'] }),
  })
}

export const useDeleteSnippet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient<null>(`/snippets/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['snippets'] }),
  })
}

export const useUpdateSnippet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CreateSnippetInput>) =>
      apiClient<Snippet>(`/snippets/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['snippets'] }),
  })
}
