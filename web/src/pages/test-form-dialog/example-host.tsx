import type { ComponentType } from 'react'

import { IconCode } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'

import type { ExampleConfig } from './types'

export function ExampleHost({
  config, open, setOpen,
}: {
  config: ExampleConfig
  open: boolean
  setOpen: (v: boolean) => void
}) {
  const { Component, snippet, label, description, icon: Icon } = config

  return (
    <div className="flex my-4 flex-col gap-4">
      <ExampleHeader
        label={label}
        description={description}
        icon={Icon}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <IconCode className="size-4" /> 代码示例
            </CardTitle>
            <CardDescription>复制以下 JSX 即可使用</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-zinc-950 px-4 py-3 text-xs text-zinc-100">
              {snippet}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">实际渲染</CardTitle>
            <CardDescription>点击下方按钮打开 Dialog</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => setOpen(true)} className="w-fit">
              打开示例 Dialog
            </Button>
            <Component open={open} setOpen={setOpen} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ExampleHeader({
  label, description, icon: Icon,
}: {
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
