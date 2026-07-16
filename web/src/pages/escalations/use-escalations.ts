import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import {
  useCreateEscalation,
  useApproveEscalation,
  useRejectEscalation,
  useUpdateEscalation,
  useDeleteEscalation,
  useBatchDeleteEscalations,
  useEscalations,
  type Escalation,
} from '@/lib/api/escalations'
import { useProjects } from '@/lib/api/projects'
import { useAppStore } from '@/stores/app-store'

import { useEscalationStore } from './store'

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
  // 审批权限由后端通过权限码判断
  const canApprove = (esc: Escalation) => esc.user_id === userId

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [scope, setScope] = useState<'my' | 'pending' | 'all'>('my')
  const [statusFilter, setStatusFilter] = useState('')

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
  const updateMutation = useUpdateEscalation()
  const deleteMutation = useDeleteEscalation()
  const batchDeleteMutation = useBatchDeleteEscalations()

  const handleCreateSubmit = async () => {
    const { createProjectId, createReason } = useEscalationStore.getState()
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
        project_id: createProjectId,
        reason: createReason.trim(),
      })
      toast.success('提权申请已提交')
      useEscalationStore.getState().closeCreate()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '提交失败'))
    }
  }

  const handleApprove = async () => {
    const { approveTarget, approveDuration } = useEscalationStore.getState()
    if (!approveTarget) return
    try {
      await approveMutation.mutateAsync({
        id: approveTarget.id,
        duration: approveDuration,
      })
      toast.success('已批准提权申请')
      useEscalationStore.getState().closeApprove()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '审批失败'))
    }
  }

  const handleReject = async () => {
    const { rejectTarget } = useEscalationStore.getState()
    if (!rejectTarget) return
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id })
      toast.success('已拒绝提权申请')
      useEscalationStore.getState().closeReject()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '拒绝失败'))
    }
  }

  const handleOpenEdit = useCallback((esc: Escalation) => {
    useEscalationStore.getState().openEdit(esc)
  }, [])

  const handleEditSubmit = async () => {
    const { editTarget, editReason } = useEscalationStore.getState()
    if (!editTarget || !editReason.trim()) {
      toast.error('请填写提权理由')
      return
    }
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, reason: editReason.trim() })
      toast.success('提权申请已更新')
      useEscalationStore.getState().closeEdit()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '更新失败'))
    }
  }

  const handleOpenApprove = useCallback((esc: Escalation) => {
    useEscalationStore.getState().openApprove(esc)
  }, [])

  const handleOpenReject = useCallback((esc: Escalation) => {
    useEscalationStore.getState().openReject(esc)
  }, [])

  const handleOpenDelete = useCallback((esc: Escalation) => {
    useEscalationStore.getState().openDelete(esc)
  }, [])

  const handleDelete = async () => {
    const { deleteAlertTarget } = useEscalationStore.getState()
    if (!deleteAlertTarget) return
    try {
      await deleteMutation.mutateAsync(deleteAlertTarget.id)
      toast.success('已删除提权申请')
      useEscalationStore.getState().closeDelete()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '删除失败'))
    }
  }

  const handleBatchDelete = useCallback((rows: Escalation[]) => {
    if (!rows.length) return
    useEscalationStore.getState().openBatchDelete(rows)
  }, [])

  const handleBatchDeleteConfirm = async () => {
    const { batchDeleteRows } = useEscalationStore.getState()
    if (!batchDeleteRows.length) return
    try {
      await batchDeleteMutation.mutateAsync(batchDeleteRows.map((r) => r.id))
      toast.success('提权申请删除成功')
      useEscalationStore.getState().closeBatchDelete()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '批量删除失败'))
    }
  }

  return {
    userId,
    canApprove,
    page, setPage,
    pageSize, setPageSize,
    scope, setScope,
    statusFilter, setStatusFilter,
    projects, query, data, refetch,
    createMutation, approveMutation, rejectMutation,
    updateMutation, deleteMutation, batchDeleteMutation,
    handleOpenApprove, handleOpenReject,
    handleCreateSubmit, handleApprove, handleReject,
    handleOpenEdit, handleEditSubmit,
    handleOpenDelete, handleDelete, handleBatchDelete,
    handleBatchDeleteConfirm,
  }
}
