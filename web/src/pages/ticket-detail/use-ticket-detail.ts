import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import {
  useApproveTicket,
  useRejectTicket,
  useTicketDetail,
  useUrgeTicket,
  useResubmitTicket,
} from '@/lib/api/tickets'
import { useAppStore } from '@/stores/app-store'

export function useTicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const ticketId = id ? Number(id) : null
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [resubmitOpen, setResubmitOpen] = useState(false)
  const [comment, setComment] = useState('')
  const navigate = useNavigate()

  const currentUser = useAppStore((s) => s.user)

  const query = useTicketDetail(ticketId)
  const approveMutation = useApproveTicket()
  const rejectMutation = useRejectTicket()
  const urgeMutation = useUrgeTicket()
  const resubmitMutation = useResubmitTicket()

  const detail = query.data
  const ticket = detail?.ticket
  const isPending = ticket?.status === 'pending'
  const isRejected = ticket?.status === 'rejected'
  const isApplicant = currentUser?.id === ticket?.applicant_id

  const handleApprove = async () => {
    if (ticketId == null) return
    try {
      await approveMutation.mutateAsync({ id: ticketId, comment: comment || undefined })
      toast.success('工单已批准')
      setApproveOpen(false)
      setComment('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '审批失败'))
    }
  }

  const handleReject = async () => {
    if (ticketId == null) return
    if (!comment) {
      toast.error('请填写拒绝原因')
      return
    }
    try {
      await rejectMutation.mutateAsync({ id: ticketId, comment })
      toast.success('工单已拒绝')
      setRejectOpen(false)
      setComment('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '拒绝失败'))
    }
  }

  const handleUrge = async () => {
    if (ticketId == null) return
    try {
      await urgeMutation.mutateAsync(ticketId)
      toast.success('催办已发送')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '催办发送失败'))
    }
  }

  const handleResubmit = async () => {
    if (ticketId == null || !ticket) return
    try {
      await resubmitMutation.mutateAsync({
        id: ticketId,
        project_id: ticket.project_id,
        instruction_json: ticket.instruction_json,
        title: ticket.title,
        description: ticket.description,
      })
      toast.success('工单已重新提交')
      setResubmitOpen(false)
      navigate('/tickets')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '重新提交失败'))
    }
  }

  return {
    ticketId,
    query, detail, ticket, isPending,
    isRejected, isApplicant,
    approveOpen, setApproveOpen,
    rejectOpen, setRejectOpen,
    resubmitOpen, setResubmitOpen,
    comment, setComment,
    approveMutation, rejectMutation, urgeMutation, resubmitMutation,
    handleApprove, handleReject, handleUrge, handleResubmit,
  }
}
