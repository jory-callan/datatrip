import { create } from 'zustand'

interface AuditStore {
  // Pagination
  page: number
  pageSize: number

  // Filters
  action: string
  status: string
  classification: string
  projectId: string
  startDate: string
  endDate: string

  // Sheet
  expandedRow: string | null

  // Actions
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setAction: (v: string) => void
  setStatus: (v: string) => void
  setClassification: (v: string) => void
  setProjectId: (v: string) => void
  setStartDate: (v: string) => void
  setEndDate: (v: string) => void
  setExpandedRow: (id: string | null) => void
  toggleExpand: (id: string) => void
  applyQuickRange: (range: string) => void
}

function getDefaultDates() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDates()

export const useAuditStore = create<AuditStore>((set) => ({
  // Pagination
  page: 1,
  pageSize: 20,

  // Filters
  action: '',
  status: '',
  classification: '',
  projectId: '',
  startDate: defaultStart,
  endDate: defaultEnd,

  // Sheet
  expandedRow: null,

  // Actions
  setPage: (page) => set({ page }),

  setPageSize: (pageSize) => set({ pageSize, page: 1 }),

  setAction: (v) => set({ action: v, page: 1 }),
  setStatus: (v) => set({ status: v, page: 1 }),
  setClassification: (v) => set({ classification: v, page: 1 }),
  setProjectId: (v) => set({ projectId: v, page: 1 }),
  setStartDate: (v) => set({ startDate: v, page: 1 }),
  setEndDate: (v) => set({ endDate: v, page: 1 }),

  setExpandedRow: (id) => set({ expandedRow: id }),

  toggleExpand: (id) => set((s) => ({
    expandedRow: s.expandedRow === id ? null : id,
  })),

  applyQuickRange: (range) => {
    const end = new Date()
    const endStr = end.toISOString().slice(0, 10)
    let start: Date
    switch (range) {
      case 'today':
        start = new Date()
        break
      case '7d':
        start = new Date(); start.setDate(start.getDate() - 7)
        break
      case '30d':
        start = new Date(); start.setDate(start.getDate() - 30)
        break
      case '90d':
        start = new Date(); start.setDate(start.getDate() - 90)
        break
      default:
        start = new Date(); start.setDate(start.getDate() - 7)
    }
    set({
      startDate: start.toISOString().slice(0, 10),
      endDate: endStr,
      page: 1,
    })
  },
}))
