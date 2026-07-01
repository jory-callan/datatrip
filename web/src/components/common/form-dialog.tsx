import * as React from 'react'
import { useEffect, useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// FormDialog
// ---------------------------------------------------------------------------

export interface FormDialogTab {
  value: string
  label: React.ReactNode
  content: React.ReactNode
  /** Optional badge count (e.g. "成员管理 · 8") */
  badge?: React.ReactNode
}

export interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Tab config; if omitted, renders single-page (no tabs). */
  tabs?: FormDialogTab[]
  /** Active tab value when tabs are present. */
  tabValue?: string
  onTabChange?: (value: string) => void
  /** Footer slot, typically Cancel + Save buttons. */
  footer?: React.ReactNode
  /** Max width of the dialog. Default `sm:max-w-2xl`. */
  maxWidthClass?: string
  /** Render the body directly (used when no tabs). */
  children?: React.ReactNode
}

/** How many tabs to show in the first row before forcing the user to
 *  expand. Anything beyond this is collapsed behind a "显示全部" button. */
const TAB_COLLAPSE_THRESHOLD = 6

export function FormDialog({
  open, onOpenChange,
  title, description,
  tabs, tabValue, onTabChange,
  footer,
  maxWidthClass = 'sm:max-w-2xl',
  children,
}: FormDialogProps) {
  const hasTabs = !!tabs && tabs.length > 0
  const shouldCollapse = hasTabs && tabs!.length > TAB_COLLAPSE_THRESHOLD
  const [expanded, setExpanded] = useState(false)

  // Reset expanded state whenever tabs change (different dialog) or dialog reopens.
  useEffect(() => {
    setExpanded(false)
  }, [tabs?.length, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex flex-col gap-0 p-0', maxWidthClass)}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b text-left">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {hasTabs ? (
          <Tabs
            value={tabValue}
            onValueChange={onTabChange}
            className="flex flex-col gap-0"
          >
            <div
              className={cn(
                'sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 backdrop-blur px-6 py-2',
              )}
            >
              <div
                className={cn(
                  'relative flex flex-1 min-w-0',
                  shouldCollapse && !expanded ? 'overflow-hidden' : '',
                )}
                style={
                  shouldCollapse && !expanded
                    ? { maxHeight: '2.5rem' }
                    : undefined
                }
              >
                <TabsList
                  className={cn(
                    'flex flex-row justify-start items-center w-full gap-1 bg-transparent p-0 h-auto rounded-none',
                    shouldCollapse && !expanded
                      ? 'flex-nowrap overflow-hidden'
                      : 'flex-wrap',
                  )}
                >
                  {tabs!.map((t) => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:shadow-none"
                    >
                      {t.label}
                      {t.badge ? (
                        <span className="text-[10px] text-muted-foreground">
                          {t.badge}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {shouldCollapse && !expanded ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"
                    aria-hidden
                  />
                ) : null}
              </div>
              {shouldCollapse ? (
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs shrink-0',
                    'text-muted-foreground hover:bg-accent hover:text-foreground',
                    !expanded && 'border-primary/50 text-primary font-medium',
                  )}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? (
                    <>
                      <IconChevronUp className="size-3.5" />
                      收起
                    </>
                  ) : (
                    <>
                      <IconChevronDown className="size-3.5" />
                      显示全部 ({tabs!.length})
                    </>
                  )}
                </button>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 max-h-[70vh]">
              {tabs!.map((t) => (
                <TabsContent
                  key={t.value}
                  value={t.value}
                  className="m-0"
                >
                  {t.content}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 max-h-[70vh]">
            {children}
          </div>
        )}

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t px-6 py-4 bg-muted/30">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// FormGroup
// ---------------------------------------------------------------------------

/**
 * Two-column responsive grid container.
 *
 * - `lg+` / `md`: two columns (`md:grid-cols-2`).
 * - `<md`: single column (`grid-cols-1`).
 *
 * Children wrapped in <FormField> get the column automatically; raw children
 * can use `md:col-span-2` to participate.
 */
export function FormGroup({
  title, description, className, children, ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode
  description?: React.ReactNode
}) {
  const grid = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
      {children}
    </div>
  )

  if (!title) {
    return <div className={cn('flex flex-col', className)} {...props}>{grid}</div>
  }

  return (
    <Card className={className} {...props}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>{grid}</CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// FormField
// ---------------------------------------------------------------------------

export interface FormFieldProps {
  label: React.ReactNode
  /** 1 = half row (default), 2 = full row. */
  span?: 1 | 2
  /** Force this field to start on a new row. */
  newRow?: boolean
  required?: boolean
  error?: string
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}

function spanClass(span: 1 | 2, newRow: boolean): string {
  // newRow forces the field to take the full row on every breakpoint,
  // pushing subsequent fields onto a new row.
  if (newRow) return 'col-span-full md:col-span-2'
  // Default Tailwind scale: 1 = half row, 2 = full row.
  const md = span === 2 ? 'md:col-span-2' : 'md:col-span-1'
  // base (<md): grid is single column, no class needed.
  return cn(md)
}

export function FormField({
  label, span = 1, newRow = false,
  required, error, hint, className, children,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0', spanClass(span, newRow), className)}>
      <Label className="text-sm">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      <div className="min-w-0">{children}</div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
