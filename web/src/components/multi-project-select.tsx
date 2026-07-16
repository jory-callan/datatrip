import { useMemo, useRef, useState } from 'react'
import { IconCheck, IconChevronDown, IconX } from '@tabler/icons-react'

import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  name: string
}

interface MultiProjectSelectProps {
  projects: Project[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function MultiProjectSelect({ projects, selectedIds, onChange }: MultiProjectSelectProps) {

  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredProjects = useMemo(() => {
    if (!filter.trim()) return projects
    const q = filter.toLowerCase()
    return projects.filter((p) => p.name.toLowerCase().includes(q))
  }, [projects, filter])

  const selectedProjects = useMemo(
    () => projects.filter((p) => selectedIds.includes(p.id)),
    [projects, selectedIds],
  )

  const toggleProject = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const removeProject = (id: string) => {
    onChange(selectedIds.filter((i) => i !== id))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-sm text-left hover:bg-accent/50"
        >
          <div className="flex-1 flex flex-wrap gap-0.5 min-w-0">
            {selectedProjects.length === 0 ? (
              <span className="text-muted-foreground text-xs px-1 py-0.5">
                {'多选项目以浏览库表'}
              </span>
            ) : (
              selectedProjects.slice(0, 3).map((p) => (
                <Badge key={p.id} variant="secondary" className="text-xs px-1.5 py-0 gap-0.5">
                  {p.name}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-0.5 hover:text-foreground rounded-sm cursor-pointer inline-flex items-center"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeProject(p.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        removeProject(p.id)
                      }
                    }}
                  >
                    <IconX className="size-2.5" />
                  </span>
                </Badge>
              ))
            )}
            {selectedProjects.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{selectedProjects.length - 3}
              </Badge>
            )}
          </div>
          <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0"
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <div className="p-2 border-b">
          <Input
            ref={inputRef}
            placeholder={'搜索项目...'}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="max-h-[260px] overflow-y-auto p-1">
          {/* Select All / Clear All */}
          {projects.length > 0 && (
            <div className="flex items-center gap-1 px-1 pb-1 border-b mb-1">
              <button
                type="button"
                className="flex-1 text-xs text-center py-1 rounded-sm hover:bg-accent text-muted-foreground hover:text-foreground"
                onClick={() => onChange(filteredProjects.map((p) => p.id))}
              >
                全选
              </button>
              <span className="text-muted-foreground/30">|</span>
              <button
                type="button"
                className="flex-1 text-xs text-center py-1 rounded-sm hover:bg-accent text-muted-foreground hover:text-foreground"
                onClick={() => onChange([])}
              >
                清除
              </button>
            </div>
          )}
          {filteredProjects.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {'选择项目'}
            </p>
          )}
          {filteredProjects.map((p) => {
            const selected = selectedIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent',
                  selected && 'bg-accent/50',
                )}
                onClick={() => toggleProject(p.id)}
              >
                <div
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-sm border',
                    selected && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {selected && <IconCheck className="size-3" />}
                </div>
                <span className="truncate">{p.name}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
