import { useState } from 'react'
import { IconCloudUpload, IconDownload, IconSettings2 } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'

import type { ExampleConfig } from '../types'

interface FileRow {
  id: number
  name: string
  type: string
  size: number
  owner: string
  updatedAt: string
}

const FILES: FileRow[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: [`report_2025_${i + 1}.pdf`, `screenshot_${i + 1}.png`, `data_export_${i + 1}.csv`, `config_${i + 1}.json`, `backup_${i + 1}.sql`][i % 5],
  type: ['PDF', 'PNG', 'CSV', 'JSON', 'SQL'][i % 5],
  size: Math.floor(Math.random() * 10000) + 10,
  owner: ['张三', '李四', '王五'][i % 3],
  updatedAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
}))

function formatSize(bytes: number) {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

const columns: ColumnDef<FileRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '文件名' },
  { accessorKey: 'type', header: '类型', cell: ({ getValue }) => <Badge variant="outline">{getValue() as string}</Badge> },
  { accessorKey: 'size', header: '大小', cell: ({ getValue }) => formatSize(getValue() as number) },
  { accessorKey: 'owner', header: '拥有者' },
  { accessorKey: 'updatedAt', header: '更新时间' },
]

function ToolbarExample() {
  const [data, setData] = useState(FILES)

  return (
    <DataTable
      columns={columns}
      data={data}
      enableRowSelection
      enableSorting
      getRowId={(row) => String(row.id)}
      toolbar={{
        searchPlaceholder: '搜索文件...',
        createLabel: '上传文件',
        onCreate: () => alert('上传文件 (演示点击)'),
        deleteLabel: '批量删除',
        onRefresh: () => alert('刷新 (演示点击)'),
        onBatchDelete: (rows) => {
          const ids = new Set(rows.map((r: FileRow) => r.id))
          setData((prev) => prev.filter((d) => !ids.has(d.id)))
        },
        extraActions: [
          {
            label: '导出选中',
            icon: <IconDownload className="size-4" />,
            onClick: (rows) => alert(`导出 ${rows.length} 个文件 (演示)`),
          },
          {
            label: '批量发布',
            icon: <IconCloudUpload className="size-4" />,
            variant: 'default',
            onClick: (rows) => alert(`发布 ${rows.length} 个文件 (演示)`),
          },
          {
            label: '批量设置',
            icon: <IconSettings2 className="size-4" />,
            variant: 'secondary',
            onClick: (rows) => alert(`设置 ${rows.length} 个文件 (演示)`),
          },
        ],
      }}
    />
  )
}

export const toolbarExample: ExampleConfig = {
  key: 'toolbar',
  label: '完整工具栏',
  icon: IconSettings2,
  description: '搜索框 + 刷新 + 创建 + 批量删除 + 多个自定义操作按钮',
  Component: ToolbarExample,
  snippet: `<DataTable
  columns={columns}
  data={data}
  enableRowSelection
  enableSorting
  toolbar={{
    searchPlaceholder: '搜索文件...',
    createLabel: '上传文件',
    onCreate: () => handleCreate(),
    deleteLabel: '批量删除',
    onRefresh: () => handleRefresh(),
    onBatchDelete: (rows) => handleBatchDelete(rows),
    extraActions: [
      {
        label: '导出选中',
        icon: <IconDownload className="size-4" />,
        onClick: (rows) => handleExport(rows),
      },
    ],
  }}
/>`,
}
