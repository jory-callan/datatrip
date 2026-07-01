import { IconTable } from '@tabler/icons-react'

import { FormDialog, FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { ExampleConfig, ExampleProps } from '../types'

function NewRowExample({ open, setOpen }: ExampleProps) {
  return (
    <FormDialog
      open={open} onOpenChange={setOpen}
      title="newRow 用法"
      description="字段 C 加 newRow 后，整行占用，强制后面字段另起一行"
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={() => setOpen(false)}>保存</Button>
        </>
      }
    >
      <FormGroup>
        <FormField label="字段 A" required>
          <Input placeholder="A" />
        </FormField>
        <FormField label="字段 B" required>
          <Input placeholder="B" />
        </FormField>
        <FormField label="字段 C（newRow）" newRow required hint="这一行占满整行，下面字段另起一行">
          <Input placeholder="C" />
        </FormField>
        <FormField label="字段 D" required>
          <Input placeholder="D" />
        </FormField>
        <FormField label="字段 E" required>
          <Input placeholder="E" />
        </FormField>
      </FormGroup>
    </FormDialog>
  )
}

export const newRowExample: ExampleConfig = {
  key: 'newRow',
  label: '强制换行',
  icon: IconTable,
  description: 'newRow 强制新行',
  Component: NewRowExample,
  snippet: `// 上一字段没有占满当前行（字段 A span=1 用了 1/2 行）
// 但下一字段（字段 C）想另起一行，加 newRow 强制换行
// 结果：
//   [字段 A] [字段 B]
//   [字段 C                       ]   ← 强制整行
//   [字段 D] [字段 E]
<FormGroup>
  <FormField label="字段 A" required><Input /></FormField>
  <FormField label="字段 B" required><Input /></FormField>
  <FormField label="字段 C（newRow）" newRow required>
    <Input />
  </FormField>
  <FormField label="字段 D" required><Input /></FormField>
  <FormField label="字段 E" required><Input /></FormField>
</FormGroup>`,
}
