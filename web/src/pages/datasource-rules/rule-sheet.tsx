import { useState } from 'react'
import { IconPencil, IconShield } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { DatasourceTypeGroup } from '@/lib/api/datasources'

import { CATEGORIES, CATEGORY_LABELS } from './dialogs'
import { useDatasourceRuleStore } from './store'

// --- helpers ---

function getGroupOptions(groups: DatasourceTypeGroup[]) {
  return [
    { value: '_all', label: '全部' },
    ...groups.map((g) => ({ value: g.group, label: g.label })),
  ]
}

function getScopeOptions(groups: DatasourceTypeGroup[], selectedGroup: string) {
  const types = selectedGroup === '_all'
    ? groups.flatMap((g) => g.types)
    : groups.find((g) => g.group === selectedGroup)?.types ?? []
  return [
    { value: '_all', label: '全部' },
    ...types.map((t) => ({ value: t.type, label: t.label })),
  ]
}

// --- Regex 测试器 ---

function parseHighlight(text: string, pattern: string) {
  if (!pattern || !text) return { highlighted: null, matchCount: null, error: null }
  try {
    const re = new RegExp(pattern, 'gi')
    const count = text.match(re)?.length ?? 0
    const parts = text.split(new RegExp(`(${pattern})`, 'gi'))
    const highlighted = parts.map((part, i) =>
      i % 2 === 1
        ? (
          <mark key={i} className="rounded bg-yellow-200 dark:bg-yellow-500/30 px-0.5">
            {part}
          </mark>
        )
        : part,
    )
    return { highlighted, matchCount: count, error: null }
  } catch (e) {
    return {
      highlighted: <span className="text-destructive text-sm">正则表达式无效</span>,
      matchCount: null,
      error: (e as Error).message,
    }
  }
}

function RegexTester({ pattern }: { pattern: string }) {
  const [testText, setTestText] = useState('')

  const result = parseHighlight(testText, pattern)

  return (
    <div className="grid gap-2">
      <Label>正则测试</Label>
      <Textarea
        placeholder="输入测试文本，匹配内容将高亮显示..."
        value={testText}
        onChange={(e) => setTestText(e.target.value)}
        rows={3}
        className="font-mono text-sm"
      />
      {result.error && (
        <p className="text-destructive text-xs">{result.error}</p>
      )}
      {result.highlighted && (
        <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap break-all font-mono min-h-[2.5rem]">
          {result.highlighted}
        </div>
      )}
      {result.matchCount !== null && result.matchCount >= 0 && testText && (
        <p className="text-xs text-muted-foreground">
          匹配 {result.matchCount} 处
        </p>
      )}
    </div>
  )
}

// --- RuleSheet ---

interface RuleSheetProps {
  groups: DatasourceTypeGroup[]
  onSave: () => void
  isPending: boolean
}

function RuleSheetContent({ groups }: { groups: DatasourceTypeGroup[] }) {
  const { form, updateForm } = useDatasourceRuleStore()
  const groupOptions = getGroupOptions(groups)
  const scopeOptions = getScopeOptions(groups, form.type_group ?? '_all')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-2">
      {/* 左列 */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>规则名称</Label>
          <Input
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label>类型分组</Label>
          <Select
            value={form.type_group}
            onValueChange={(v) => {
              updateForm('type_group', v)
              updateForm('type_scope', '_all')
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>适用范围</Label>
          <Select value={form.type_scope} onValueChange={(v) => updateForm('type_scope', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>分类</Label>
          <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>优先级</Label>
          <Input
            type="number"
            value={form.priority}
            onChange={(e) => updateForm('priority', parseInt(e.target.value, 10) || 0)}
            placeholder="数字越小越优先，默认 0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="rule-enabled"
            checked={form.enabled ?? true}
            onCheckedChange={(v) => updateForm('enabled', v)}
          />
          <Label htmlFor="rule-enabled">启用</Label>
        </div>
      </div>

      {/* 右列 */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>匹配模式</Label>
          <Input
            value={form.pattern}
            onChange={(e) => updateForm('pattern', e.target.value)}
            required
            placeholder="regex pattern"
          />
        </div>
        <RegexTester pattern={form.pattern} />
      </div>
    </div>
  )
}

export function RuleSheet({
  groups,
  onSave,
  isPending,
}: RuleSheetProps) {
  const {
    createOpen, editOpen,
    closeDialogs,
  } = useDatasourceRuleStore()

  const open = createOpen || editOpen

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) closeDialogs() }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            {createOpen
              ? <IconShield className="size-5 text-primary" />
              : <IconPencil className="size-5 text-primary" />
            }
            {createOpen ? '新增规则' : '编辑规则'}
          </SheetTitle>
          <SheetDescription>
            {createOpen ? '添加一条新的数据源审核规则' : '修改数据源审核规则'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {open && <RuleSheetContent groups={groups} />}
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" size="sm" onClick={() => closeDialogs()}>
            取消
          </Button>
          <Button size="sm" onClick={onSave} disabled={isPending}>
            {isPending ? '保存中...' : '保存'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
