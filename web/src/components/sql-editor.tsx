import { useCallback, useRef } from 'react'
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
// import type editor from 'monaco-editor/esm/vs/editor/editor.api'
import type { editor } from 'monaco-editor'  // 更精确的导入

import { useTheme } from '@/components/theme-provider'

// ── Theme registration ──
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

// ── Types ──
export interface SqlEditorProps {
  value: string
  onChange?: (value: string) => void
  onMount?: (editor: Parameters<OnMount>[0]) => void
  onBeforeMount?: (monaco: typeof editorApi) => void
  language?: string
  readOnly?: boolean
}

// ── Component ──
export function SqlEditor({
  value,
  onChange,
  onMount,
  onBeforeMount,
  language = 'sql',
  readOnly = false,
}: SqlEditorProps) {
  const { actualTheme } = useTheme()
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleBeforeMount: BeforeMount = useCallback(
    (monaco) => {
      ensureThemesRegistered(monaco)
      onBeforeMount?.(monaco)
    },
    [onBeforeMount],
  )

  const handleMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor
      onMount?.(editor)
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
