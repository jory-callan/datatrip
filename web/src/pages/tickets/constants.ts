export const STATUS_CONFIG: Record<string, { className: string }> = {
  pending: { className: 'bg-yellow-100 text-yellow-800' },
  approved: { className: 'bg-blue-100 text-blue-800' },
  rejected: { className: 'bg-red-100 text-red-800' },
  executing: { className: 'bg-blue-100 text-blue-800' },
  executed: { className: 'bg-green-100 text-green-800' },
  execute_failed: { className: 'bg-red-100 text-red-800' },
}

export const STATUS_LABEL: Record<string, string> = {
  all: '全部',
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  executing: '执行中',
  executed: '已执行',
  execute_failed: '执行失败',
}

export const STATUS_OPTIONS = ['all', 'pending', 'approved', 'rejected', 'executing', 'executed', 'execute_failed'] as const
