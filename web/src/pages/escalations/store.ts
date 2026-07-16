import { create } from 'zustand'

import type { Escalation } from '@/lib/api/escalations'

export interface EscalationStore {
  // Create Sheet
  createOpen: boolean
  createProjectId: string
  createReason: string

  // Edit Sheet
  editOpen: boolean
  editTarget: Escalation | null
  editReason: string

  // Approve Dialog
  approveOpen: boolean
  approveTarget: Escalation | null
  approveDuration: string

  // Reject Dialog
  rejectOpen: boolean
  rejectTarget: Escalation | null

  // Delete AlertDialog
  deleteAlertOpen: boolean
  deleteAlertTarget: Escalation | null

  // Batch Delete AlertDialog
  batchDeleteAlertOpen: boolean
  batchDeleteRows: Escalation[]

  // Actions
  setCreateOpen: (open: boolean) => void
  setCreateProjectId: (id: string) => void
  setCreateReason: (reason: string) => void
  closeCreate: () => void

  openEdit: (esc: Escalation) => void
  setEditReason: (reason: string) => void
  closeEdit: () => void

  openApprove: (esc: Escalation) => void
  closeApprove: () => void
  setApproveDuration: (duration: string) => void

  openReject: (esc: Escalation) => void
  closeReject: () => void

  openDelete: (esc: Escalation) => void
  closeDelete: () => void

  openBatchDelete: (rows: Escalation[]) => void
  closeBatchDelete: () => void
}

export const useEscalationStore = create<EscalationStore>((set) => ({
  // Create Sheet
  createOpen: false,
  createProjectId: '',
  createReason: '',

  // Edit Sheet
  editOpen: false,
  editTarget: null,
  editReason: '',

  // Approve Dialog
  approveOpen: false,
  approveTarget: null,
  approveDuration: '7d',

  // Reject Dialog
  rejectOpen: false,
  rejectTarget: null,

  // Delete AlertDialog
  deleteAlertOpen: false,
  deleteAlertTarget: null,

  // Batch Delete AlertDialog
  batchDeleteAlertOpen: false,
  batchDeleteRows: [],

  // Actions
  setCreateOpen: (open) => set({ createOpen: open }),
  setCreateProjectId: (id) => set({ createProjectId: id }),
  setCreateReason: (reason) => set({ createReason: reason }),
  closeCreate: () => set({ createOpen: false, createProjectId: '', createReason: '' }),

  openEdit: (esc) => set({
    editOpen: true,
    editTarget: esc,
    editReason: esc.reason,
  }),
  setEditReason: (reason: string) => set({ editReason: reason }),
  closeEdit: () => set({ editOpen: false, editTarget: null, editReason: '' }),

  openApprove: (esc) => set({
    approveOpen: true,
    approveTarget: esc,
    approveDuration: '7d',
  }),
  closeApprove: () => set({ approveOpen: false, approveTarget: null }),
  setApproveDuration: (duration) => set({ approveDuration: duration }),

  openReject: (esc) => set({ rejectOpen: true, rejectTarget: esc }),
  closeReject: () => set({ rejectOpen: false, rejectTarget: null }),

  openDelete: (esc) => set({ deleteAlertOpen: true, deleteAlertTarget: esc }),
  closeDelete: () => set({ deleteAlertOpen: false, deleteAlertTarget: null }),

  openBatchDelete: (rows) => set({ batchDeleteAlertOpen: true, batchDeleteRows: rows }),
  closeBatchDelete: () => set({ batchDeleteAlertOpen: false, batchDeleteRows: [] }),
}))
