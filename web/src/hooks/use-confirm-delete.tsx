import { useCallback, useRef, useState } from 'react'
import { IconTrash } from '@tabler/icons-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
}

export function useConfirmDelete() {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true)
    setOpen(false)
    setOptions(null)
  }, [])

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false)
    setOpen(false)
    setOptions(null)
  }, [])

  const ConfirmDialog = () => {
    if (!options) return null
    return (
      <AlertDialog open={open} onOpenChange={(v) => { if (!v) handleCancel() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText ?? '取消'}
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm}>
              {options.confirmText ?? '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return { confirm, ConfirmDialog }
}
