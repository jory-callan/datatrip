import { useCallback, useState } from 'react'

import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api-client'
import {
  useCreateWebhook,
  useUpdateWebhook,
  useWebhooks,
  type CreateWebhookInput,
  type Webhook,
} from '@/lib/api/webhooks'

const defaultForm: CreateWebhookInput = {
  name: '',
  scope: 'global',
  url: '',
  enabled: true,
  events: [],
}

export function useWebhooksPage() {

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingID, setEditingID] = useState<number | null>(null)
  const [form, setForm] = useState<CreateWebhookInput>(defaultForm)
  const needCount = true
  const query = useWebhooks({ page, pageSize, needCount })
  const { data, refetch } = query
  const createMutation = useCreateWebhook()
  const updateMutation = useUpdateWebhook()

  const resetForm = () => setForm(defaultForm)

  const handleCreate = async () => {
    if (!form.name || !form.url) {
      toast.error('请填写必填字段')
      return
    }
    try {
      await createMutation.mutateAsync(form)
      toast.success('Webhook 创建成功')
      setCreateOpen(false)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Webhook 创建失败'))
    }
  }

  const openEdit = useCallback((wh: Webhook) => {
    setEditingID(Number(wh.id))
    setForm({
      name: wh.name,
      scope: wh.scope,
      project_id: wh.project_id,
      url: wh.url,
      enabled: wh.enabled,
      events: wh.events ?? [],
    })
    setEditOpen(true)
  }, [])

  const handleUpdate = async () => {
    if (!editingID) return
    if (!form.name || !form.url) {
      toast.error('请填写必填字段')
      return
    }
    try {
      await updateMutation.mutateAsync({ id: editingID, ...form })
      toast.success('Webhook 更新成功')
      setEditOpen(false)
      setEditingID(null)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Webhook 更新失败'))
    }
  }

  const toggleEvent = (event: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter((e) => e !== event)
        : [...f.events, event],
    }))
  }

  return {
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
  }
}
