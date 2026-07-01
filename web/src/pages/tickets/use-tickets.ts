import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import { useProjects } from '@/lib/api/projects'
import {
  useApproveTicket,
  useRejectTicket,
  useTicketDetail,
  useTickets,
} from '@/lib/api/tickets'
import type { Ticket } from '@/lib/api/tickets'

export function useTicketsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [scope, setScope] = useState<'my' | 'pending' | 'all'>('my')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [comment, setComment] = useState('')

  const projectsQuery = useProjects({ page: 1, pageSize: 200, needCount: false })
  const projects = projectsQuery.data?.list ?? []

  const query = useTickets({
    page, pageSize, needCount: true, scope,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    project_id: projectFilter ? Number(projectFilter) : undefined,
  })
  const { data, refetch } = query

  const detailQuery = useTicketDetail(selectedTicketId)
  const approveMutation = useApproveTicket()
  const rejectMutation = useRejectTicket()

  const handleViewDetail = useCallback((ticket: Ticket) => {
    setSelectedTicketId(ticket.id)
    setDetailOpen(true)
  }, [])

  const handleOpenApprove = useCallback(() => {
    setComment('')
    setApproveOpen(true)
  }, [])

  const handleOpenReject = useCallback(() => {
    setComment('')
    setRejectOpen(true)
  }, [])

  const handleApprove = async () => {
    if (selectedTicketId == null) return
    try {
      await approveMutation.mutateAsync({ id: selectedTicketId, comment: comment || undefined })
      toast.success('工单已批准')
      setApproveOpen(false)
      setComment('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '审批失败'))
    }
  }

  const handleReject = async () => {
    if (selectedTicketId == null) return
    if (!comment) {
      toast.error('请填写拒绝原因')
      return
    }
    try {
      await rejectMutation.mutateAsync({ id: selectedTicketId, comment })
      toast.success('工单已拒绝')
      setRejectOpen(false)
      setComment('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '拒绝失败'))
    }
  }

  return {
    page, setPage, pageSize, setPageSize,
    scope, setScope, statusFilter, setStatusFilter,
    projectFilter, setProjectFilter,
    selectedTicketId, setSelectedTicketId,
    detailOpen, setDetailOpen,
    approveOpen, setApproveOpen,
    rejectOpen, setRejectOpen,
    comment, setComment,
    projects, query, data, refetch,
    detailQuery, approveMutation, rejectMutation,
    handleViewDetail, handleOpenApprove, handleOpenReject,
    handleApprove, handleReject,
  }
}
