import { Component, type ErrorInfo, type ReactNode } from 'react'
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
  className?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return <ErrorFallback error={this.state.error} onReset={this.reset} />
    }
    return <div className={cn('flex min-h-0 flex-1 flex-col', this.props.className)}>{this.props.children}</div>
  }
}

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error
  onReset: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 p-8 text-center">
      <IconAlertTriangle className="h-10 w-10 text-destructive" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">Something went wrong</p>
        <p className="max-w-sm break-all text-xs text-muted-foreground">
          {error.message}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onReset}>
        <IconRefresh className="mr-1 h-3.5 w-3.5" />
        Try again
      </Button>
    </div>
  )
}
