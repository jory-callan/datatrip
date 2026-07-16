import { create } from 'zustand'

import type { Datasource } from '@/lib/api/datasources'

export interface DatasourceForm {
  name: string
  type: string
  host: string
  port: number
  username: string
  password: string
  remark: string
}

const defaultForm: DatasourceForm = {
  name: '',
  type: 'mysql',
  host: '',
  port: 3306,
  username: '',
  password: '',
  remark: '',
}

interface DatasourceStore {
  // Dialogs
  createOpen: boolean
  editOpen: boolean
  editingID: string | null

  // Form
  form: DatasourceForm

  // Actions
  setCreateOpen: (open: boolean) => void
  setEditOpen: (open: boolean) => void
  openEdit: (ds: Datasource) => void
  closeDialogs: () => void
  updateForm: <K extends keyof DatasourceForm>(key: K, value: DatasourceForm[K]) => void
  setForm: (form: DatasourceForm) => void
  resetForm: () => void
}

export const useDatasourceStore = create<DatasourceStore>((set) => ({
  // Dialogs
  createOpen: false,
  editOpen: false,
  editingID: null,

  // Form
  form: { ...defaultForm },

  // Actions
  setCreateOpen: (open) => set({ createOpen: open }),

  setEditOpen: (open) => set({ editOpen: open }),

  openEdit: (ds) => set({
    editingID: ds.id,
    editOpen: true,
    form: {
      name: ds.name,
      type: ds.type,
      host: ds.host,
      port: ds.port,
      username: ds.username,
      password: '',
      remark: ds.remark ?? '',
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
}))
