import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import type { ExampleConfig } from './types'

export function ExampleHost({ config }: { config: ExampleConfig }) {
  const { Component, label, description, icon: Icon } = config

  return (
    <div className="flex flex-col gap-4">
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">实际渲染</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Component />
        </CardContent>
      </Card>
    </div>
  )
}
