import { useState } from 'react'

import { IconAlignJustified } from '@tabler/icons-react'

import { FormDialog } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'

import type { ExampleConfig, ExampleProps } from '../types'

function CollapseExample({ open, setOpen }: ExampleProps) {
  const [tab, setTab] = useState('t1')
  return (
    <FormDialog
      open={open} onOpenChange={setOpen}
      title="项目设置（8 Tab）"
      tabs={Array.from({ length: 8 }, (_, i) => ({
        value: `t${i + 1}`,
        label: `Tab ${i + 1}`,
        badge: i % 2 === 0 ? `${i}` : undefined,
        content: (
          <div className="text-sm text-muted-foreground py-4">
            这是 Tab {i + 1} 的内容。
          </div>
        ),
      }))}
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

export const collapseExample: ExampleConfig = {
  key: 'collapse',
  label: 'Tab 折叠',
  icon: IconAlignJustified,
  description: '>6 Tab 时自动折叠 + 显示全部按钮',
  Component: CollapseExample,
  snippet: `// tabs.length > 6 时自动折叠 + 显示「显示全部 (N)」按钮
// 同时右侧有渐隐遮罩，提示「后面还有」
// 用户点击展开后可以看到全部 tabs

const [tab, setTab] = useState('t1')

<FormDialog
  open={open} onOpenChange={setOpen}
  title="项目设置（8 Tab）"
  tabs={Array.from({ length: 8 }, (_, i) => ({
    value: \`t\${i + 1}\`,
    label: \`Tab \${i + 1}\`,
    badge: i % 2 === 0 ? String(i) : undefined,
    content: <div>...内容...</div>,
  }))}
  tabValue={tab} onTabChange={setTab}
  footer={...}
/>`,
}
