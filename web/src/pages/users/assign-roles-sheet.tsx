import { IconUserCheck } from '@tabler/icons-react'
import type { Role } from '@/lib/api/roles'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { useUsersStore } from './store'

interface Props {
  allRoles: Role[]
  assignRoleIds: Set<string>
  assignRoleSearch: string
  onAssignRoleSearchChange: (v: string) => void
  onAssignRole: (roleId: string) => void
  onUnassignRole: (roleId: string) => void
  assignRolePending: boolean
  unassignRolePending: boolean
  selectedRolePermissionDetails: { id: string; name: string; code: string; description?: string }[]
}

export function AssignRolesSheet({
  allRoles,
  assignRoleIds,
  assignRoleSearch,
  onAssignRoleSearchChange,
  onAssignRole,
  onUnassignRole,
  assignRolePending,
  unassignRolePending,
  selectedRolePermissionDetails,
}: Props) {
  const { assignRolesOpen, assignRoleSelectedRoleId, setAssignRoleSelectedRoleId, closeAssignRoles } = useUsersStore()

  const filteredRoles = allRoles.filter((r) => {
    if (!assignRoleSearch) return true
    const q = assignRoleSearch.toLowerCase()
    return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
  })

  const selectedRole = assignRoleSelectedRoleId
    ? allRoles.find((r) => r.id === assignRoleSelectedRoleId) ?? null
    : null

  return (
    <Sheet
      open={assignRolesOpen}
      onOpenChange={(open) => { if (!open) closeAssignRoles() }}
    >
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <IconUserCheck className="size-5 text-primary" />
            分配角色
          </SheetTitle>
          <SheetDescription>为用户分配或移除角色，点击角色行可查看其权限码</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 gap-4 px-6 py-5 overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
          {/* ---- Left panel: role list ---- */}
          <div className="w-72 shrink-0 flex flex-col gap-3">
            <Input
              placeholder="搜索角色..."
              value={assignRoleSearch}
              onChange={(e) => onAssignRoleSearchChange(e.target.value)}
            />

            <div className="flex-1 overflow-y-auto rounded-md border">
              {filteredRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {assignRoleSearch ? '未匹配到角色' : '暂无角色'}
                </p>
              ) : (
                <div className="divide-y">
                  {filteredRoles.map((role) => {
                    const assigned = assignRoleIds.has(role.id)
                    const selected = role.id === assignRoleSelectedRoleId
                    return (
                      <div
                        key={role.id}
                        className={`
                            flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors
                            ${selected ? 'bg-accent' : 'hover:bg-muted/50'}
                          `}
                        onClick={() => setAssignRoleSelectedRoleId(role.id)}
                      >
                        <Checkbox
                          checked={assigned}
                          disabled={assignRolePending || unassignRolePending}
                          onCheckedChange={() => {
                            if (assigned) {
                              onUnassignRole(role.id)
                            } else {
                              onAssignRole(role.id)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{role.name}</span>
                            <code className="rounded bg-muted px-1 text-xs font-mono text-muted-foreground shrink-0">
                              {role.code}
                            </code>
                          </div>
                          {role.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ---- Right panel: selected role permissions ---- */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {selectedRole ? (
              <>
                <div className="rounded-md border p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{selectedRole.name}</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                      {selectedRole.code}
                    </code>
                  </div>
                  {selectedRole.description && (
                    <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto rounded-md border">
                  {selectedRolePermissionDetails.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      该角色暂无权限码
                    </p>
                  ) : (
                    <div className="divide-y">
                      {selectedRolePermissionDetails.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-sm">{perm.name}</span>
                            {perm.description && (
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            )}
                          </div>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground shrink-0 ml-2">
                            {perm.code}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">请在左侧选择一个角色查看权限码</p>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="ghost" size="sm" onClick={() => closeAssignRoles()}>
            关闭
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
