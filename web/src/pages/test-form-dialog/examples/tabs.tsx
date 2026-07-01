import { useState } from 'react'

import { IconForms } from '@tabler/icons-react'

import { FormDialog, FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import type { ExampleConfig, ExampleProps } from '../types'

function TabsExample({ open, setOpen }: ExampleProps) {
  const [tab, setTab] = useState('basic')
  return (
    <FormDialog
      open={open} onOpenChange={setOpen}
      title="编辑项目 #5"
      tabs={[
        { value: 'basic', label: '基本信息', content: (
          <FormGroup>
            <FormField label="项目名称" required>
              <Input defaultValue="订单中台" />
            </FormField>
            <FormField label="项目编码" required>
              <Input defaultValue="order-hub" />
            </FormField>
          </FormGroup>
        )},
        { value: 'approval', label: '审批配置', content: (
          <FormGroup>
            <FormField label="启用审批">
              <Switch defaultChecked />
            </FormField>
            <FormField label="审批人">
              <Input defaultValue="王五" />
            </FormField>
          </FormGroup>
        )},
        { value: 'members', label: '成员', badge: '3', content: (
          <div className="text-sm text-muted-foreground">成员管理内容…</div>
        )},
        { value: 'logs', label: '变更日志', content: (
          <div className="text-sm text-muted-foreground">变更日志…</div>
        )},
      ]}
      tabValue={tab} onTabChange={setTab}
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={() => setOpen(false)}>保存</Button>
        </>
      }
    />
  )
}

export const tabsExample: ExampleConfig = {
  key: 'tabs',
  label: '多 Tab',
  icon: IconForms,
  description: '3+ 个 Tab 切换内容',
  Component: TabsExample,
  snippet: `const [tab, setTab] = useState('basic')

<FormDialog
  open={open} onOpenChange={setOpen}
  title="编辑项目 #5"
  tabs={[
    { value: 'basic',    label: '基本信息', content: <BasicTab /> },
    { value: 'approval', label: '审批配置', content: <ApprovalTab /> },
    { value: 'members',  label: '成员',     badge: '3', content: <MembersTab /> },
    { value: 'logs',     label: '变更日志', content: <LogsTab /> },
  ]}
  tabValue={tab} onTabChange={setTab}
  footer={...}
>

// Form state 在父组件维护，切 Tab 不丢数据
// tabs 是声明式 API，每个 tab 的 content 是任意 ReactNode`,
}
