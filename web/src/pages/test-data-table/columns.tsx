import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'

interface TestRow {
  id: number
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

const SAMPLE_DATA: TestRow[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Guest',
  status: i % 4 === 0 ? 'Disabled' : 'Enabled',
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}))

function getTestColumns(): ColumnDef<TestRow>[] {
  return [
    { accessorKey: 'id', header: 'ID', meta: { label: 'ID' }, size: 80 },
    { accessorKey: 'name', header: '姓名', meta: { label: '姓名' }, size: 150 },
    { accessorKey: 'email', header: '邮箱', meta: { label: '邮箱' }, size: 220 },
    {
      accessorKey: 'role',
      header: '角色',
      meta: { label: '角色' },
      size: 100,
      cell: ({ getValue }) => {
        const map: Record<string, string> = { Admin: 'default', Editor: 'secondary', Guest: 'outline' }
        return <Badge variant={map[getValue() as string] as any}>{getValue() as string}</Badge>
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      meta: { label: '状态' },
      size: 100,
      cell: ({ getValue }) => {
        const v = getValue() as string
        return <Badge variant={v === 'Enabled' ? 'default' : 'destructive'}>{v}</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      meta: { label: '创建时间' },
      size: 180,
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('zh-CN'),
    },
  ]
}

export { getTestColumns, SAMPLE_DATA }
