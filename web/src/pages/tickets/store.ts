import { create } from 'zustand'

interface TicketStore {
  // Detail Sheet
  selectedTicketId: string | null
  detailOpen: boolean

  // Approve / Reject Dialogs
  approveOpen: boolean
  rejectOpen: boolean
  comment: string

  // Actions
  setDetailOpen: (open: boolean) => void
  openDetail: (ticketId: string) => void
  closeDetail: () => void
  setApproveOpen: (open: boolean) => void
  setRejectOpen: (open: boolean) => void
  openApprove: () => void
  openReject: () => void
  setComment: (comment: string) => void
  resetComment: () => void
}

export const useTicketStore = create<TicketStore>((set) => ({
  // State
  selectedTicketId: null,
  detailOpen: false,
  approveOpen: false,
  rejectOpen: false,
  comment: '',

  // Actions
  setDetailOpen: (open) => set({ detailOpen: open }),

  openDetail: (ticketId) => set({ selectedTicketId: ticketId, detailOpen: true }),

  closeDetail: () => set({ selectedTicketId: null, detailOpen: false }),

  setApproveOpen: (open) => set({ approveOpen: open }),

  setRejectOpen: (open) => set({ rejectOpen: open }),

  openApprove: () => set({ approveOpen: true, comment: '' }),

  openReject: () => set({ rejectOpen: true, comment: '' }),

  setComment: (comment) => set({ comment }),

  resetComment: () => set({ comment: '' }),
}))
