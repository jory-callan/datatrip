import type { ComponentType } from 'react'

export type ExampleProps = {
  open: boolean
  setOpen: (v: boolean) => void
}

export type ExampleConfig = {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  description: string
  snippet: string
  Component: ComponentType<ExampleProps>
}
