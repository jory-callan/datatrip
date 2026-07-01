import { useMutation, useQuery } from '@tanstack/react-query'

import type { CurrentUser } from '@/stores/app-store'

import { apiClient } from '../api-client'

export interface LoginInput {
  username: string
  password: string
}

export type User = CurrentUser

export interface AuthResponse {
  token: string
  user: User
}

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginInput) =>
      apiClient<AuthResponse>('/auth/login', { method: 'POST', body: data }),
  })
}

export const useMe = (enabled = true) => {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient<User>('/auth/me'),
    enabled,
    retry: false,
  })
}

export interface UpdateProfileInput {
  nickname?: string
  password?: string
}

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      apiClient<User>('/auth/profile', { method: 'PUT', body: data }),
  })
}
