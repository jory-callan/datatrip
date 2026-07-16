import { create } from 'zustand'

import type { Role } from '@/lib/api/roles'

export interface RoleForm {
  code: string
  name: string
  description: string
}

const defaultForm: RoleForm = {
  code: '',
  name: '',
  description: '',
}

interface RolesStore {
  // Dialogs
  createOpen: boolean
  editOpen: boolean
  editingID: string | null

  // Form
  form: RoleForm

  // Assign Permissions
  assignPermsOpen: boolean
  assignPermsRoleId: string | null
  assignPermSearch: string
  selectedPermId: string | null

  // Actions
  setCreateOpen: (open: boolean) => void
  setEditOpen: (open: boolean) => void
  openEdit: (role: Role) => void
  closeDialogs: () => void
  updateForm: <K extends keyof RoleForm>(key: K, value: RoleForm[K]) => void
  setForm: (form: RoleForm) => void
  resetForm: () => void
  openAssignPerms: (role: Role) => void
  closeAssignPerms: () => void
  setAssignPermSearch: (value: string) => void
  setSelectedPermId: (id: string | null) => void
}

export const useRolesStore = create<RolesStore>((set) => ({
  // Dialogs
  createOpen: false,
  editOpen: false,
  editingID: null,

  // Form
  form: { ...defaultForm },

  // Assign Permissions
  assignPermsOpen: false,
  assignPermsRoleId: null,
  assignPermSearch: '',
  selectedPermId: null,

  // Actions
  setCreateOpen: (open) => set({ createOpen: open }),

  setEditOpen: (open) => set({ editOpen: open }),

  openEdit: (role) => set({
    editingID: role.id,
    editOpen: true,
    form: {
      code: role.code,
      name: role.name,
      description: role.description ?? '',
    },
  }),

  closeDialogs: () => set({
    createOpen: false,
    editOpen: false,
    editingID: null,
    form: { ...defaultForm },
  }),

  updateForm: (key, value) => set((s) => ({
    form: { ...s.form, [key]: value },
  })),

  setForm: (form) => set({ form }),

  resetForm: () => set({ form: { ...defaultForm } }),

  openAssignPerms: (role) => set({
    assignPermsOpen: true,
    assignPermsRoleId: role.id,
    assignPermSearch: '',
    selectedPermId: null,
  }),

  closeAssignPerms: () => set({
    assignPermsOpen: false,
    assignPermsRoleId: null,
    assignPermSearch: '',
    selectedPermId: null,
  }),

  setAssignPermSearch: (value) => set({ assignPermSearch: value }),

  setSelectedPermId: (id) => set({ selectedPermId: id }),
}))
