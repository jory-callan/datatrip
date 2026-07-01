import { IconCheck } from '@tabler/icons-react'

import { FormDialog, FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { ExampleConfig, ExampleProps } from '../types'

function ErrorsExample({ open, setOpen }: ExampleProps) {
  return (
    <FormDialog
      open={open} onOpenChange={setOpen}
      title="错误与提示"
      description="error / required / hint 三种状态"
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={() => setOpen(false)}>保存</Button>
        </>
      }
    >
      <FormGroup>
        <FormField label="正常字段" hint="这是提示文字" required>
          <Input defaultValue="ok" />
        </FormField>
        <FormField label="错误字段" error="端口必须是 1-65535 之间的数字" required>
          <Input defaultValue="99999" />
        </FormField>
        <FormField label="无提示字段">
          <Input placeholder="普通输入" />
        </FormField>
        <FormField label="必填未填" error="必填项不能为空" required>
          <Input placeholder="必填" />
        </FormField>
      </FormGroup>
    </FormDialog>
  )
}

export const errorsExample: ExampleConfig = {
  key: 'errors',
  label: '错误/提示',
  icon: IconCheck,
  description: 'error / hint 状态',
  Component: ErrorsExample,
  snippet: `// 三种状态可以混用：
// - required  → label 后加红 *
// - error     → 控件下方显示红字错误
// - hint      → 控件下方显示灰色提示（与 error 互斥）
<FormGroup>
  <FormField label="正常字段" hint="这是提示文字" required>
    <Input defaultValue="ok" />
  </FormField>
  <FormField label="错误字段" error="端口必须是 1-65535 之间的数字" required>
    <Input defaultValue="99999" />
  </FormField>
  <FormField label="必填未填" error="必填项不能为空" required>
    <Input placeholder="必填" />
  </FormField>
</FormGroup>`,
}
