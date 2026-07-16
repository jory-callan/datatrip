import { useMemo, useState } from 'react'
import { IconEdit, IconLink, IconLock, IconUser } from '@tabler/icons-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
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

import { getApiErrorMessage } from '@/lib/api-client'
import {
  usePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  usePermissionBindings,
} from '@/lib/api/permissions'

import { usePermissionColumns } from './columns'
import { usePermStore } from './store'
import type { PermFormData } from './store'

export function PermissionCodesPage() {
  // Store (dialog + form state)
  const {
    createOpen, setCreateOpen,
    editOpen, setEditOpen,
    editingID,
    viewBindingsOpen, setViewBindingsOpen,
    viewingPermId,
    form,
    openEdit, openViewBindings,
    closeDialogs,
    updateForm,
    resetForm,
  } = usePermStore()

  // Client-side pagination
  const [permPage, setPermPage] = useState(1)
  const [permPageSize, setPermPageSize] = useState(20)

  // API
  const query = usePermissions()
  const { data, refetch } = query
  const createMutation = useCreatePermission()
  const updateMutation = useUpdatePermission()
  const deleteMutation = useDeletePermission()
  const { data: bindingsData, isLoading: bindingsLoading } = usePermissionBindings(viewingPermId)

  const paginatedData = useMemo(
    () => (data ?? []).slice((permPage - 1) * permPageSize, permPage * permPageSize),
    [data, permPage, permPageSize],
  )

  // Helpers
  const update = <K extends keyof PermFormData>(key: K, value: PermFormData[K]) =>
    updateForm(key, value)

  // Handlers
  const handleCreate = async () => {
    if (!form.code || !form.name) {
      toast.error('请填写权限码和名称')
      return
    }
    try {
      await createMutation.mutateAsync({
        code: form.code.trim(),
        name: form.name.trim(),
        module: form.module.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      toast.success('权限码创建成功')
      setCreateOpen(false)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '创建权限码失败'))
    }
  }

  const handleUpdate = async () => {
    if (!editingID) {
      toast.error('请选择要编辑的权限码')
      return
    }
    try {
      const payload: { id: string; name?: string; module?: string; description?: string } = { id: editingID }
      if (form.name?.trim()) payload.name = form.name.trim()
      if (form.module?.trim()) payload.module = form.module.trim()
      if (form.description?.trim()) payload.description = form.description.trim()
      await updateMutation.mutateAsync(payload)
      toast.success('权限码更新成功')
      closeDialogs()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '更新权限码失败'))
    }
  }

  const handleDelete = async (perm: { id: string; code: string }) => {
    if (!window.confirm(`确认删除权限码「${perm.code}」？`)) return
    try {
      await deleteMutation.mutateAsync(perm.id)
      toast.success('权限码已删除')
    } catch (error) {
      toast.error(getApiErrorMessage(error, '删除权限码失败'))
    }
  }

  const handleBatchDelete = async (rows: { id: string; code: string }[]) => {
    if (!rows.length) return
    if (!window.confirm(`确认删除已选 ${rows.length} 个权限码？`)) return
    let success = 0
    for (const perm of rows) {
      try {
        await deleteMutation.mutateAsync(perm.id)
        success++
      } catch (err) {
        toast.error(getApiErrorMessage(err, `删除「${perm.code}」失败`))
      }
    }
    if (success > 0) {
      toast.success(`${success} 个权限码已删除`)
      void refetch()
    }
  }

  // Columns
  const columns = usePermissionColumns(
    (perm) => openEdit(perm),
    (perm) => openViewBindings(perm),
    handleDelete,
    updateMutation.isPending,
    deleteMutation.isPending,
  )

  const bindings = bindingsData

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">权限码管理</h1>
        <span className="text-xs text-muted-foreground">
          按 <code className="rounded bg-muted px-1">模块:功能:动作</code> 格式定义权限码，绑定到角色后生效
        </span>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={query.isFetching}
        emptyText="暂无权限码"
        enableRowSelection
        getRowId={(row) => String(row.id)}
        toolbar={{
          createLabel: '新建权限码',
          deleteLabel: '批量删除',
          onCreate: () => setCreateOpen(true),
          onRefresh: () => { void refetch() },
          onBatchDelete: handleBatchDelete,
        }}
        pagination={{
          page: permPage,
          pageSize: permPageSize,
          total: (data ?? []).length,
          needCount: true,
          onPageChange: setPermPage,
          onPageSizeChange: (size) => { setPermPageSize(size); setPermPage(1) },
        }}
      />

      {/* ===== Create Sheet ===== */}
      <Sheet open={createOpen} onOpenChange={(open) => { if (!open) closeDialogs() }}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <IconLock className="size-5 text-primary" />
              新建权限码
            </SheetTitle>
            <SheetDescription>按 模块:功能:动作 格式定义，如 db:project:view</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-1 space-y-4">
            <FormGroup title="基本信息" description="权限码的定义和分类信息">
              <FormField label="权限码" span={2} required>
                <Input
                  value={form.code}
                  onChange={(e) => update('code', e.target.value)}
                  placeholder="例如：db:project:view"
                />
              </FormField>
              <FormField label="名称" required>
                <Input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="例如：项目查看"
                />
              </FormField>
              <FormField label="所属模块" hint="用来分类，如 db、platform">
                <Input
                  value={form.module}
                  onChange={(e) => update('module', e.target.value)}
                  placeholder="选填"
                />
              </FormField>
              <FormField label="描述" span={2}>
                <Textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="选填，描述权限码的用途"
                  rows={2}
                />
              </FormField>
            </FormGroup>
          </div>
          <div className="flex justify-start gap-2 border-t pt-4">
            <Button variant="ghost" onClick={() => { setCreateOpen(false); resetForm() }}>取消</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? '创建中…' : '创建'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== Edit Sheet ===== */}
      <Sheet open={editOpen} onOpenChange={(open) => { if (!open) closeDialogs() }}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <IconEdit className="size-5 text-primary" />
              编辑权限码
            </SheetTitle>
            <SheetDescription>修改权限码的名称、模块和描述，标识不可修改</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-1 space-y-4">
            <FormGroup title="基本信息" description="权限码标识不可修改">
              <FormField label="权限码" span={2} required>
                <Input value={form.code} disabled className="bg-muted" />
              </FormField>
              <FormField label="名称" required>
                <Input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </FormField>
              <FormField label="所属模块" hint="用来分类，如 db、platform">
                <Input
                  value={form.module}
                  onChange={(e) => update('module', e.target.value)}
                />
              </FormField>
              <FormField label="描述" span={2}>
                <Textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={2}
                />
              </FormField>
            </FormGroup>
          </div>
          <div className="flex justify-start gap-2 border-t pt-4">
            <Button variant="ghost" onClick={() => { setEditOpen(false); resetForm() }}>取消</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '保存中…' : '保存'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== View Bindings Sheet ===== */}
      <Sheet open={viewBindingsOpen} onOpenChange={(open) => { if (!open) { setViewBindingsOpen(false) } }}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <IconLink className="size-5 text-primary" />
              权限绑定详情
            </SheetTitle>
            {bindings && (
              <SheetDescription className="flex flex-wrap items-center gap-2 pt-1">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-semibold">
                  {bindings.permission.code}
                </code>
                <span>{bindings.permission.name}</span>
                {bindings.permission.description && (
                  <span className="text-muted-foreground text-xs ml-1">— {bindings.permission.description}</span>
                )}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-1">
            {bindingsLoading ? (
              <div className="space-y-3 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-7 w-full" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-7 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ) : !bindings ? (
              <p className="text-sm text-muted-foreground py-8 text-center">加载失败</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 pt-3">
                {/* Roles (left column) */}
                <div className="min-h-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <IconUser className="size-3.5" />
                    绑定的角色 <span className="font-normal">({bindings.roles.length})</span>
                  </h3>
                  {bindings.roles.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">暂无绑定的角色</p>
                  ) : (
                    <div className="divide-y rounded-md border text-xs max-h-[400px] overflow-y-auto">
                      {bindings.roles.map((r: { id: string; code: string; name: string }) => (
                        <div key={r.id} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/50 transition-colors">
                          <code className="rounded bg-muted px-1 font-mono text-[11px] leading-5 truncate max-w-[120px] shrink-0">
                            {r.code}
                          </code>
                          <span className="text-muted-foreground truncate">{r.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Users (right column) */}
                <div className="min-h-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <IconUser className="size-3.5" />
                    受影响的用户 <span className="font-normal">({bindings.users.length})</span>
                  </h3>
                  {bindings.users.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">暂无受影响的用户</p>
                  ) : (
                    <div className="divide-y rounded-md border text-xs max-h-[400px] overflow-y-auto">
                      {bindings.users.map((u: { id: string; username: string; nickname: string }) => (
                        <div key={u.id} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/50 transition-colors">
                          <span className="font-medium truncate">{u.nickname || u.username}</span>
                          {u.nickname && (
                            <span className="text-muted-foreground shrink-0">(@{u.username})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-start border-t pt-4">
            <Button variant="ghost" onClick={() => setViewBindingsOpen(false)}>关闭</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
