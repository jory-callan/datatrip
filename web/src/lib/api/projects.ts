import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface DbProject {
  id: number
  name: string
  datasource_id: number
  databases: string[]
  approval_mode: string
  approver_ids: number[]
  auto_match_approver: boolean
  webhook_ids: number[]
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: string
  created_at: string
}

export interface ProjectListParams {
  page: number
  pageSize: number
  needCount?: boolean
  keyword?: string
}

export interface ProjectListResponse {
  list: DbProject[]
  total: number
  page: number
  page_size: number
}

export interface CreateProjectInput {
  name: string
  datasource_id: number
  databases: string[]
  approval_mode: string
  approver_ids: number[]
  auto_match_approver?: boolean
  webhook_ids: number[]
}

export interface UpdateProjectInput {
  id: number
  name: string
  datasource_id: number
  databases: string[]
  approval_mode: string
  approver_ids: number[]
  auto_match_approver?: boolean
  webhook_ids: number[]
}

export interface UpdateProjectMembersInput {
  projectId: number
  members: { user_id: number; role: string }[]
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
    mutationFn: (data: CreateProjectInput) => apiClient<DbProject>('/projects', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProjectInput) => apiClient<DbProject>(`/projects/${id}`, {
      method: 'PUT',
      body: data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient<null>(`/projects/${id}`, { method: 'DELETE' }),
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

export const useProjectMembers = (projectId: number | null) => {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => apiClient<ProjectMember[]>(`/projects/${projectId}/members`),
    enabled: projectId != null,
  })
}
