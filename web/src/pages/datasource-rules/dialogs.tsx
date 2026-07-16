export { DatasourceRulesPage } from './page'

export const TYPE_SCOPE_OPTIONS = [
  { value: '_all', label: '全部' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'tidb', label: 'TiDB' },
  { value: 'oceanbase', label: 'OceanBase' },
  { value: 'redis', label: 'Redis' },
  { value: 'mongo', label: 'MongoDB' },
  { value: 'es', label: 'Elasticsearch' },
  { value: 'kafka', label: 'Kafka' },
]

/** API 数据未加载时的 fallback */
export const FALLBACK_GROUPS = [
  { group: 'sql', label: 'SQL 数据库', types: [
    { type: 'mysql', label: 'MySQL' },
    { type: 'postgresql', label: 'PostgreSQL' },
    { type: 'tidb', label: 'TiDB' },
    { type: 'oceanbase', label: 'OceanBase' },
  ]},
  { group: 'nosql', label: 'NoSQL', types: [
    { type: 'redis', label: 'Redis' },
    { type: 'mongo', label: 'MongoDB' },
  ]},
  { group: 'search', label: '搜索', types: [
    { type: 'es', label: 'Elasticsearch' },
  ]},
  { group: 'mq', label: '消息队列', types: [
    { type: 'kafka', label: 'Kafka' },
  ]},
]

export const CATEGORIES = ['read', 'write', 'dangerous']
export const CATEGORY_LABELS: Record<string, string> = {
  read: '读',
  write: '写',
  dangerous: '危险',
}

export const defaultForm = {
  name: '',
  type_group: '_all' as string,
  type_scope: '_all' as string,
  category: 'read' as string,
  pattern: '',
  priority: 0,
  enabled: true,
}

export type DatasourceRuleFormData = typeof defaultForm
