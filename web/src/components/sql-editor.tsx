import { useCallback, useRef } from 'react'
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

import { useTheme } from '@/components/theme-provider'

// ── Completion types ─────────────────────────────────

export interface CompletionColumn {
  name: string
  type?: string      // "VARCHAR(255)"
  nullable?: boolean
  comment?: string
}

export interface CompletionTable {
  name: string
  columns: CompletionColumn[]
}

// ── Props ───────────────────────────────────────────

export interface SqlEditorProps {
  value: string
  onChange?: (value: string) => void
  onMount?: (editor: Parameters<OnMount>[0]) => void
  onBeforeMount?: (monaco: typeof editor) => void
  language?: string
  readOnly?: boolean
  /** 表名 + 列信息，用于 Monaco SQL 自动补全 */
  completionTables?: CompletionTable[]
}

// ── Theme registration ──────────────────────────────

let themesRegistered = false

function ensureThemesRegistered(monaco: typeof editor) {
  if (themesRegistered) return
  themesRegistered = true

  monaco.editor.defineTheme('sql-editor-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e2e',
      'editor.foreground': '#cdd6f4',
      'editor.lineHighlightBackground': '#2a2a3e',
      'editor.selectionBackground': '#45475a',
      'editorCursor.foreground': '#f5e0dc',
      'editorLineNumber.foreground': '#6c7086',
      'editorLineNumber.activeForeground': '#cdd6f4',
      'scrollbarSlider.background': '#585b70aa',
      'scrollbarSlider.hoverBackground': '#6c7086aa',
      'scrollbarSlider.activeBackground': '#7f849caa',
    },
  })

  monaco.editor.defineTheme('sql-editor-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'scrollbarSlider.background': '#bcbcbc',
      'scrollbarSlider.hoverBackground': '#a0a0a0',
      'scrollbarSlider.activeBackground': '#888888',
    },
  })
}

// ── SQL 自动补全 provider ────────────────────────────

function registerSqlCompletion(
  monaco: typeof editor,
  dataRef: { current: CompletionTable[] },
) {
  return monaco.languages.registerCompletionItemProvider('sql', {
    // 只在 . 后触发联想（表名 Ctrl+Space 手动触发）
    triggerCharacters: ['.'],

    provideCompletionItems(model, position) {
      const tables = dataRef.current
      const suggestions: any[] = []

      // 当前行光标前的文本
      const textUntilCursor = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })

      // ── 检测 dot 模式：tableName.xxx → 联想列 ──────
      const dotMatch = textUntilCursor.match(/(\w+)\.\s*(\w*)$/)
      if (dotMatch) {
        const tableName = dotMatch[1]
        const partialCol = dotMatch[2]
        const table = tables.find((t) => t.name === tableName)

        if (table) {
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: partialCol
              ? position.column - partialCol.length
              : position.column,
            endColumn: position.column,
          }

          return {
            suggestions: table.columns.map((col) => {
              // 列名后带类型作为 detail
              const detail = col.type || ''
              // 弹窗展示完整信息
              let docLines = `**${col.name}**`
              if (col.type) docLines += `  \n\`${col.type}\``
              if (col.nullable === false) docLines += '  \nNOT NULL'
              if (col.nullable === true) docLines += '  \nnullable'
              if (col.comment) docLines += `  \n${col.comment}`
              return {
                label: col.name,
                kind: monaco.languages.CompletionItemKind.Field,
                detail,
                documentation: docLines !== `**${col.name}**`
                  ? { value: docLines, isTrusted: true }
                  : undefined,
                insertText: col.name,
                range,
                sortText: `1_${col.name}`,
              }
            }),
          }
        }
      }

      // ── 无 dot → 联想表名 ──────────────────────────
      if (tables.length > 0) {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        for (const table of tables) {
          suggestions.push({
            label: table.name,
            kind: monaco.languages.CompletionItemKind.Class,
            detail: '📋 表',
            insertText: table.name,
            range,
            sortText: `1_${table.name}`,
          })
        }
      }

      return { suggestions }
    },
  })
}

// ── Component ───────────────────────────────────────

export function SqlEditor({
  value,
  onChange,
  onMount,
  onBeforeMount,
  language = 'sql',
  readOnly = false,
  completionTables = [],
}: SqlEditorProps) {
  const { actualTheme } = useTheme()
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const monacoRef = useRef<typeof editor | null>(null)
  const dataRef = useRef<CompletionTable[]>(completionTables)

  // 始终保持 dataRef 与 props 同步
  dataRef.current = completionTables

  const handleBeforeMount: BeforeMount = useCallback(
    (monaco) => {
      monacoRef.current = monaco
      ensureThemesRegistered(monaco)

      // ★ 在这里注册补全 provider（此时 monaco 实例已就绪）
      const disposable = registerSqlCompletion(monaco, dataRef)
      // 利用 onMount 的 editor.onDidDispose 来清理
      onDisposeRef.current = disposable

      onBeforeMount?.(monaco)
    },
    [onBeforeMount],
  )

  const onDisposeRef = useRef<{ dispose: () => void } | null>(null)

  const handleMount: OnMount = useCallback(
    (ed) => {
      editorRef.current = ed
      // editor 销毁时自动清理 provider
      ed.onDidDispose(() => {
        onDisposeRef.current?.dispose()
        onDisposeRef.current = null
      })
      onMount?.(ed)
    },
    [onMount],
  )

  const editorTheme = actualTheme === 'dark' ? 'sql-editor-dark' : 'sql-editor-light'

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      theme={editorTheme}
      value={value}
      onChange={(val) => onChange?.(val ?? '')}
      onMount={handleMount}
      beforeMount={handleBeforeMount}
      options={{
        minimap: { enabled: false },
        lineNumbers: 'on',
        fontSize: 13,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        readOnly,
        padding: { top: 4 },
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
          alwaysConsumeMouseWheel: false,
        },
      }}
    />
  )
}
