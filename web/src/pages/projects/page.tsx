import { IconFolder, IconPencil, IconTrash, IconUserPlus, IconUsers } from '@tabler/icons-react'

import { DataTable } from '@/components/common/data-table'
import { MultiSelect } from '@/components/common/multi-select'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useProjectColumns } from './columns'
import { useProjectsPage, ROLES } from './use-projects'

export function ProjectsPage() {

  const {
    page, setPage, pageSize, setPageSize,
    createOpen, setCreateOpen, editOpen, setEditOpen,
    membersProjectId, editingID, setEditingID,
    form, setForm, membersForm,
    addUserId, setAddUserId, addUserRole, setAddUserRole,
    activeTab, setActiveTab, needCount,
    query, data, refetch,
    datasources, users, dsRules, webhookList,
    combinedMembers, userMap,
    datasourceOptions, webhookOptions, userOptions,
    createMutation, updateMutation, deleteMutation, updateMembersMutation,
    handleCreate, handleUpdate, handleDelete,
    openEdit, openMembers, closeMembers,
    handleAddMember, removeMember, changeRole,
    handleSaveMembers, resetForm,
    selectedMemberIds, setSelectedMemberIds, toggleMemberSelect, toggleSelectAll,
  } = useProjectsPage()

  const columns = useProjectColumns(
    datasources, openMembers, openEdit, handleDelete,
    updateMutation.isPending, deleteMutation.isPending,
  )

  const renderBasicTab = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>{'项目名称'}</Label>
        <Input value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="grid gap-2">
        <Label>{'数据源'}</Label>
        <Select value={String(form.datasource_id)} onValueChange={(v) => setForm((f: any) => ({ ...f, datasource_id: Number(v) }))}>
          <SelectTrigger><SelectValue placeholder={'请选择数据源'} /></SelectTrigger>
          <SelectContent>
            {datasources.map((ds) => (<SelectItem key={ds.id} value={String(ds.id)}>{ds.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>{'数据库'}</Label>
        <Input
          value={(form.databases ?? []).join(', ')}
          onChange={(e) => setForm((f: any) => ({ ...f, databases: e.target.value.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean) }))}
          placeholder={'用逗号分隔多个数据库名'}
        />
        {(form.databases ?? []).some((db: string) => db.includes('*') || db.includes('?')) && (
          <p className="text-xs text-muted-foreground">
            {'通配符模式已启用'}：{form.databases.filter((db: string) => db.includes('*') || db.includes('?')).join(', ')}
            {form.databases.includes('*') && <span> — {'匹配该数据源下所有数据库'}</span>}
          </p>
        )}
      </div>
    </div>
  )

  const renderApprovalTab = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>{'审批模式'}</Label>
        <Select value={form.approval_mode} onValueChange={(v) => setForm((f: any) => ({ ...f, approval_mode: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any_one">{'任意一人'}</SelectItem>
            <SelectItem value="all">{'全部'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="auto-match-approver"
          checked={!!form.auto_match_approver}
          onCheckedChange={(checked) => setForm((f: any) => ({ ...f, auto_match_approver: checked }))}
        />
        <Label htmlFor="auto-match-approver" className="text-sm">{'自动匹配审批人（项目负责人自动成为审批人）'}</Label>
      </div>
      <MultiSelect
        label={'审批人'}
        options={users.map((u) => ({ value: String(u.id), label: u.nickname || u.username }))}
        selected={form.approver_ids.map(String)}
        onChange={(vals) => setForm((f: any) => ({ ...f, approver_ids: vals.map(Number) }))}
        placeholder={'搜索审批人...'}
        searchPlaceholder={'搜索用户...'}
      />
    </div>
  )

  const renderResourcesTab = () => (
    <div className="space-y-4">
      <MultiSelect
        label={'Webhook'}
        options={webhookOptions}
        selected={form.webhook_ids.map(String)}
        onChange={(vals) => setForm((f: any) => ({ ...f, webhook_ids: vals.map(Number) }))}
        placeholder={'选择 Webhook...'}
        searchPlaceholder={'搜索 Webhook...'}
        emptyText={'暂无 Webhook，请先在 Webhook 页面创建'}
      />
    </div>
  )

  const renderFormDialog = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">{'基本信息'}</TabsTrigger>
        <TabsTrigger value="approval">{'审批配置'}</TabsTrigger>
        <TabsTrigger value="resources">{'关联资源'}</TabsTrigger>
      </TabsList>
      <div className="max-h-[55vh] overflow-y-auto px-0.5">
        <TabsContent value="basic">{renderBasicTab()}</TabsContent>
        <TabsContent value="approval">{renderApprovalTab()}</TabsContent>
        <TabsContent value="resources">{renderResourcesTab()}</TabsContent>
      </div>
    </Tabs>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'数据项目管理'}</h1>
        <p className="text-sm text-muted-foreground">{'管理数据项目和成员'}</p>
      </div>

      <div>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconFolder className="size-4" />
              <span>{`共 ${data?.total ?? 0} 个项目`}</span>
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
            emptyText={'暂无项目'}
            storageKey="table:projects:columns"
            getRowId={(row) => String(row.id)}
            toolbar={{
              searchPlaceholder: '搜索项目...',
              createLabel: '新增项目',
              onCreate: () => { setCreateOpen(true); resetForm() },
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

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFolder className="size-5 text-primary" />
              {'新增项目'}
            </DialogTitle>
            <DialogDescription>{'创建一个新的数据项目'}</DialogDescription>
          </DialogHeader>
          <div className="py-2">{renderFormDialog()}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>{'取消'}</Button>
            <Button onClick={() => { void handleCreate() }} disabled={createMutation.isPending}>{'保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingID(null); resetForm() } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconPencil className="size-5 text-primary" />
              {'编辑项目'}
            </DialogTitle>
            <DialogDescription>{'修改项目配置'}</DialogDescription>
          </DialogHeader>
          <div className="py-2">{renderFormDialog()}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditingID(null); resetForm() }}>{'取消'}</Button>
            <Button onClick={() => { void handleUpdate() }} disabled={updateMutation.isPending}>{'保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={membersProjectId != null} onOpenChange={(open) => { if (!open) closeMembers() }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <IconUsers className="size-5 text-primary" />
              {'成员管理'}
            </SheetTitle>
            <SheetDescription>{'管理项目成员及其角色'}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-3">
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                <IconUsers className="size-4 text-muted-foreground" />
                {'当前成员'}
              </h4>
              {combinedMembers.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    disabled={selectedMemberIds.length === 0}
                    onClick={() => {
                      selectedMemberIds.forEach((id) => removeMember(id))
                      setSelectedMemberIds([])
                    }}
                  >
                    <IconTrash className="size-4 mr-1" />
                    {`移除选中 (${selectedMemberIds.length})`}
                  </Button>
                </div>
              )}
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="w-10 px-3 py-2">
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={combinedMembers.length > 0 && selectedMemberIds.length === combinedMembers.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{'用户'}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{'角色'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedMembers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          {'暂无成员'}
                        </td>
                      </tr>
                    ) : (
                      combinedMembers.map((m) => (
                        <tr key={m.user_id} className="border-b last:border-b-0">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              className="size-4"
                              checked={selectedMemberIds.includes(m.user_id)}
                              onChange={() => toggleMemberSelect(m.user_id)}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm">{userMap.get(m.user_id) ?? `#${m.user_id}`}</td>
                          <td className="px-3 py-2">
                            <Select value={m.role} onValueChange={(role) => changeRole(m.user_id, role)}>
                              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                <IconUserPlus className="size-4 text-muted-foreground" />
                {'添加成员'}
              </h4>
              <div className="flex items-end gap-2">
                <div className="flex-1 grid gap-1.5">
                  <Label className="text-xs">{'用户'}</Label>
                  <Select value={String(addUserId)} onValueChange={(v) => setAddUserId(Number(v))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={'选择用户...'} /></SelectTrigger>
                    <SelectContent>
                      {userOptions.map((u) => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">{'角色'}</Label>
                  <Select value={addUserRole} onValueChange={setAddUserRole}>
                    <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={handleAddMember}>
                  <IconUserPlus className="size-4" />{'添加'}
                </Button>
              </div>
            </div>
          </div>

          <SheetFooter className="px-4">
            <Button variant="outline" onClick={closeMembers}>{'取消'}</Button>
            <Button onClick={() => { void handleSaveMembers() }} disabled={updateMembersMutation.isPending}>{'保存成员'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
