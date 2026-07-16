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

export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: '今天' },
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: '90d', label: '最近 90 天' },
] as const
