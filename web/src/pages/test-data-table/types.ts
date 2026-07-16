import type { ComponentType } from 'react'

export type ExampleConfig = {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  description: string
  snippet: string
  Component: ComponentType
}
