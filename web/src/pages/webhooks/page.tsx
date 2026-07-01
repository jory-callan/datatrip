import { IconPencil, IconWebhook } from '@tabler/icons-react'

import { DataTable } from '@/components/common/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { WEBHOOK_EVENTS } from '@/lib/api/webhooks'

import { useWebhookColumns } from './columns'
import { useWebhooksPage } from './use-webhooks'

function WebhookDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  form,
  onToggleEvent,
  onSave,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  form: { name: string; scope: string; url: string; enabled: boolean; events: string[] }
  onToggleEvent: (event: string) => void
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
            <Label>{'名称'}</Label>
            <Input value={form.name} onChange={(e) => (form.name = e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>{'范围'}</Label>
            <Select value={form.scope} onValueChange={(v) => (form.scope = v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="global">global</SelectItem>
                <SelectItem value="project">project</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{'URL'}</Label>
            <Input value={form.url} onChange={(e) => (form.url = e.target.value)} required placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.enabled} onCheckedChange={(v) => (form.enabled = v)} />
            <Label>{'启用'}</Label>
          </div>
          <div className="grid gap-2">
            <Label>{'事件'}</Label>
            <div className="flex flex-col gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
              {WEBHOOK_EVENTS.map((event) => (
                <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.events.includes(event)}
                    onCheckedChange={() => onToggleEvent(event)}
                  />
                  <span className="font-mono text-xs">{event}</span>
                </label>
              ))}
            </div>
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

export function WebhooksPage() {

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
    toggleEvent, resetForm, needCount,
  } = useWebhooksPage()

  const columns = useWebhookColumns(openEdit, updateMutation.isPending)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'Webhook'}</h1>
        <p className="text-sm text-muted-foreground">{'管理 Webhook 通知'}</p>
      </div>

      <div>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconWebhook className="size-4" />
              <span>{`共 ${data?.total ?? 0} 个 Webhook`}</span>
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
            emptyText={'暂无 Webhook'}
            storageKey="table:webhooks:columns"
            getRowId={(row) => String(row.id)}
            toolbar={{
              searchPlaceholder: '搜索 Webhook...',
              createLabel: '新增 Webhook',
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

      <WebhookDialog
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}
        title={'新增 Webhook'}
        description={'添加一个新的 Webhook 通知'}
        icon={IconWebhook}
        form={form}
        onToggleEvent={toggleEvent}
        onSave={handleCreate}
        isPending={createMutation.isPending}
      />

      <WebhookDialog
        open={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingID(null); resetForm() } }}
        title={'编辑 Webhook'}
        description={'修改 Webhook 配置'}
        icon={IconPencil}
        form={form}
        onToggleEvent={toggleEvent}
        onSave={handleUpdate}
        isPending={updateMutation.isPending}
      />
    </div>
  )
}
