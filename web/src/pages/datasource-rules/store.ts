import { create } from 'zustand'

import type { CreateDatasourceRuleInput, DatasourceRule } from '@/lib/api/datasource-rules'

import { defaultForm } from './dialogs'

interface DatasourceRuleStore {
  // Dialogs
  createOpen: boolean
  editOpen: boolean
  editingID: string | null

  // Form
  form: CreateDatasourceRuleInput

  // Actions
  setCreateOpen: (open: boolean) => void
  setEditOpen: (open: boolean) => void
  openEdit: (rule: DatasourceRule) => void
  closeDialogs: () => void
  updateForm: <K extends keyof CreateDatasourceRuleInput>(key: K, value: CreateDatasourceRuleInput[K]) => void
  setForm: (form: CreateDatasourceRuleInput) => void
  resetForm: () => void
}

export const useDatasourceRuleStore = create<DatasourceRuleStore>((set) => ({
  // Dialogs
  createOpen: false,
  editOpen: false,
  editingID: null,

  // Form
  form: { ...defaultForm },

  // Actions
  setCreateOpen: (open) => set({ createOpen: open }),

  setEditOpen: (open) => set({ editOpen: open }),

  openEdit: (rule) => set({
    editingID: rule.id,
    editOpen: true,
    form: {
      name: rule.name,
      type_group: rule.type_group || '_all',
      type_scope: rule.type_scope || '_all',
      category: rule.category,
      pattern: rule.pattern,
      priority: rule.priority,
      enabled: rule.enabled,
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
