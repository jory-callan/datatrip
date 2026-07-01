import { useMemo, useState } from 'react'

import { useProjects } from '@/lib/api/projects'
import { useAudits } from '@/lib/api/audits'

export const ACTION_LABEL: Record<string, string> = {
  all: '全部',
  execute: 'SQL 执行',
  escalated_execute: '提权执行',
  create_ticket: '创建工单',
  ticket_execute: '工单自动执行',
  approve: '审批通过',
  reject: '审批拒绝',
}

export const STATUS_LABEL: Record<string, string> = {
  all: '全部',
  success: '成功',
  failed: '失败',
}

export const CLASSIFICATION_LABEL: Record<string, string> = {
  all: '全部',
  read: '读',
  write: '写',
}

export const ACTION_OPTIONS = [
  { value: 'all', label: ACTION_LABEL.all },
  { value: 'execute', label: ACTION_LABEL.execute },
  { value: 'escalated_execute', label: ACTION_LABEL.escalated_execute },
  { value: 'create_ticket', label: ACTION_LABEL.create_ticket },
  { value: 'ticket_execute', label: ACTION_LABEL.ticket_execute },
  { value: 'approve', label: ACTION_LABEL.approve },
  { value: 'reject', label: ACTION_LABEL.reject },
]

export const STATUS_OPTIONS = [
  { value: 'all', label: STATUS_LABEL.all },
  { value: 'success', label: STATUS_LABEL.success },
  { value: 'failed', label: STATUS_LABEL.failed },
]

export const CLASSIFICATION_OPTIONS = [
  { value: 'all', label: CLASSIFICATION_LABEL.all },
  { value: 'read', label: CLASSIFICATION_LABEL.read },
  { value: 'write', label: CLASSIFICATION_LABEL.write },
]

export function useAuditsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [actionFilter, setActionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classificationFilter, setClassificationFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState('')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const projectsQuery = useProjects({ page: 1, pageSize: 200, needCount: false })
  const projects = projectsQuery.data?.list ?? []

  const query = useAudits({
    page,
    pageSize,
    needCount: false,
    action: actionFilter && actionFilter !== 'all' ? actionFilter : undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    classification: classificationFilter && classificationFilter !== 'all' ? classificationFilter : undefined,
    project_id: projectFilter ? Number(projectFilter) : undefined,
    start_time: startDate || undefined,
    end_time: endDate || undefined,
  })
  const { data, refetch } = query

  const expandedAudit = useMemo(() => {
    if (expandedRow == null) return null
    return data?.list?.find((a) => a.id === expandedRow) ?? null
  }, [data?.list, expandedRow])

  const toggleExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const setFilterAction = (v: string) => { setActionFilter(v); setPage(1) }
  const setFilterStatus = (v: string) => { setStatusFilter(v); setPage(1) }
  const setFilterClassification = (v: string) => { setClassificationFilter(v); setPage(1) }
  const setFilterProject = (v: string) => { setProjectFilter(v); setPage(1) }
  const setFilterStartDate = (v: string) => { setStartDate(v); setPage(1) }
  const setFilterEndDate = (v: string) => { setEndDate(v); setPage(1) }

  return {
    page, setPage,
    pageSize, setPageSize,
    actionFilter, statusFilter, projectFilter,
    classificationFilter,
    startDate, endDate,
    expandedRow, expandedAudit,
    projects, query, data,
    toggleExpand, refetch,
    setFilterAction, setFilterStatus, setFilterProject,
    setFilterClassification,
    setFilterStartDate, setFilterEndDate,
    setExpandedRow,
  }
}
