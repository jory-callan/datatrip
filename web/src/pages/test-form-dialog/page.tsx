import { useState } from 'react'

import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'

import { ExampleHost } from './example-host'
import { EXAMPLES } from './examples'

export function FormDialogTestPage() {
  const [example, setExample] = useState<string>(EXAMPLES[0].key)
  const [openKey, setOpenKey] = useState<string | null>(null)

  const current = EXAMPLES.find((e) => e.key === example) ?? EXAMPLES[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">FormDialog 测试</h1>
        <p className="text-sm text-muted-foreground">
          切换不同 Tab 查看各种用法场景，每个 Tab 都是一个独立示例
        </p>
      </div>

      <Tabs
        value={example}
        onValueChange={(v) => {
          setExample(v)
          setOpenKey(null)
        }}
        className="gap-4"
      >
        <TabsList className="flex-wrap h-auto gap-1">
          {EXAMPLES.map((e) => {
            const Icon = e.icon
            return (
              <TabsTrigger key={e.key} value={e.key} className="gap-1.5">
                <Icon className="size-4" />
                {e.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {EXAMPLES.map((e) => (
          <TabsContent key={e.key} value={e.key} className="m-0">
            <ExampleHost
              config={e}
              open={openKey === e.key}
              setOpen={(o) => setOpenKey(o ? e.key : null)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <div className="rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground">
        当前选中：<span className="font-mono text-foreground">{current.key}</span> ·
        描述：<span className="text-foreground">{current.description}</span>
      </div>
    </div>
  )
}
