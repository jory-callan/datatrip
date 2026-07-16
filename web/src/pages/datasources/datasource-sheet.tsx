import { IconDatabase, IconPlugConnected } from '@tabler/icons-react'

import { FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

import { useDatasourceStore } from './store'
import type { DatasourceForm } from './store'

interface Props {
  /** Data source type options for the type select, grouped by group */
  typeOptions: { value: string; label: string }[]
  onSave: () => void
  isPending: boolean
  editingID: string | null
  onTest?: (id: string) => void
  isTesting: boolean
}

export function DatasourceSheet({
  typeOptions,
  onSave, isPending,
  editingID,
  onTest, isTesting,
}: Props) {
  const {
    createOpen, editOpen,
    form,
    closeDialogs,
    updateForm,
  } = useDatasourceStore()

  const open = createOpen || editOpen
  const onOpenChange = (v: boolean) => {
    if (!v) closeDialogs()
  }

  const update = <K extends keyof DatasourceForm>(key: K, value: DatasourceForm[K]) =>
    updateForm(key, value)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <IconDatabase className="size-5 text-primary" />
            {createOpen ? '新增数据源' : '编辑数据源'}
          </SheetTitle>
          <SheetDescription>
            {createOpen ? '添加一个新的数据库连接' : '修改数据库连接信息'}
          </SheetDescription>
        </SheetHeader>

        {createOpen && (
          <div className="px-6 pt-4 pb-0 text-xs text-muted-foreground">
            必填项：名称、类型、主机、端口、用户名{editingID ? '' : '、密码'}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3">
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
                  onValueChange={(v) => update('type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="备注" span={2}>
                <Textarea
                  value={form.remark}
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
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-muted/30">
          {onTest && editingID != null ? (
            <Button
              variant="outline" size="sm"
              disabled={isTesting}
              onClick={() => onTest(editingID)}
            >
              <IconPlugConnected className="size-4" />
              {isTesting ? '测试中…' : '测试连接'}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button size="sm" onClick={onSave} disabled={isPending}>
            {isPending ? '保存中…' : '保存'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
