import { create } from 'zustand'

import type { User } from '@/lib/api/users'

export interface UserForm {
  username: string
  password: string
  nickname: string
  status: string
}

const defaultForm: UserForm = {
  username: '',
  password: '',
  nickname: '',
  status: 'active',
}

interface ResetPwdState {
  userId: string | null
  username: string
  nickname: string
  password: string
  confirm: string
}

const defaultResetPwdState: ResetPwdState = {
  userId: null,
  username: '',
  nickname: '',
  password: '',
  confirm: '',
}

interface UsersStore {
  // Dialogs
  createOpen: boolean
  editOpen: boolean
  resetPwdOpen: boolean
  assignRolesOpen: boolean
  editingID: string | null
  assignRolesUserId: string | null

  // Form
  form: UserForm

  // Reset Password
  resetPwdState: ResetPwdState

  // Assign Roles
  assignRoleSelectedRoleId: string | null

  // Actions
  setCreateOpen: (open: boolean) => void
  setEditOpen: (open: boolean) => void
  openEdit: (user: User) => void
  closeDialogs: () => void

  setResetPwdOpen: (open: boolean) => void
  openResetPassword: (user: User) => void
  closeResetPwd: () => void
  updateResetPwd: (key: 'password' | 'confirm', value: string) => void

  setAssignRolesOpen: (open: boolean) => void
  setAssignRoleSelectedRoleId: (id: string | null) => void
  openAssignRoles: (user: User) => void
  closeAssignRoles: () => void

  updateForm: <K extends keyof UserForm>(key: K, value: UserForm[K]) => void
  setForm: (form: UserForm) => void
  resetForm: () => void
}

export const useUsersStore = create<UsersStore>((set) => ({
  // Dialogs
  createOpen: false,
  editOpen: false,
  resetPwdOpen: false,
  assignRolesOpen: false,
  editingID: null,
  assignRolesUserId: null,

  // Form
  form: { ...defaultForm },

  // Reset Password
  resetPwdState: { ...defaultResetPwdState },

  // Assign Roles
  assignRoleSelectedRoleId: null,

  // Actions
  setCreateOpen: (open) => set({ createOpen: open, ...(open ? {} : { form: { ...defaultForm } }) }),

  setEditOpen: (open) => set({ editOpen: open }),

  openEdit: (user) => set({
    editingID: user.id,
    editOpen: true,
    form: {
      username: user.username,
      password: '',
      nickname: user.nickname ?? '',
      status: user.status ?? 'active',
    },
  }),

  closeDialogs: () => set({
    createOpen: false,
    editOpen: false,
    editingID: null,
    form: { ...defaultForm },
  }),

  setResetPwdOpen: (open) => set({ resetPwdOpen: open }),

  openResetPassword: (user) => set({
    resetPwdOpen: true,
    resetPwdState: {
      userId: user.id,
      username: user.username,
      nickname: user.nickname ?? '',
      password: '',
      confirm: '',
    },
  }),

  closeResetPwd: () => set({
    resetPwdOpen: false,
    resetPwdState: { ...defaultResetPwdState },
  }),

  updateResetPwd: (key, value) => set((s) => ({
    resetPwdState: { ...s.resetPwdState, [key]: value },
  })),

  setAssignRolesOpen: (open) => set({ assignRolesOpen: open }),

  setAssignRoleSelectedRoleId: (id) => set({ assignRoleSelectedRoleId: id }),

  openAssignRoles: (user) => set({
    assignRolesOpen: true,
    assignRolesUserId: user.id,
    assignRoleSelectedRoleId: null,
  }),

  closeAssignRoles: () => set({
    assignRolesOpen: false,
    assignRolesUserId: null,
    assignRoleSelectedRoleId: null,
  }),

  updateForm: (key, value) => set((s) => ({
    form: { ...s.form, [key]: value },
  })),

  setForm: (form) => set({ form }),

  resetForm: () => set({ form: { ...defaultForm } }),
}))
