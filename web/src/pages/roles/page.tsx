import { useMemo, useState } from 'react'
import { IconShield } from '@tabler/icons-react'

import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { useRoleColumns } from './columns'
import { useRolesPage } from './use-roles'
import { useRolesStore, type RoleForm } from './store'

// ---------------------------------------------------------------------------
// Create/Edit Sheet
// ---------------------------------------------------------------------------

interface RoleFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: { code: string; name: string; description: string }
  setForm: (fn: (f: { code: string; name: string; description: string }) => typeof f) => void
  onSave: () => void
  isPending: boolean
  editingID: string | null
}

function RoleFormSheet({
  open, onOpenChange, title, description,
  form, setForm, onSave, isPending, editingID,
}: RoleFormSheetProps) {
  const update = <K extends keyof typeof form>(
    key: K, value: (typeof form)[K],
  ) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <IconShield className="size-5 text-primary" />
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                角色标识 <span className="text-destructive">*</span>
              </label>
              {editingID && <p className="text-xs text-muted-foreground">标识不可修改</p>}
              <Input
                value={form.code}
                onChange={(e) => update('code', e.target.value)}
                placeholder="例如：sql_admin、platform_admin"
                disabled={!!editingID}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                角色名称 <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="例如：SQL 管理员"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="选填，描述角色的用途"
                rows={2}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-start gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? '保存中…' : '保存'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Assign Permissions Sheet — 两栏布局，左右分页
// ---------------------------------------------------------------------------

const PER_PAGE = 15

function AssignPermissionsSheet({
  open,
  onOpenChange,
  roleName,
  roleCode,
  permsLoading,
  rolePermsLoading,
  filteredPermissions,
  assignedPermIds,
  selectedPermId,
  onSelectPerm,
  assignPermSearch,
  onSearchChange,
  selectedPermission,
  onTogglePermission,
  assignPermPending,
  unassignPermPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleName: string
  roleCode: string
  permsLoading: boolean
  rolePermsLoading: boolean
  filteredPermissions: { id: string; code: string; name: string; module?: string; description?: string; is_system: boolean }[]
  assignedPermIds: Set<string>
  selectedPermId: string | null
  onSelectPerm: (id: string | null) => void
  assignPermSearch: string
  onSearchChange: (value: string) => void
  selectedPermission: { id: string; code: string; name: string; module?: string; description?: string; is_system: boolean } | null
  onTogglePermission: (permId: string) => void
  assignPermPending: boolean
  unassignPermPending: boolean
}) {
  // Left panel pagination
  const [leftPage, setLeftPage] = useState(1)
  const leftTotalPages = Math.max(1, Math.ceil(filteredPermissions.length / PER_PAGE))
  const leftData = filteredPermissions.slice((leftPage - 1) * PER_PAGE, leftPage * PER_PAGE)

  // Right panel pagination — assigned permissions list
  const assignedPerms = useMemo(
    () => filteredPermissions.filter((p) => assignedPermIds.has(p.id)),
    [filteredPermissions, assignedPermIds],
  )
  const [rightPage, setRightPage] = useState(1)
  const rightTotalPages = Math.max(1, Math.ceil(assignedPerms.length / PER_PAGE))
  const rightData = assignedPerms.slice((rightPage - 1) * PER_PAGE, rightPage * PER_PAGE)

  // Reset page when search changes
  const [prevSearch, setPrevSearch] = useState(assignPermSearch)
  if (assignPermSearch !== prevSearch) {
    setPrevSearch(assignPermSearch)
    setLeftPage(1)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-5xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <IconShield className="size-5 text-primary" />
            {roleName}
          </SheetTitle>
          <SheetDescription>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{roleCode}</code>
            <span className="ml-2 text-xs text-muted-foreground">分配或移除权限码</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 gap-6 overflow-hidden pt-4" style={{ height: 'calc(100vh - 12rem)' }}>
          {/* ---- Left panel: all permissions ---- */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                所有权限码
              </h3>
              <span className="text-xs text-muted-foreground">{filteredPermissions.length} 个</span>
            </div>
            <Input
              placeholder="搜索权限码..."
              value={assignPermSearch}
              onChange={(e) => onSearchChange(e.target.value)}
            />

            <div className="flex-1 overflow-y-auto rounded-md border">
              {permsLoading ? (
                <div className="space-y-1 p-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : leftData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {assignPermSearch ? '未匹配到权限码' : '暂无权限码'}
                </p>
              ) : (
                <div className="divide-y">
                  {leftData.map((perm) => {
                    const assigned = assignedPermIds.has(perm.id)
                    const selected = perm.id === selectedPermId
                    return (
                      <div
                        key={perm.id}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors',
                          selected ? 'bg-accent' : 'hover:bg-muted/50',
                        )}
                        onClick={() => onSelectPerm(perm.id)}
                      >
                        <Checkbox
                          checked={assigned}
                          disabled={rolePermsLoading || assignPermPending || unassignPermPending}
                          onCheckedChange={() => onTogglePermission(perm.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{perm.name}</span>
                            <code className="rounded bg-muted px-1 text-xs font-mono text-muted-foreground shrink-0">
                              {perm.code}
                            </code>
                          </div>
                          {perm.module && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {perm.module}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Left pagination */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>第 {leftPage}/{leftTotalPages} 页</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={leftPage <= 1} onClick={() => setLeftPage((p) => p - 1)}>上一页</Button>
                <Button variant="outline" size="sm" disabled={leftPage >= leftTotalPages} onClick={() => setLeftPage((p) => p + 1)}>下一页</Button>
              </div>
            </div>
          </div>

          {/* ---- Right panel: currently assigned permissions ---- */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                已分配的权限码
              </h3>
              <span className="text-xs text-muted-foreground">{assignedPerms.length} 个</span>
            </div>

            <div className="flex-1 overflow-y-auto rounded-md border">
              {rolePermsLoading ? (
                <div className="space-y-1 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : rightData.length === 0 ? (
                <div className="flex items-center justify-center h-full rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    {assignPermSearch ? '未匹配到已分配的权限码' : '暂未分配权限码'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {rightData.map((perm) => {
                    const selected = perm.id === selectedPermId
                    return (
                      <div
                        key={perm.id}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors',
                          selected ? 'bg-accent' : 'hover:bg-muted/50',
                        )}
                        onClick={() => onSelectPerm(perm.id)}
                      >
                        <Checkbox
                          checked={true}
                          disabled={rolePermsLoading || assignPermPending || unassignPermPending}
                          onCheckedChange={() => onTogglePermission(perm.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{perm.name}</span>
                            <code className="rounded bg-muted px-1 text-xs font-mono text-muted-foreground shrink-0">
                              {perm.code}
                            </code>
                          </div>
                          {perm.module && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {perm.module}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right pagination */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>第 {rightPage}/{rightTotalPages} 页</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={rightPage <= 1} onClick={() => setRightPage((p) => p - 1)}>上一页</Button>
                <Button variant="outline" size="sm" disabled={rightPage >= rightTotalPages} onClick={() => setRightPage((p) => p + 1)}>下一页</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-start border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function RolesPage() {
  // Store state
  const createOpen = useRolesStore((s) => s.createOpen)
  const editOpen = useRolesStore((s) => s.editOpen)
  const editingID = useRolesStore((s) => s.editingID)
  const form = useRolesStore((s) => s.form)
  const assignPermsOpen = useRolesStore((s) => s.assignPermsOpen)
  const assignPermSearch = useRolesStore((s) => s.assignPermSearch)
  const selectedPermId = useRolesStore((s) => s.selectedPermId)
  const assignPermsRoleId = useRolesStore((s) => s.assignPermsRoleId)
  const setCreateOpen = useRolesStore((s) => s.setCreateOpen)
  const closeDialogs = useRolesStore((s) => s.closeDialogs)
  const closeAssignPerms = useRolesStore((s) => s.closeAssignPerms)
  const setSelectedPermId = useRolesStore((s) => s.setSelectedPermId)
  const setAssignPermSearch = useRolesStore((s) => s.setAssignPermSearch)
  const openEdit = useRolesStore((s) => s.openEdit)
  const openAssignPerms = useRolesStore((s) => s.openAssignPerms)

  // Hook data
  const {
    allRoles, rolesLoading, refetch,
    createMutation, updateMutation, deleteMutation,
    handleCreate, handleUpdate, handleDelete, handleBatchDelete,
    permsLoading, rolePermsLoading,
    assignedPermIds, filteredPermissions, selectedPermission,
    handleTogglePermission,
    assignPermPending, unassignPermPending,
  } = useRolesPage()

  const [rolePage, setRolePage] = useState(1)
  const [rolePageSize, setRolePageSize] = useState(20)
  const paginatedRoles = useMemo(
    () => allRoles.slice((rolePage - 1) * rolePageSize, rolePage * rolePageSize),
    [allRoles, rolePage, rolePageSize],
  )

  const columns = useRoleColumns(openEdit, openAssignPerms, handleDelete, deleteMutation.isPending)

  const selectedRole = useMemo(
    () => (assignPermsRoleId ? allRoles.find((r) => r.id === assignPermsRoleId) : null),
    [allRoles, assignPermsRoleId],
  )

  // Adapter: store form setter matches RoleFormSheet's function-signature setForm
  const storeSetForm = (fn: (f: RoleForm) => RoleForm) => {
    const store = useRolesStore.getState()
    store.setForm(fn(store.form))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">角色管理</h1>
        <span className="text-xs text-muted-foreground">管理角色及其权限码分配</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={paginatedRoles}
            loading={rolesLoading}
            emptyText="暂无角色"
            enableRowSelection
            getRowId={(row) => row.id}
            toolbar={{
              searchPlaceholder: '搜索角色…',
              createLabel: '新建角色',
              deleteLabel: '删除',
              onCreate: () => setCreateOpen(true),
              onRefresh: () => { void refetch() },
              onBatchDelete: (rows) => handleBatchDelete(rows),
            }}
            pagination={{
              page: rolePage,
              pageSize: rolePageSize,
              total: allRoles.length,
              needCount: true,
              onPageChange: setRolePage,
              onPageSizeChange: (size) => { setRolePageSize(size); setRolePage(1) },
            }}
          />
        </CardContent>
      </Card>

      {/* Create Sheet */}
      <RoleFormSheet
        open={createOpen}
        onOpenChange={(open) => { if (!open) { closeDialogs() } }}
        title="新建角色"
        description="角色是一组权限码的集合，创建后可绑定权限码"
        form={form}
        setForm={storeSetForm}
        onSave={handleCreate}
        isPending={createMutation.isPending}
        editingID={null}
      />

      {/* Edit Sheet */}
      <RoleFormSheet
        open={editOpen}
        onOpenChange={(open) => { if (!open) { closeDialogs() } }}
        title="编辑角色"
        description={editingID ? '修改角色信息' : ''}
        form={form}
        setForm={storeSetForm}
        onSave={handleUpdate}
        isPending={updateMutation.isPending}
        editingID={editingID}
      />

      {/* Assign Permissions Sheet */}
      <AssignPermissionsSheet
        open={assignPermsOpen}
        onOpenChange={(open) => { if (!open) closeAssignPerms() }}
        roleName={selectedRole?.name ?? ''}
        roleCode={selectedRole?.code ?? ''}
        permsLoading={permsLoading}
        rolePermsLoading={rolePermsLoading}
        filteredPermissions={filteredPermissions}
        assignedPermIds={assignedPermIds}
        selectedPermId={selectedPermId}
        onSelectPerm={setSelectedPermId}
        assignPermSearch={assignPermSearch}
        onSearchChange={setAssignPermSearch}
        selectedPermission={selectedPermission}
        onTogglePermission={handleTogglePermission}
        assignPermPending={assignPermPending}
        unassignPermPending={unassignPermPending}
      />
    </div>
  )
}
