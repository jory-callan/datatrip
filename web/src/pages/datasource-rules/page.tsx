import { IconPencil, IconShield } from '@tabler/icons-react'

import { DataTable } from '@/components/common/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { DB_TYPES, CATEGORIES } from './dialogs'
import { useDatasourceRuleColumns } from './columns'
import { useDatasourceRulesPage } from './use-datasource-rules'

function RuleDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  form,
  setForm,
  onSave,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  form: { name: string; db_type: string; category: string; pattern: string; enabled: boolean }
  setForm: React.Dispatch<React.SetStateAction<any>>
  onSave: () => void
  isPending: boolean
}) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>{'规则名称'}</Label>
            <Input value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="grid gap-2">
            <Label>{'数据库类型'}</Label>
            <Select value={form.db_type} onValueChange={(v) => setForm((f: any) => ({ ...f, db_type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DB_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{'分类'}</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f: any) => ({ ...f, category: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{'匹配模式'}</Label>
            <Input value={form.pattern} onChange={(e) => setForm((f: any) => ({ ...f, pattern: e.target.value }))} required placeholder="regex pattern" />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.enabled ?? true}
              onCheckedChange={(v) => setForm((f: any) => ({ ...f, enabled: v }))}
            />
            <Label>{'启用'}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {'取消'}
          </Button>
          <Button onClick={onSave} disabled={isPending}>
            {'保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DatasourceRulesPage() {

  const {
    page, setPage,
    pageSize, setPageSize,
    createOpen, setCreateOpen,
    editOpen, setEditOpen,
    editingID, setEditingID,
    form, setForm,
    query, data, refetch,
    createMutation, updateMutation,
    handleCreate, handleUpdate, openEdit,
    handleToggleEnabled, resetForm, needCount,
  } = useDatasourceRulesPage()

  const columns = useDatasourceRuleColumns(
    handleToggleEnabled,
    openEdit,
    updateMutation.isPending,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'数据源规则'}</h1>
        <p className="text-sm text-muted-foreground">{'管理数据源审核规则'}</p>
      </div>

      <div>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconShield className="size-4" />
              <span>{`共 ${data?.total ?? 0} 条规则`}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.list ?? []}
            loading={query.isFetching}
            emptyText={'暂无规则'}
            storageKey="table:datasource-rules:columns"
            getRowId={(row) => String(row.id)}
            toolbar={{
              searchPlaceholder: '搜索规则...',
              createLabel: '新增规则',
              onCreate: () => setCreateOpen(true),
              onRefresh: () => { void refetch() },
            }}
            pagination={{
              page,
              pageSize,
              total: data?.total ?? 0,
              needCount,
              pageSizeOptions: [10, 20, 50, 100],
              onPageChange: setPage,
              onPageSizeChange: (nextPageSize) => {
                setPageSize(nextPageSize)
                setPage(1)
              },
            }}
          />
        </CardContent>
      </Card>

      <RuleDialog
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}
        title={'新增规则'}
        description={'添加一条新的数据源审核规则'}
        icon={IconShield}
        form={form}
        setForm={setForm}
        onSave={handleCreate}
        isPending={createMutation.isPending}
      />

      <RuleDialog
        open={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingID(null); resetForm() } }}
        title={'编辑规则'}
        description={'修改数据源审核规则'}
        icon={IconPencil}
        form={form}
        setForm={setForm}
        onSave={handleUpdate}
        isPending={updateMutation.isPending}
      />
    </div>
  )
}
