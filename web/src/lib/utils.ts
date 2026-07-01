import { format } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化时间为 `2026-06-07 12:27:00` 格式
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (date == null) return ''
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return format(d, 'yyyy-MM-dd HH:mm:ss')
}
