import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { DataTable } from '@/components/common/data-table'

import { SAMPLE_DATA, getTestColumns } from './columns'

export function TestDataTablePage() {

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-2xl font-bold">{'DataTable 测试'}</h1>
        <p className="text-sm text-muted-foreground">{'DataTable 组件功能测试页，展示了列排序、列固定、行选择等特性。'}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{'用户列表'}</CardTitle>
          <CardDescription>{'50 条模拟数据，点击列头排序，打开显示列菜单固定列'}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={getTestColumns()}
            data={SAMPLE_DATA}
            storageKey="table:test:data-table"
            enableRowSelection
            getRowId={(row) => String(row.id)}
          />
        </CardContent>
      </Card>

      <footer className="border-t pt-3 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Jerry DB Manager · Test Page Footer
      </footer>
    </div>
  )
}
