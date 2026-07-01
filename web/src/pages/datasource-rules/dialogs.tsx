export { DatasourceRulesPage } from './page'

export const DB_TYPES = ['mysql', 'postgresql', 'all']
export const CATEGORIES = ['read', 'write', 'danger']

export const defaultForm = {
  name: '',
  db_type: 'all' as const,
  category: 'read' as const,
  pattern: '',
  enabled: true,
}

export type DatasourceRuleFormData = typeof defaultForm
