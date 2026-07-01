import { IconDatabase, IconPlugConnected } from '@tabler/icons-react'

import { DataTable } from '@/components/common/data-table'
import { FormDialog, FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { useDatasourceColumns } from './columns'
import { useDatasourcesPage } from './use-datasources'
import type { CreateDatasourceInput } from '@/lib/api/datasources'

const DS_TYPES = ['mysql', 'postgresql'] as const
type DatasourceType = typeof DS_TYPES[number]

interface DatasourceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: CreateDatasourceInput
  setForm: (fn: (f: CreateDatasourceInput) => CreateDatasourceInput) => void
  onSave: () => void
  isPending: boolean
  editingID: number | null
  onTest?: (id: number) => void
  isTesting: boolean
}

function DatasourceFormDialog({
  open, onOpenChange, title, description,
  form, setForm, onSave, isPending, editingID,
  onTest, isTesting,
}: DatasourceFormDialogProps) {

  const update = <K extends keyof CreateDatasourceInput>(
    key: K, value: CreateDatasourceInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <IconDatabase className="size-5 text-primary" />
          {title}
        </span>
      }
      description={description}
      footer={
        <>
          {onTest && editingID != null ? (
            <Button
              variant="outline"
              disabled={isTesting}
              onClick={() => onTest(editingID)}
            >
              <IconPlugConnected className="size-4" />
              {isTesting ? '测试中…' : '测试连接'}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? '保存中…' : '保存'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormGroup title="基本信息" description="数据源的展示信息和分类">
          <FormField label="名称" span={1} required>
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="例如：订单库主库"
            />
          </FormField>
          <FormField label="类型" span={1} required>
            <Select
              value={form.type}
              onValueChange={(v) => update('type', v as DatasourceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DS_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="备注" span={2}>
            <Textarea
              value={form.remark ?? ''}
              onChange={(e) => update('remark', e.target.value)}
              placeholder="选填，描述此数据源的用途"
              rows={2}
            />
          </FormField>
        </FormGroup>

        <FormGroup title="连接配置" description="数据库的连接信息，密码在编辑时留空则保持不变">
          <FormField label="主机" span={1} required>
            <Input
              value={form.host}
              onChange={(e) => update('host', e.target.value)}
              placeholder="例如：127.0.0.1"
            />
          </FormField>
          <FormField label="端口" span={1} required>
            <Input
              type="number"
              value={form.port}
              onChange={(e) => update('port', Number(e.target.value))}
            />
          </FormField>
          <FormField label="数据库" span={1} hint="选填，留空可连接后选择">
            <Input
              value={form.database ?? ''}
              onChange={(e) => update('database', e.target.value)}
              placeholder="例如：orders"
            />
          </FormField>
          <FormField label="用户名" span={1} required>
            <Input
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              autoComplete="off"
            />
          </FormField>
          <FormField
            label="密码"
            span={2}
            required={!editingID}
            hint={editingID ? '留空则保持原密码不变' : undefined}
          >
            <Input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder={editingID ? '留空则不修改密码' : '请输入密码'}
              autoComplete="new-password"
            />
          </FormField>
        </FormGroup>
      </div>
    </FormDialog>
  )
}

export function DatasourcesPage() {
  const {
    page, setPage, pageSize, setPageSize,
    createOpen, setCreateOpen, editOpen, setEditOpen,
    editingID, form, setForm,
    query, data, refetch,
    createMutation, updateMutation, deleteMutation, testMutation,
    handleCreate, handleUpdate, handleDelete,
    handleTestConnection, openEdit, resetForm, needCount,
  } = useDatasourcesPage()

  const columns = useDatasourceColumns(
    openEdit, handleDelete,
    updateMutation.isPending, deleteMutation.isPending,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'数据源管理'}</h1>
        <p className="text-sm text-muted-foreground">{'管理数据库连接信息'}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.list ?? []}
            loading={query.isFetching}
            emptyText={'暂无数据源'}
            storageKey="table:datasources:columns"
            getRowId={(row) => String(row.id)}
            toolbar={{
              searchPlaceholder: '搜索数据源...',
              createLabel: '新增数据源',
              onCreate: () => setCreateOpen(true),
              onRefresh: () => { void refetch() },
            }}
            pagination={{
              page, pageSize,
              total: data?.total ?? 0, needCount,
              pageSizeOptions: [10, 20, 50, 100],
              onPageChange: setPage,
              onPageSizeChange: (nextPageSize) => { setPageSize(nextPageSize); setPage(1) },
            }}
          />
        </CardContent>
      </Card>

      <DatasourceFormDialog
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}
        title={'新增数据源'}
        description={'添加一个新的数据库连接'}
        form={form} setForm={setForm}
        onSave={handleCreate} isPending={createMutation.isPending}
        editingID={null}
        isTesting={false}
      />

      <DatasourceFormDialog
        open={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) { resetForm() } }}
        title={'编辑数据源'}
        description={'修改数据库连接信息'}
        form={form} setForm={setForm}
        onSave={handleUpdate} isPending={updateMutation.isPending}
        editingID={editingID}
        onTest={handleTestConnection} isTesting={testMutation.isPending}
      />
    </div>
  )
}
