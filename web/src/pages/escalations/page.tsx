import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconCheck, IconEdit, IconShieldPlus, IconTrash, IconX } from '@tabler/icons-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getApiErrorMessage } from '@/lib/api-client'
import { useProjects } from '@/lib/api/projects'
import {
  useCreateEscalation,
  useApproveEscalation,
  useRejectEscalation,
  useUpdateEscalation,
  useDeleteEscalation,
  useBatchDeleteEscalations,
  useEscalations,
  type Escalation,
} from '@/lib/api/escalations'
import { useAppStore } from '@/stores/app-store'

import { useEscalationColumns } from './columns'
import { useEscalationStore } from './store'
import {
  STATUS_OPTIONS, DURATION_OPTIONS,
  STATUS_LABEL, DURATION_LABEL,
} from './use-escalations'

export function EscalationsPage() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page')) || 1
  const pageSize = Number(sp.get('pageSize')) || 20
  const scope = sp.get('scope') || 'my'
  const statusFilter = sp.get('status') || '_all'

  const setPage = useCallback((p: number) => {
    setSp((prev) => { prev.set('page', String(p)); return prev })
  }, [setSp])
  const setPageSize = useCallback((ps: number) => {
    setSp((prev) => { prev.set('pageSize', String(ps)); prev.set('page', '1'); return prev })
  }, [setSp])

  const user = useAppStore((s) => s.user)
  const userId = user?.id ?? 0
  const canApprove = useCallback((esc: Escalation) => esc.user_id === userId, [userId])

  // Store
  const createOpen = useEscalationStore((s) => s.createOpen)
  const createProjectId = useEscalationStore((s) => s.createProjectId)
  const createReason = useEscalationStore((s) => s.createReason)
  const setCreateOpen = useEscalationStore((s) => s.setCreateOpen)
  const setCreateProjectId = useEscalationStore((s) => s.setCreateProjectId)
  const setCreateReason = useEscalationStore((s) => s.setCreateReason)
  const closeCreate = useEscalationStore((s) => s.closeCreate)

  const editOpen = useEscalationStore((s) => s.editOpen)
  const editReason = useEscalationStore((s) => s.editReason)
  const closeEdit = useEscalationStore((s) => s.closeEdit)

  const approveOpen = useEscalationStore((s) => s.approveOpen)
  const approveDuration = useEscalationStore((s) => s.approveDuration)
  const setApproveDuration = useEscalationStore((s) => s.setApproveDuration)
  const closeApprove = useEscalationStore((s) => s.closeApprove)

  const rejectOpen = useEscalationStore((s) => s.rejectOpen)
  const closeReject = useEscalationStore((s) => s.closeReject)

  const deleteAlertOpen = useEscalationStore((s) => s.deleteAlertOpen)
  const closeDelete = useEscalationStore((s) => s.closeDelete)

  const batchDeleteAlertOpen = useEscalationStore((s) => s.batchDeleteAlertOpen)
  const batchDeleteRows = useEscalationStore((s) => s.batchDeleteRows)
  const closeBatchDelete = useEscalationStore((s) => s.closeBatchDelete)

  // API
  const projectsQuery = useProjects({ page: 1, pageSize: 200, needCount: false })
  const projects = projectsQuery.data?.list ?? []

  const query = useEscalations({
    page, pageSize, needCount: true,
    scope: scope as 'my' | 'pending' | 'all',
    status: statusFilter !== '_all' ? statusFilter : undefined,
  })
  const { data, refetch } = query

  const createMutation = useCreateEscalation()
  const approveMutation = useApproveEscalation()
  const rejectMutation = useRejectEscalation()
  const updateMutation = useUpdateEscalation()
  const deleteMutation = useDeleteEscalation()
  const batchDeleteMutation = useBatchDeleteEscalations()

  // Columns
  const handleOpenCreate = useCallback(() => {
    useEscalationStore.getState().closeCreate()
    setCreateOpen(true)
  }, [setCreateOpen])

  const handleOpenEdit = useCallback((esc: Escalation) => {
    useEscalationStore.getState().openEdit(esc)
  }, [])

  const handleOpenApprove = useCallback((esc: Escalation) => {
    useEscalationStore.getState().openApprove(esc)
  }, [])

  const handleOpenReject = useCallback((esc: Escalation) => {
    useEscalationStore.getState().openReject(esc)
  }, [])

  const handleOpenDelete = useCallback((esc: Escalation) => {
    useEscalationStore.getState().openDelete(esc)
  }, [])

  const columns = useEscalationColumns(
    projects, canApprove,
    handleOpenApprove, handleOpenReject,
    handleOpenEdit, handleOpenDelete,
    approveMutation.isPending, rejectMutation.isPending,
  )

  // Filter options
  const scopeOptions = useMemo(() => [
    { value: 'my', label: '我的申请' },
    { value: 'pending', label: '待我审批' },
    { value: 'all', label: '全部' },
  ], [])

  const statusFilterOptions = useMemo(() => [
    { value: '_all', label: '全部状态' },
    ...STATUS_OPTIONS.filter((s) => s !== 'all').map((value) => ({
      value, label: STATUS_LABEL[value] ?? value,
    })),
  ], [])

  // Handlers
  const handleCreateSubmit = async () => {
    const { createProjectId, createReason } = useEscalationStore.getState()
    if (!createProjectId) {
      toast.error('请选择项目')
      return
    }
    if (!createReason.trim()) {
      toast.error('请填写申请理由')
      return
    }
    try {
      await createMutation.mutateAsync({
        project_id: createProjectId,
        reason: createReason.trim(),
      })
      toast.success('提权申请已提交')
      useEscalationStore.getState().closeCreate()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '提交失败'))
    }
  }

  const handleEditSubmit = async () => {
    const { editTarget, editReason } = useEscalationStore.getState()
    if (!editTarget || !editReason.trim()) {
      toast.error('请填写提权理由')
      return
    }
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, reason: editReason.trim() })
      toast.success('提权申请已更新')
      useEscalationStore.getState().closeEdit()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '更新失败'))
    }
  }

  const handleApprove = async () => {
    const { approveTarget, approveDuration } = useEscalationStore.getState()
    if (!approveTarget) return
    try {
      await approveMutation.mutateAsync({
        id: approveTarget.id,
        duration: approveDuration,
      })
      toast.success('已批准提权申请')
      useEscalationStore.getState().closeApprove()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '审批失败'))
    }
  }

  const handleReject = async () => {
    const { rejectTarget } = useEscalationStore.getState()
    if (!rejectTarget) return
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id })
      toast.success('已拒绝提权申请')
      useEscalationStore.getState().closeReject()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '拒绝失败'))
    }
  }

  const handleDelete = async () => {
    const { deleteAlertTarget } = useEscalationStore.getState()
    if (!deleteAlertTarget) return
    try {
      await deleteMutation.mutateAsync(deleteAlertTarget.id)
      toast.success('已删除提权申请')
      useEscalationStore.getState().closeDelete()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '删除失败'))
    }
  }

  const handleBatchDelete = useCallback((rows: Escalation[]) => {
    if (!rows.length) return
    useEscalationStore.getState().openBatchDelete(rows)
  }, [])

  const handleBatchDeleteConfirm = async () => {
    const { batchDeleteRows } = useEscalationStore.getState()
    if (!batchDeleteRows.length) return
    try {
      await batchDeleteMutation.mutateAsync(batchDeleteRows.map((r) => r.id))
      toast.success('提权申请删除成功')
      useEscalationStore.getState().closeBatchDelete()
    } catch (error) {
      toast.error(getApiErrorMessage(error, '批量删除失败'))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">提权管理</h1>
        <span className="text-xs text-muted-foreground">管理临时数据库权限提权申请</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.list ?? []}
            loading={query.isFetching}
            emptyText="暂无提权申请"
            enableRowSelection
            getRowId={(row) => String(row.id)}
            filters={[
              {
                id: 'scope',
                label: '范围',
                type: 'select',
                defaultValue: 'my',
                options: scopeOptions,
              },
              {
                id: 'status',
                label: '状态',
                type: 'select',
                defaultValue: '_all',
                options: statusFilterOptions,
              },
            ]}
            filterValues={{ scope, status: statusFilter }}
            onFiltersChange={(values) => {
              setSp((prev) => {
                if (values.scope && values.scope !== 'my') prev.set('scope', values.scope)
                else prev.delete('scope')
                if (values.status && values.status !== '_all') prev.set('status', values.status)
                else prev.delete('status')
                prev.set('page', '1')
                return prev
              })
            }}
            toolbar={{
              createLabel: '申请提权',
              onCreate: handleOpenCreate,
              refreshLabel: '刷新',
              deleteLabel: '批量删除',
              onRefresh: () => { void refetch() },
              onBatchDelete: handleBatchDelete,
            }}
            pagination={{
              page,
              pageSize,
              total: data?.total ?? 0,
              needCount: true,
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

      {/* ===== Create Sheet ===== */}
      <Sheet open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open)
        if (!open) { closeCreate() }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <IconShieldPlus className="size-5 text-primary" />
              申请提权
            </SheetTitle>
            <SheetDescription>提交临时数据库权限提权申请，需审批通过后生效</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid gap-2">
              <Label>项目 <span className="text-destructive">*</span></Label>
              <Select value={createProjectId} onValueChange={setCreateProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择项目" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>申请理由 <span className="text-destructive">*</span></Label>
              <Textarea value={createReason} onChange={(e) => setCreateReason(e.target.value)} placeholder="请输入提权理由..." rows={5} />
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" size="sm" onClick={() => { closeCreate(); setCreateOpen(false) }}>取消</Button>
            <Button size="sm" onClick={() => { void handleCreateSubmit() }} disabled={createMutation.isPending}>提交申请</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ===== Edit Sheet ===== */}
      <Sheet open={editOpen} onOpenChange={(open) => {
        if (!open) closeEdit()
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <IconEdit className="size-5 text-primary" />
              编辑提权申请
            </SheetTitle>
            <SheetDescription>修改提权申请理由</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid gap-2">
              <Label>申请理由 <span className="text-destructive">*</span></Label>
              <Textarea
                value={editReason}
                onChange={(e) => useEscalationStore.getState().setEditReason(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" size="sm" onClick={() => closeEdit()}>取消</Button>
            <Button size="sm" onClick={() => { void handleEditSubmit() }} disabled={updateMutation.isPending}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ===== Approve Dialog ===== */}
      <Dialog open={approveOpen} onOpenChange={(open) => {
        if (!open) closeApprove()
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCheck className="size-5 text-green-600" />
              批准提权申请
            </DialogTitle>
            <DialogDescription>确认批准</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <Label>授权时长</Label>
            <Select value={approveDuration} onValueChange={setApproveDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>{DURATION_LABEL[value] ?? value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => closeApprove()}>取消</Button>
            <Button size="sm" onClick={() => { void handleApprove() }} disabled={approveMutation.isPending}>确认批准</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Reject Dialog ===== */}
      <Dialog open={rejectOpen} onOpenChange={(open) => {
        if (!open) closeReject()
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconX className="size-5 text-red-600" />
              拒绝提权申请
            </DialogTitle>
            <DialogDescription>确认拒绝</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => closeReject()}>取消</Button>
            <Button variant="destructive" size="sm" onClick={() => { void handleReject() }} disabled={rejectMutation.isPending}>确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete AlertDialog ===== */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={(open) => {
        if (!open) closeDelete()
      }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-100 *:[svg]:text-red-600">
              <IconTrash className="size-8" />
            </AlertDialogMedia>
            <AlertDialogTitle>删除提权申请</AlertDialogTitle>
            <AlertDialogDescription>确认删除此提权申请？此操作不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeDelete()}>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { void handleDelete() }} disabled={deleteMutation.isPending}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Batch Delete AlertDialog ===== */}
      <AlertDialog open={batchDeleteAlertOpen} onOpenChange={(open) => {
        if (!open) closeBatchDelete()
      }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-100 *:[svg]:text-red-600">
              <IconTrash className="size-8" />
            </AlertDialogMedia>
            <AlertDialogTitle>批量删除提权申请</AlertDialogTitle>
            <AlertDialogDescription>确认删除已选 {batchDeleteRows.length} 个提权申请？此操作不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeBatchDelete()}>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { void handleBatchDeleteConfirm() }} disabled={batchDeleteMutation.isPending}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
