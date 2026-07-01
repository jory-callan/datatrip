import { IconPencil, IconUserPlus, IconUsers } from '@tabler/icons-react'

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
import { USER_PAGE_SIZE_OPTIONS } from '@/lib/api/users'

import { useUserColumns } from './columns'
import { useUsersPage, ROLE_CODES } from './use-users'

function UserDialog({
  open, onOpenChange, title, description, form, setForm, onSave, isPending, isEdit, icon: Icon,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: any
  setForm: (fn: (f: any) => any) => void
  onSave: () => void
  isPending: boolean
  isEdit: boolean
  icon: React.ComponentType<{ className?: string }>
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
            <Label>{'用户名'}</Label>
            <Input value={form.username} onChange={(e) => setForm((f: any) => ({ ...f, username: e.target.value }))} required />
          </div>
          <div className="grid gap-2">
            <Label>{'昵称'}</Label>
            <Input value={form.nickname ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, nickname: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>{'密码'}</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((f: any) => ({ ...f, password: e.target.value }))}
              placeholder={isEdit ? '留空则不修改密码' : undefined} required={!isEdit} />
          </div>
          <div className="grid gap-2">
            <Label>{'角色'}</Label>
            <Select value={form.role_code ?? ''} onValueChange={(v) => setForm((f: any) => ({ ...f, role_code: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_CODES.map((rc) => (<SelectItem key={rc.value} value={rc.value}>{rc.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{'状态'}</Label>
            <Select value={form.status ?? 'active'} onValueChange={(v) => setForm((f: any) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="disabled">disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{'取消'}</Button>
          <Button onClick={onSave} disabled={isPending}>{'保存'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UsersPage() {

  const {
    page, setPage, pageSize, setPageSize,
    createOpen, setCreateOpen, editOpen, setEditOpen,
    editingUserID, setEditingUserID, form, setForm,
    usersQuery, data, refetch,
    createUser, updateUser, deleteUser,
    handleCreate, handleUpdate, handleDelete, handleBatchDelete,
    openEdit, resetForm, needCount,
  } = useUsersPage()

  const columns = useUserColumns(
    openEdit, handleDelete,
    updateUser.isPending, deleteUser.isPending,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'用户管理'}</h1>
        <p className="text-sm text-muted-foreground">{'管理系统用户账号和基本信息'}</p>
      </div>

      <div>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconUsers className="size-4" />
              <span>{`共 ${data?.total ?? 0} 个用户`}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.list ?? []}
            loading={usersQuery.isFetching}
            emptyText={'暂无用户'}
            storageKey="table:users:columns"
            enableRowSelection
            getRowId={(row) => String(row.id)}
            toolbar={{
              searchPlaceholder: '搜索用户...',
              createLabel: '新增用户',
              deleteLabel: '批量删除',
              onCreate: () => setCreateOpen(true),
              onRefresh: () => { void refetch() },
              onBatchDelete: handleBatchDelete,
            }}
            pagination={{
              page, pageSize,
              total: data?.total ?? 0, needCount,
              pageSizeOptions: USER_PAGE_SIZE_OPTIONS,
              onPageChange: setPage,
              onPageSizeChange: (nextPageSize) => { setPageSize(nextPageSize); setPage(1) },
            }}
          />
        </CardContent>
      </Card>

      <UserDialog
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}
        title={'新增用户'}
        description={'创建一个可登录后台的新用户'}
        icon={IconUserPlus}
        form={form} setForm={setForm}
        onSave={handleCreate} isPending={createUser.isPending}
        isEdit={false}
      />

      <UserDialog
        open={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingUserID(null); resetForm() } }}
        title={'编辑用户'}
        description={'修改用户基础信息，密码留空则不变'}
        icon={IconPencil}
        form={form} setForm={setForm}
        onSave={handleUpdate} isPending={updateUser.isPending}
        isEdit={true}
      />
    </div>
  )
}
