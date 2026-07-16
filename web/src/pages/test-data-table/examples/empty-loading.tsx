import { useState } from 'react'
import { IconEyeOff } from '@tabler/icons-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'

import type { ExampleConfig } from '../types'

interface EmptyRow {
  id: number
  name: string
  value: string
}

const columns: ColumnDef<EmptyRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '名称' },
  { accessorKey: 'value', header: '值' },
]

function EmptyLoadingExample() {
  const [mode, setMode] = useState<'empty' | 'loading' | 'data'>('empty')

  const data = mode === 'data'
    ? [{ id: 1, name: '示例数据', value: '加载完成' }]
    : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          variant={mode === 'empty' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('empty')}
        >
          空状态
        </Button>
        <Button
          variant={mode === 'loading' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('loading')}
        >
          加载中
        </Button>
        <Button
          variant={mode === 'data' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('data')}
        >
          有数据
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={mode === 'loading'}
        emptyText="暂无数据，请创建新记录"
        getRowId={(row) => String(row.id)}
      />
    </div>
  )
}

export const emptyLoadingExample: ExampleConfig = {
  key: 'empty-loading',
  label: '空态 & 加载态',
  icon: IconEyeOff,
  description: '空数据显示自定义文案，加载态显示旋转图标，点击按钮切换',
  Component: EmptyLoadingExample,
  snippet: `// 空状态：data 为空数组时显示 emptyText
<DataTable
  columns={columns}
  data={[]}
  emptyText="暂无数据，请创建新记录"
/>

// 加载态：loading=true 时显示旋转图标
<DataTable
  columns={columns}
  data={data}
  loading={true}
  emptyText="暂无数据"
/>`,
}
