import { IconLayout2 } from '@tabler/icons-react'

import { FormDialog, FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import type { ExampleConfig, ExampleProps } from '../types'

function BasicExample({ open, setOpen }: ExampleProps) {
  return (
    <FormDialog
      open={open} onOpenChange={setOpen}
      title="新增用户"
      description="填写基本信息完成创建"
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={() => setOpen(false)}>保存</Button>
        </>
      }
    >
      <FormGroup>
        <FormField label="用户名" required>
          <Input placeholder="例如：zhangsan" />
        </FormField>
        <FormField label="昵称" required>
          <Input placeholder="例如：张三" />
        </FormField>
        <FormField label="邮箱" required span={2}>
          <Input type="email" placeholder="user@example.com" />
        </FormField>
        <FormField label="个人简介" span={2}>
          <Textarea rows={3} />
        </FormField>
      </FormGroup>
    </FormDialog>
  )
}

export const basicExample: ExampleConfig = {
  key: 'basic',
  label: '基础单页',
  icon: IconLayout2,
  description: '2 列网格 + 单 FormGroup',
  Component: BasicExample,
  snippet: `<FormDialog
  open={open} onOpenChange={setOpen}
  title="新增用户"
  description="填写基本信息完成创建"
  footer={
    <>
      <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
      <Button onClick={() => setOpen(false)}>保存</Button>
    </>
  }
>
  <FormGroup>
    <FormField label="用户名" required>
      <Input placeholder="例如：zhangsan" />
    </FormField>
    <FormField label="昵称" required>
      <Input placeholder="例如：张三" />
    </FormField>
    <FormField label="邮箱" required span={2}>
      <Input type="email" />
    </FormField>
    <FormField label="个人简介" span={2}>
      <Textarea rows={3} />
    </FormField>
  </FormGroup>
</FormDialog>`,
}
