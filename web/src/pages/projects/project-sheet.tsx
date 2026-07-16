import { IconFolder, IconPencil } from '@tabler/icons-react'

import { MultiSelect } from '@/components/common/multi-select'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useProjectStore } from './store'

interface Props {
  /** Options: datasource id -> name */
  datasourceOptions: { value: string; label: string }[]
  /** Options: webhook id -> name */
  webhookOptions: { value: string; label: string }[]
  onSave: () => void
  isPending: boolean
}

export function ProjectSheet({
  datasourceOptions,
  webhookOptions,
  onSave, isPending,
}: Props) {
  const {
    createOpen, editOpen,
    form, activeTab,
    closeDialogs, setActiveTab,
    updateForm,
  } = useProjectStore()

  const open = createOpen || editOpen
  const onOpenChange = (v: boolean) => {
    if (!v) closeDialogs()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            {createOpen
              ? <><IconFolder className="size-5 text-primary" /> 新增项目</>
              : <><IconPencil className="size-5 text-primary" /> 编辑项目</>
            }
          </SheetTitle>
          <SheetDescription>
            {createOpen ? '创建一个新的数据项目' : '修改项目配置'}
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="border-b bg-background px-6 py-2">
            <TabsList className="bg-transparent h-auto p-0 gap-1">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-primary/10 data-[state=active]:shadow-none"
              >
                基本信息
              </TabsTrigger>
              <TabsTrigger
                value="approval"
                className="data-[state=active]:bg-primary/10 data-[state=active]:shadow-none"
              >
                审批配置
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="data-[state=active]:bg-primary/10 data-[state=active]:shadow-none"
              >
                关联资源
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable content — fixed-height container, won't jump on tab switch */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="basic" className="m-0">
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <span className="text-sm font-medium">项目名称 <span className="text-destructive">*</span></span>
                  <Input
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="例如：订单系统"
                  />
                </div>
                <div className="grid gap-2">
                  <span className="text-sm font-medium">数据源 <span className="text-destructive">*</span></span>
                  <Select
                    value={form.datasource_id}
                    onValueChange={(v) => updateForm('datasource_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择数据源" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasourceOptions.map((ds) => (
                        <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <span className="text-sm font-medium">资源范围</span>
                  <Input
                    value={(form.scope ?? []).join(', ')}
                    onChange={(e) =>
                      updateForm(
                        'scope',
                        e.target.value
                          .split(/[,，]/)
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="用逗号分隔多个资源（数据库名 / db number / index 模式）"
                  />
                  {(form.scope ?? []).some((s) => s.includes('*') || s.includes('?')) && (
                    <p className="text-xs text-muted-foreground">
                      通配符模式已启用：
                      {form.scope.filter((s) => s.includes('*') || s.includes('?')).join(', ')}
                      {form.scope.includes('*') && <span> — 匹配该数据源下所有资源</span>}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="approval" className="m-0">
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <span className="text-sm font-medium">审批模式</span>
                  <Select
                    value={form.approval_mode}
                    onValueChange={(v) => updateForm('approval_mode', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any_one">任意一人</SelectItem>
                      <SelectItem value="all">全部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  审批人通过成员管理中分配 Approver 或 Admin 角色来指定。
                </p>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="m-0">
              <div className="flex flex-col gap-4">
                <MultiSelect
                  label="Webhook"
                  options={webhookOptions}
                  selected={form.webhook_ids}
                  onChange={(vals) => updateForm('webhook_ids', vals)}
                  placeholder="选择 Webhook..."
                  searchPlaceholder="搜索 Webhook..."
                  emptyText="暂无 Webhook，请先在 Webhook 页面创建"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <SheetFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
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
