import { Loader2 } from 'lucide-react'

export function AuthLoadingScreen() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        <span>{'加载中...'}</span>
      </div>
    </div>
  )
}
