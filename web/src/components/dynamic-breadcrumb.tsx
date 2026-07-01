
import { Link, useLocation } from 'react-router-dom'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BreadcrumbSegment {
  label: string
  href?: string
}

const SEGMENT_LABEL: Record<string, string> = {
  overview: '总览',
  'sql-workbench': 'SQL 工作台',
  tickets: '工单管理',
  escalations: '提权管理',
  audits: '审计日志',
  users: '用户管理',
  datasources: '数据源管理',
  projects: '数据项目管理',
  'datasource-rules': '数据源规则',
  webhooks: 'Webhook',
  permissions: '权限配置',
  profile: '个人中心',
  test: '测试',
  'data-table': 'DataTable 测试',
  'layout-overflow': '布局溢出测试',
}

export function DynamicBreadcrumb() {
  const location = useLocation()

  const generateBreadcrumbs = (): BreadcrumbSegment[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    if (pathSegments.length === 0) return []

    return pathSegments.map((segment, index) => ({
      label: SEGMENT_LABEL[segment] ?? segment,
      href: index < pathSegments.length - 1
        ? `/${pathSegments.slice(0, index + 1).join('/')}`
        : undefined,
    }))
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
