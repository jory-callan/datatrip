import { useCallback, useEffect, useMemo, useState } from 'react'

import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import {
  type CreateProjectInput,
  type DbProject,
  useCreateProject,
  useDatasources,
  useDeleteProject,
  useProjectMembers,
  useProjects,
  useUpdateProject,
  useUpdateProjectMembers,
  type UpdateProjectInput,
} from '@/lib/api'
import { useUsers } from '@/lib/api/users'
import { useWebhooks } from '@/lib/api/webhooks'

const defaultForm: CreateProjectInput = {
  name: '',
  datasource_id: 0,
  databases: [],
  approval_mode: 'any_one',
  approver_ids: [],
  auto_match_approver: false,
  webhook_ids: [],
}

export const ROLES = [
  { value: 'viewer', label: 'Viewer\uff08\u53ea\u8bfb\uff09' },
  { value: 'developer', label: 'Developer\uff08\u8bfb\u5199+\u5de5\u5355\uff09' },
  { value: 'project_owner', label: 'Project Owner\uff08\u7ba1\u7406\uff09' },
]

export function useProjectsPage() {

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [membersProjectId, setMembersProjectId] = useState<number | null>(null)
  const [editingID, setEditingID] = useState<number | null>(null)
  const [form, setForm] = useState<CreateProjectInput>(defaultForm)
  const [membersForm, setMembersForm] = useState<{ user_id: number; role: string }[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [addUserId, setAddUserId] = useState<number>(0)
  const [addUserRole, setAddUserRole] = useState('viewer')
  const [activeTab, setActiveTab] = useState('basic')
  const needCount = true
  const query = useProjects({ page, pageSize, needCount })
  const { data, refetch } = query
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const deleteMutation = useDeleteProject()
  const updateMembersMutation = useUpdateProjectMembers()
  const datasourcesQuery = useDatasources({ page: 1, pageSize: 100, needCount: false })
  const usersQuery = useUsers({ page: 1, pageSize: 200, needCount: false })
  const webhooksQuery = useWebhooks({ page: 1, pageSize: 100, needCount: false })
  const membersQuery = useProjectMembers(membersProjectId)

  const datasources = datasourcesQuery.data?.list ?? []
  const users = usersQuery.data?.list ?? []
  const webhookList = webhooksQuery.data?.list ?? []
  const existingMembers = membersQuery.data ?? []

  const resetForm = () => {
    setForm(defaultForm)
    setActiveTab('basic')
  }

  const handleCreate = async () => {
    if (!form.name || !form.datasource_id) {
      toast.error('请填写必填字段')
      return
    }
    const normalDatabases = form.databases.flatMap(s => s.split(/[,，]/).map(x => x.trim()).filter(Boolean))
    try {
      await createMutation.mutateAsync({ ...form, databases: normalDatabases })
      toast.success('项目创建成功')
      setCreateOpen(false)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '项目创建失败'))
    }
  }

  const openEdit = useCallback((proj: DbProject) => {
    setEditingID(Number(proj.id))
    setForm({
      name: proj.name,
      datasource_id: proj.datasource_id,
      databases: proj.databases ?? [],
      approval_mode: proj.approval_mode || 'any_one',
      approver_ids: proj.approver_ids ?? [],
      auto_match_approver: proj.auto_match_approver ?? false,
      webhook_ids: proj.webhook_ids ?? [],
    })
    setActiveTab('basic')
    setEditOpen(true)
  }, [])

  const handleUpdate = async () => {
    if (!editingID) return
    if (!form.name) {
      toast.error('请填写必填字段')
      return
    }
    const normalDatabases = form.databases.flatMap(s => s.split(/[,，]/).map(x => x.trim()).filter(Boolean))
    try {
      const payload: UpdateProjectInput = { id: editingID, ...form, databases: normalDatabases }
      await updateMutation.mutateAsync(payload)
      toast.success('项目更新成功')
      setEditOpen(false)
      setEditingID(null)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '项目更新失败'))
    }
  }

  const handleDelete = useCallback(async (proj: DbProject) => {
    if (!window.confirm(`确认删除项目 ${proj.name}？`)) return
    try {
      await deleteMutation.mutateAsync(Number(proj.id))
      toast.success('项目删除成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '项目删除失败'))
    }
  }, [deleteMutation])

  const openMembers = useCallback((proj: DbProject) => {
    setMembersProjectId(Number(proj.id))
    setMembersForm([])
    setSelectedMemberIds([])
    setAddUserId(0)
    setAddUserRole('viewer')
  }, [])

  // Load existing members into membersForm when data arrives
  useEffect(() => {
    if (membersProjectId && existingMembers.length > 0) {
      setMembersForm(existingMembers.map((em) => ({ user_id: em.user_id, role: em.role })))
    }
  }, [membersProjectId, existingMembers])

  const closeMembers = useCallback(() => {
    setMembersProjectId(null)
    setMembersForm([])
    setSelectedMemberIds([])
  }, [])

  const handleAddMember = () => {
    if (!addUserId) {
      toast.error('\u8bf7\u9009\u62e9\u7528\u6237')
      return
    }
    if (membersForm.some((m) => m.user_id === addUserId)) {
      toast.error('\u8be5\u7528\u6237\u5df2\u662f\u6210\u5458')
      return
    }
    setMembersForm((prev) => [...prev, { user_id: addUserId, role: addUserRole }])
    setAddUserId(0)
    setAddUserRole('viewer')
  }

  const removeMember = (userId: number) => {
    setMembersForm((prev) => prev.filter((m) => m.user_id !== userId))
  }

  const changeRole = (userId: number, role: string) => {
    setMembersForm((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role } : m)))
  }

  const toggleMemberSelect = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const toggleSelectAll = () => {
    setSelectedMemberIds((prev) =>
      prev.length === combinedMembers.length ? [] : combinedMembers.map((m) => m.user_id),
    )
  }

  const handleSaveMembers = async () => {
    if (!membersProjectId) return
    try {
      await updateMembersMutation.mutateAsync({ projectId: membersProjectId, members: membersForm })
      toast.success('成员更新成功')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '成员更新失败'))
    }
  }

  // When sheet is open, use membersForm as the single source of truth
  const combinedMembers = membersForm

  const userMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const u of users) {
      map.set(Number(u.id), u.nickname || u.username)
    }
    return map
  }, [users])

  const datasourceOptions = useMemo(
    () => datasources.map((ds) => ({ value: String(ds.id), label: ds.name })),
    [datasources],
  )

  const webhookOptions = useMemo(
    () => webhookList.map((w) => ({ value: String(w.id), label: w.name })),
    [webhookList],
  )

  const userOptions = useMemo(
    () => users
      .filter((u) => !combinedMembers.some((m) => m.user_id === Number(u.id)))
      .map((u) => ({ value: String(u.id), label: u.nickname || u.username })),
    [users, combinedMembers],
  )

  return {
    page, setPage, pageSize, setPageSize,
    createOpen, setCreateOpen, editOpen, setEditOpen,
    membersProjectId, editingID, setEditingID,
    form, setForm, membersForm, setMembersForm,
    addUserId, setAddUserId, addUserRole, setAddUserRole,
    activeTab, setActiveTab, needCount,
    query, data, refetch,
    datasources, users, webhookList,
    existingMembers, combinedMembers, userMap,
    datasourceOptions, webhookOptions, userOptions,
    createMutation, updateMutation, deleteMutation, updateMembersMutation,
    handleCreate, handleUpdate, handleDelete,
    openEdit, openMembers, closeMembers,
    handleAddMember, removeMember, changeRole,
    handleSaveMembers, resetForm,
    selectedMemberIds, setSelectedMemberIds, toggleMemberSelect, toggleSelectAll,
  }
}
