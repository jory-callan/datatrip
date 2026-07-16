import { create } from 'zustand'

import type { DataProject } from '@/lib/api/projects'

export interface MemberFormItem {
  user_id: string
  role: string
}

export interface ProjectForm {
  name: string
  datasource_id: string
  scope: string[]
  approval_mode: string
  webhook_ids: string[]
}

const defaultForm: ProjectForm = {
  name: '',
  datasource_id: '',
  scope: [],
  approval_mode: 'any_one',
  webhook_ids: [],
}

export const ROLES = [
  { value: 'viewer', label: 'Viewer（只读）' },
  { value: 'developer', label: 'Developer（读写+工单）' },
  { value: 'approver', label: 'Approver（审批人）' },
  { value: 'admin', label: 'Admin（项目管理员）' },
]

interface ProjectStore {
  // Dialogs
  createOpen: boolean
  editOpen: boolean
  editingID: string | null

  // Form
  form: ProjectForm
  activeTab: string

  // Members sheet
  membersProjectId: string | null
  membersForm: MemberFormItem[]
  addUserId: string
  addUserRole: string
  selectedMemberIds: string[]

  // Actions
  setCreateOpen: (open: boolean) => void
  setEditOpen: (open: boolean) => void
  openEdit: (proj: DataProject) => void
  closeDialogs: () => void
  setForm: (form: ProjectForm) => void
  updateForm: <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => void
  resetForm: () => void
  setActiveTab: (tab: string) => void

  // Members actions
  openMembers: (proj: DataProject) => void
  closeMembers: () => void
  setMembersForm: (form: MemberFormItem[]) => void
  setAddUserId: (id: string) => void
  setAddUserRole: (role: string) => void
  addMember: () => boolean
  removeMember: (userId: string) => void
  changeRole: (userId: string, role: string) => void
  setSelectedMemberIds: (ids: string[]) => void
  toggleMemberSelect: (userId: string) => void
  toggleSelectAll: (allIds: string[]) => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Dialogs
  createOpen: false,
  editOpen: false,
  editingID: null,

  // Form
  form: { ...defaultForm },
  activeTab: 'basic',

  // Members sheet
  membersProjectId: null,
  membersForm: [],
  addUserId: '',
  addUserRole: 'viewer',
  selectedMemberIds: [],

  // Actions
  setCreateOpen: (open) => set({ createOpen: open }),
  setEditOpen: (open) => set({ editOpen: open }),

  openEdit: (proj) => set({
    editingID: proj.id,
    editOpen: true,
    form: {
      name: proj.name,
      datasource_id: proj.datasource_id,
      scope: proj.scope ?? [],
      approval_mode: proj.approval_mode || 'any_one',
      webhook_ids: proj.webhook_ids ?? [],
    },
    activeTab: 'basic',
  }),

  closeDialogs: () => set({
    createOpen: false,
    editOpen: false,
    editingID: null,
    form: { ...defaultForm },
    activeTab: 'basic',
  }),

  setForm: (form) => set({ form }),
  updateForm: (key, value) => set((s) => ({
    form: { ...s.form, [key]: value },
  })),

  resetForm: () => set({ form: { ...defaultForm }, activeTab: 'basic' }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Members actions
  openMembers: (proj) => set({
    membersProjectId: proj.id,
    membersForm: [],
    selectedMemberIds: [],
    addUserId: '',
    addUserRole: 'viewer',
  }),

  closeMembers: () => set({
    membersProjectId: null,
    membersForm: [],
    selectedMemberIds: [],
    addUserId: '',
    addUserRole: 'viewer',
  }),

  setMembersForm: (form) => set({ membersForm: form }),
  setAddUserId: (id) => set({ addUserId: id }),
  setAddUserRole: (role) => set({ addUserRole: role }),

  addMember: () => {
    const { addUserId, membersForm, addUserRole } = get()
    if (!addUserId) return false
    if (membersForm.some((m) => m.user_id === addUserId)) return false
    set({
      membersForm: [...membersForm, { user_id: addUserId, role: addUserRole }],
      addUserId: '',
      addUserRole: 'viewer',
    })
    return true
  },

  removeMember: (userId) => set((s) => ({
    membersForm: s.membersForm.filter((m) => m.user_id !== userId),
  })),

  changeRole: (userId, role) => set((s) => ({
    membersForm: s.membersForm.map((m) =>
      m.user_id === userId ? { ...m, role } : m,
    ),
  })),

  setSelectedMemberIds: (ids) => set({ selectedMemberIds: ids }),

  toggleMemberSelect: (userId) => set((s) => ({
    selectedMemberIds: s.selectedMemberIds.includes(userId)
      ? s.selectedMemberIds.filter((id) => id !== userId)
      : [...s.selectedMemberIds, userId],
  })),

  toggleSelectAll: (allIds) => set((s) => ({
    selectedMemberIds:
      s.selectedMemberIds.length === allIds.length ? [] : [...allIds],
  })),
}))
