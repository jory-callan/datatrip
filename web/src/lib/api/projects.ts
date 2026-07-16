import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface DataProject {
  id: string
  name: string
  datasource_id: string
  scope: string[]
  approval_mode: string
  webhook_ids: string[]
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  created_at: string
  updated_at: string
}

export interface ProjectListParams {
  page: number
  pageSize: number
  needCount?: boolean
  keyword?: string
}

export interface ProjectListResponse {
  list: DataProject[]
  total: number
  page: number
  page_size: number
}

export interface CreateProjectInput {
  name: string
  datasource_id: string
  scope?: string[]
  approval_mode?: string
  webhook_ids?: string[]
}

export interface UpdateProjectInput {
  id: string
  name?: string
  scope?: string[]
  approval_mode?: string
  webhook_ids?: string[]
}

export interface UpdateProjectMembersInput {
  projectId: string
  members: { user_id: string; role: string }[]
}

export const useProjects = ({ page, pageSize, needCount = true, keyword }: ProjectListParams) => {
  return useQuery({
    queryKey: ['projects', page, pageSize, needCount, keyword ?? ''],
    queryFn: () => apiClient<ProjectListResponse>('/projects', {
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

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectInput) => apiClient<DataProject>('/projects', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProjectInput) => apiClient<DataProject>(`/projects/${id}`, {
      method: 'PUT',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient<null>(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export const useUpdateProjectMembers = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, members }: UpdateProjectMembersInput) =>
      apiClient<null>(`/projects/${projectId}/members`, {
        method: 'PUT',
        body: { members },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] })
    },
  })
}

export const useProjectMembers = (projectId: string | null) => {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => apiClient<ProjectMember[]>(`/projects/${projectId}/members`),
    enabled: projectId != null,
  })
}

export const useBatchDeleteProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => apiClient<null>('/projects/batch-delete', {
      method: 'POST',
      body: { ids },
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}
