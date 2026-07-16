import { IconEdit } from '@tabler/icons-react'

import { FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { useUsersStore } from './store'
import type { UserForm } from './store'

interface Props {
  onSave: () => void
  isPending: boolean
}

export function UserEditSheet({ onSave, isPending }: Props) {
  const { editOpen, form, editingID, setEditOpen, updateForm, closeDialogs } = useUsersStore()

  const update = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
    updateForm(key, value)

  return (
    <Sheet
      open={editOpen}
      onOpenChange={(open) => { if (!open) setEditOpen(false) }}
    >
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <IconEdit className="size-5 text-primary" />
            编辑用户
          </SheetTitle>
          <SheetDescription>修改用户基本信息和状态</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3">
            <FormGroup title="用户信息" description="账号基本信息和状态">
              <FormField label="用户名" required>
                <Input
                  value={form.username}
                  onChange={(e) => update('username', e.target.value)}
                />
              </FormField>
              <FormField
                label="密码"
                hint={editingID ? '留空则保持原密码不变' : undefined}
              >
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder={editingID ? '留空则不修改密码' : ''}
                />
              </FormField>
              <FormField label="昵称">
                <Input
                  value={form.nickname ?? ''}
                  onChange={(e) => update('nickname', e.target.value)}
                />
              </FormField>
              <FormField label="状态">
                <Select value={form.status ?? 'active'} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="disabled">disabled</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </FormGroup>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="ghost" size="sm" onClick={() => closeDialogs()}>
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
