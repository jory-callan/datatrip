import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import {
  useCreateEscalation,
  useApproveEscalation,
  useRejectEscalation,
  useEscalations,
  type Escalation,
} from '@/lib/api/escalations'
import { useProjects } from '@/lib/api/projects'
import { useAppStore } from '@/stores/app-store'

export const STATUS_CONFIG: Record<string, { className: string }> = {
  pending: { className: 'bg-yellow-100 text-yellow-800' },
  approved: { className: 'bg-green-100 text-green-800' },
  rejected: { className: 'bg-red-100 text-red-800' },
  expired: { className: 'bg-gray-100 text-gray-600' },
}

export const STATUS_OPTIONS = ['all', 'pending', 'approved', 'rejected', 'expired'] as const

export const STATUS_LABEL: Record<string, string> = {
  all: '全部',
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  expired: '已过期',
}

export const DURATION_OPTIONS = ['24h', '7d', '30d', '1y'] as const

export const DURATION_LABEL: Record<string, string> = {
  '24h': '24 小时',
  '7d': '7 天',
  '30d': '30 天',
  '1y': '1 年',
}

export function useEscalationsPage() {
  const user = useAppStore((s) => s.user)
  const userId = user?.id ?? 0
  const isAdmin = user?.role_code === 'system_admin'
  // User can approve if they are system_admin OR the applicant (self-approval)
  const canApprove = (esc: Escalation) => isAdmin || esc.user_id === userId

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [scope, setScope] = useState<'my' | 'pending' | 'all'>('my')
  const [statusFilter, setStatusFilter] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createProjectId, setCreateProjectId] = useState('')
  const [createReason, setCreateReason] = useState('')

  const [approveOpen, setApproveOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState<Escalation | null>(null)
  const [approveDuration, setApproveDuration] = useState<string>('7d')

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<Escalation | null>(null)

  const projectsQuery = useProjects({ page: 1, pageSize: 200, needCount: false })
  const projects = projectsQuery.data?.list ?? []

  const query = useEscalations({
    page,
    pageSize,
    needCount: true,
    scope,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
  })
  const { data, refetch } = query

  const createMutation = useCreateEscalation()
  const approveMutation = useApproveEscalation()
  const rejectMutation = useRejectEscalation()

  const handleOpenApprove = useCallback((esc: Escalation) => {
    setApproveTarget(esc)
    setApproveDuration('7d')
    setApproveOpen(true)
  }, [])

  const handleOpenReject = useCallback((esc: Escalation) => {
    setRejectTarget(esc)
    setRejectOpen(true)
  }, [])

  const handleCreateSubmit = async () => {
    if (!createProjectId) {
      toast.error('请选择项目')
      return
    }
    if (!createReason.trim()) {
      toast.error('请填写申请理由')
      return
    }
    try {
      await createMutation.mutateAsync({
        project_id: Number(createProjectId),
        reason: createReason.trim(),
      })
      toast.success('提权申请已提交')
      setCreateOpen(false)
      setCreateProjectId('')
      setCreateReason('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '提交失败'))
    }
  }

  const handleApprove = async () => {
    if (!approveTarget) return
    try {
      await approveMutation.mutateAsync({
        id: approveTarget.id,
        duration: approveDuration,
      })
      toast.success('已批准提权申请')
      setApproveOpen(false)
      setApproveTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, '审批失败'))
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id })
      toast.success('已拒绝提权申请')
      setRejectOpen(false)
      setRejectTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, '拒绝失败'))
    }
  }

  return {
    userId,
    isAdmin,
    canApprove,
    page, setPage,
    pageSize, setPageSize,
    scope, setScope,
    statusFilter, setStatusFilter,
    createOpen, setCreateOpen,
    createProjectId, setCreateProjectId,
    createReason, setCreateReason,
    approveOpen, setApproveOpen,
    approveTarget, setApproveTarget,
    approveDuration, setApproveDuration,
    rejectOpen, setRejectOpen,
    rejectTarget, setRejectTarget,
    projects, query, data, refetch,
    createMutation, approveMutation, rejectMutation,
    handleOpenApprove, handleOpenReject,
    handleCreateSubmit, handleApprove, handleReject,
  }
}
