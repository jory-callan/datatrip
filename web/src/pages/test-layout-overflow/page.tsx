import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@tanstack/react-table'

interface Row {
  id: number
  name: string
  value: string
}

const DATA: Row[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Row ${i + 1}`,
  value: `value-${(i + 1).toString().padStart(3, '0')}`,
}))

const COLUMNS: ColumnDef<Row>[] = [
  { accessorKey: 'id', header: 'ID', size: 80 },
  { accessorKey: 'name', header: 'Name', size: 200 },
  { accessorKey: 'value', header: 'Value', size: 200 },
]

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

const LIPSUM_PARAGRAPHS = Array.from({ length: 6 }, (_, i) => (
  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
    {LOREM}
  </p>
))

export function TestLayoutOverflowPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="border-b pb-3">
        <h1 className="text-2xl font-bold">Layout Overflow Test</h1>
        <p className="text-sm text-muted-foreground">
          验证当 content 超过视口高度时，整个 content 区域按内容自然撑高，超出部分由外层（body / main）滚动，而不是由 DataTable 内部滚动。
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          使用方式：F12 打开开发者工具，缩放窗口到 600×400，让视口变小，观察页面是否出现外层滚动条，DataTable 是否不再主动 fill 撑满。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Card 1 · 文本内容</CardTitle>
          <CardDescription>多个段落填充</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {LIPSUM_PARAGRAPHS.slice(0, 3)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card 2 · 文本内容</CardTitle>
          <CardDescription>多个段落填充</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {LIPSUM_PARAGRAPHS.slice(3)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card 3 · DataTable (fill 模式默认)</CardTitle>
          <CardDescription>表格按内容自然撑高，不 flex-1 撑满父容器</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={COLUMNS} data={DATA} storageKey="table:test:layout-overflow" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card 4 · 文本内容</CardTitle>
          <CardDescription>填充内容让页面超出视口</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {LIPSUM_PARAGRAPHS}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card 5 · 文本内容</CardTitle>
          <CardDescription>继续填充</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {LIPSUM_PARAGRAPHS}
        </CardContent>
      </Card>

      <footer className="mt-2 border-t pt-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Jerry DB Manager · Layout Overflow Test Footer
      </footer>
    </div>
  )
}
