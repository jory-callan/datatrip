
import { IconDatabase, IconFileDescription, IconPlayerPlay, IconUsers } from '@tabler/icons-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats } from '@/lib/api/stats'

export function Overview() {

  const { data: stats, isLoading } = useDashboardStats()

  const cards = [
    {
      key: 'projects',
      icon: IconDatabase,
      value: stats?.project_count,
      label: '项目数',
    },
    {
      key: 'datasources',
      icon: IconUsers,
      value: stats?.datasource_count,
      label: '数据源数',
    },
    {
      key: 'todayExec',
      icon: IconPlayerPlay,
      value: stats?.today_exec_count,
      label: '今日执行',
    },
    {
      key: 'pendingTickets',
      icon: IconFileDescription,
      value: stats?.pending_ticket_count,
      label: '待审批工单',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{'仪表盘'}</h1>
        <p className="text-sm text-muted-foreground">{'Jerry DB Manager 管理后台'}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{card.value ?? '-'}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{'最近执行记录'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !stats?.recent_executions?.length ? (
            <p className="text-sm text-muted-foreground">{'暂无执行记录'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{'项目'}</th>
                    <th className="pb-2 pr-4 font-medium">{'SQL'}</th>
                    <th className="pb-2 pr-4 font-medium">{'分类'}</th>
                    <th className="pb-2 pr-4 font-medium">{'状态'}</th>
                    <th className="pb-2 pr-4 font-medium text-right">{'耗时'}</th>
                    <th className="pb-2 font-medium text-right">{'时间'}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_executions.map((exec) => (
                    <tr key={exec.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4 max-w-[120px] truncate">{exec.project_name || `#${exec.project_id}`}</td>
                      <td className="py-2 pr-4 max-w-[300px] truncate font-mono text-xs">{exec.sql}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                          exec.classification === 'read' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : exec.classification === 'write' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {exec.classification}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                          exec.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : exec.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {exec.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">{exec.duration_ms}ms</td>
                      <td className="py-2 text-right text-muted-foreground text-xs">
                        {new Date(exec.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
