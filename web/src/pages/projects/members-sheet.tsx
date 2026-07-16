import { IconTrash, IconUserPlus, IconUsers } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'

import { ROLES, useProjectStore } from './store'

interface Props {
  membersProjectId: string | null
  /** 当前已加载的现有成员（来自 API） */
  existingMembers: { user_id: string; role: string }[]
  /** 可用于添加的用户选项（尚未在项目中的用户） */
  userOptions: { value: string; label: string }[]
  /** 用户名/昵称映射 */
  userMap: Map<string, string>
  onSave: () => void
  isSaving: boolean
}

export function MembersSheet({
  membersProjectId,
  existingMembers,
  userOptions,
  userMap,
  onSave,
  isSaving,
}: Props) {
  const {
    membersForm,
    addUserId, addUserRole,
    closeMembers, setAddUserId, setAddUserRole,
    addMember, removeMember, changeRole,
  } = useProjectStore()

  const open = membersProjectId != null
  const onOpenChange = (v: boolean) => {
    if (!v) closeMembers()
  }

  // Merge existing members with local form changes
  // When membersForm is empty (fresh open), show existingMembers
  // Otherwise prefer membersForm (local edits)
  const displayMembers = membersForm.length > 0 ? membersForm : existingMembers

  const handleAddMember = () => {
    if (!addUserId) {
      toast.error('请选择用户')
      return
    }
    const ok = addMember()
    if (!ok) {
      toast.error('该用户已是成员')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <IconUsers className="size-5 text-primary" />
            成员管理
          </SheetTitle>
          <SheetDescription>
            管理项目成员及其角色，保存后立即生效
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4 pt-4">
          {/* Add member */}
          <div className="rounded-md border p-3 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              添加成员
            </h4>
            <div className="flex items-end gap-2">
              <div className="flex-1 grid gap-1.5">
                <span className="text-xs text-muted-foreground">用户</span>
                <Select
                  value={addUserId || '_placeholder'}
                  onValueChange={(v) => v !== '_placeholder' && setAddUserId(v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="选择用户..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userOptions.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">角色</span>
                <Select
                  value={addUserRole}
                  onValueChange={setAddUserRole}
                >
                  <SelectTrigger className="h-9 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                onClick={handleAddMember}
              >
                <IconUserPlus className="size-4" />
                添加
              </Button>
            </div>
          </div>

          {/* Member list */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <IconUsers className="size-3.5" />
              当前成员
              <span className="font-normal text-muted-foreground">
                ({displayMembers.length})
              </span>
            </h4>
            {displayMembers.length === 0 ? (
              <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                暂无成员
              </div>
            ) : (
              <div className="divide-y rounded-md border">
                {displayMembers.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {(userMap.get(m.user_id) ?? `#${m.user_id}`).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">
                        {userMap.get(m.user_id) ?? `#${m.user_id}`}
                      </p>
                    </div>
                    <Select
                      value={m.role}
                      onValueChange={(role) => changeRole(m.user_id, role)}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeMember(m.user_id)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="px-1 pt-4 border-t">
          <Button variant="outline" onClick={closeMembers}>
            关闭
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? '保存中…' : '保存成员'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
