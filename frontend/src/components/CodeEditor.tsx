import React from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  lineCount: number
  onLineCountChange: (count: number) => void
}

export default function CodeEditor({ value, onChange, onSubmit, onLineCountChange }: CodeEditorProps) {
  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onSubmit()
    })

    editor.onDidChangeModelContent(() => {
      const lines = editor.getModel()?.getLineCount() ?? 1
      onLineCountChange(lines)
    })
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="java"
      value={value}
      theme="vs-dark"
      onChange={(val) => onChange(val ?? '')}
      onMount={handleMount}
      options={{
        fontSize: 13,
        fontFamily: '"JetBrains Mono", monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 4,
        automaticLayout: true,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        bracketPairColorization: { enabled: true },
        padding: { top: 12, bottom: 12 },
      }}
    />
  )
}
