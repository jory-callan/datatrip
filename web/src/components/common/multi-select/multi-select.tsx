import { useMemo, useRef, useState } from 'react'

import { IconCheck, IconChevronDown, IconSearch, IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  label: string
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
}: MultiSelectProps) {

  const resolvedPlaceholder = placeholder ?? '选择...'
  const resolvedSearchPlaceholder = searchPlaceholder ?? '搜索...'
  const resolvedEmptyText = emptyText ?? '暂无数据'
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [options, search])

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const clearAll = () => onChange([])

  const selectedLabels = useMemo(() => {
    return selected
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter(Boolean)
      .join(', ')
  }, [selected, options])

  return (
    <div className={cn('grid gap-2', className)}>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setSearch('') }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full justify-between px-3 text-sm font-normal"
          >
            <span className={cn('truncate', !selected.length && 'text-muted-foreground')}>
              {selected.length > 0 ? selectedLabels : resolvedPlaceholder}
            </span>
            <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <IconSearch className="mr-2 size-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={resolvedSearchPlaceholder}
              className="h-9 border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          {selected.length > 0 && (
            <div className="flex items-center justify-between border-b px-3 py-1.5">
              <span className="text-xs text-muted-foreground">{`已选 ${selected.length} 项`}</span>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <IconX className="size-3" />
                {'清除'}
              </button>
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{resolvedEmptyText}</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt.value)
                return (
                  <div
                    key={opt.value}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      toggle(opt.value)
                    }}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent',
                      isSelected && 'bg-accent/50',
                    )}
                  >
                    <Checkbox checked={isSelected} className="size-4" />
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && <IconCheck className="size-4 text-primary" />}
                  </div>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
