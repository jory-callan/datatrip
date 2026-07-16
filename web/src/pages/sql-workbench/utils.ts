export const LS_KEYS = {
  leftPanelTab: 'sql-wb-left-tab',
  executionHistory: 'sql-wb-history',
  selectedProjects: 'sql-wb-selected-projects',
  horizontalLayout: 'sql-wb-horizontal-layout',
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return fallback
}

export function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignore */ }
}

export let tabIdCounter = 0
export function nextTabId() {
  return ++tabIdCounter
}

export function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '<null>'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
