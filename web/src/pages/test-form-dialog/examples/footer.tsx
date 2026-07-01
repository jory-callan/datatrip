import { IconBell, IconBox, IconPlugConnected, IconTrash } from '@tabler/icons-react'

import { FormDialog, FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { ExampleConfig, ExampleProps } from '../types'

function FooterExample({ open, setOpen }: ExampleProps) {
  return (
    <FormDialog
      open={open} onOpenChange={setOpen}
      title="自定义 Footer"
      description="左侧：删除/通知；右侧：测试连接/保存"
      footer={
        <>
          <Button variant="ghost" className="text-destructive">
            <IconTrash className="size-4" /> 删除
          </Button>
          <Button variant="outline">
            <IconBell className="size-4" /> 通知
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
          <Button variant="outline">
            <IconPlugConnected className="size-4" /> 测试连接
          </Button>
          <Button onClick={() => setOpen(false)}>保存</Button>
        </>
      }
    >
      <FormGroup>
        <FormField label="连接名" required>
          <Input placeholder="例如：订单库" />
        </FormField>
        <FormField label="主机" required>
          <Input placeholder="127.0.0.1" />
        </FormField>
      </FormGroup>
    </FormDialog>
  )
}

export const footerExample: ExampleConfig = {
  key: 'footer',
  label: '自定义 Footer',
  icon: IconBox,
  description: 'Footer 加测试连接等额外按钮',
  Component: FooterExample,
  snippet: `// footer 是任意 ReactNode，可以放任意按钮
// 用 <div className="flex-1" /> 把按钮推到右边
<FormDialog
  footer={
    <>
      <Button variant="ghost" className="text-destructive">
        <IconTrash /> 删除
      </Button>
      <Button variant="outline">
        <IconBell /> 通知
      </Button>
      <div className="flex-1" />
      <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
      <Button variant="outline">
        <IconPlugConnected /> 测试连接
      </Button>
      <Button onClick={() => setOpen(false)}>保存</Button>
    </>
  }
>
  ...
</FormDialog>`,
}
