import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'
import type { User } from './auth'

export const USER_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000, 2000]

export interface UserListParams {
  page: number
  pageSize: number
  needCount?: boolean
  keyword?: string
  status?: string
}

export interface UserListResponse {
  list: User[]
  total: number
  page: number
  page_size: number
}

export interface CreateUserInput {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
  status?: string
}

export interface UpdateUserInput {
  id: string
  password?: string
  nickname?: string
  email?: string
  phone?: string
  status?: string
}

export const useUsers = ({ page, pageSize, needCount = true, keyword, status }: UserListParams) => {
  return useQuery({
    queryKey: ['users', page, pageSize, needCount, keyword ?? '', status ?? ''],
    queryFn: () => apiClient<UserListResponse>('/users', {
      query: {
        page,
        page_size: pageSize,
        need_count: String(needCount),
        ...(keyword ? { keyword } : {}),
        ...(status ? { status } : {}),
      },
    }),
    placeholderData: keepPreviousData,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserInput) => apiClient<User>('/users', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateUserInput) => apiClient<User>(`/users/${id}`, {
      method: 'PUT',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient<null>(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useBatchDeleteUsers = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => apiClient<null>('/users/batch', {
      method: 'DELETE',
      body: { ids },
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export type { User }
