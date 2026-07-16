import { create } from 'zustand'

import type { Permission } from '@/lib/api/permissions'

export interface PermFormData {
  code: string
  name: string
  module: string
  description: string
}

const defaultForm: PermFormData = {
  code: '',
  name: '',
  module: '',
  description: '',
}

interface PermStore {
  // Dialogs
  createOpen: boolean
  editOpen: boolean
  editingID: string | null
  viewBindingsOpen: boolean
  viewingPermId: string | null

  // Form
  form: PermFormData

  // Actions
  setCreateOpen: (open: boolean) => void
  setEditOpen: (open: boolean) => void
  openEdit: (perm: Permission) => void
  setViewBindingsOpen: (open: boolean) => void
  openViewBindings: (perm: Permission) => void
  closeDialogs: () => void
  updateForm: <K extends keyof PermFormData>(key: K, value: PermFormData[K]) => void
  setForm: (form: PermFormData) => void
  resetForm: () => void
}

export const usePermStore = create<PermStore>((set) => ({
  // Dialogs
  createOpen: false,
  editOpen: false,
  editingID: null,
  viewBindingsOpen: false,
  viewingPermId: null,

  // Form
  form: { ...defaultForm },

  // Actions
  setCreateOpen: (open) => set({ createOpen: open }),

  setEditOpen: (open) => set({ editOpen: open }),

  openEdit: (perm) => set({
    editingID: perm.id,
    editOpen: true,
    form: {
      code: perm.code,
      name: perm.name,
      module: perm.module ?? '',
      description: perm.description ?? '',
    },
  }),

  setViewBindingsOpen: (open) => set({ viewBindingsOpen: open }),

  openViewBindings: (perm) => set({
    viewingPermId: perm.id,
    viewBindingsOpen: true,
  }),

  closeDialogs: () => set({
    createOpen: false,
    editOpen: false,
    editingID: null,
    viewBindingsOpen: false,
    viewingPermId: null,
    form: { ...defaultForm },
  }),

  updateForm: (key, value) => set((s) => ({
    form: { ...s.form, [key]: value },
  })),

  setForm: (form) => set({ form }),

  resetForm: () => set({ form: { ...defaultForm } }),
}))
