import React, { useEffect, useRef } from 'react'
import type { LogEntry } from '../types'

interface AnalysisLogProps {
  logs: LogEntry[]
  isConnected: boolean
}

const colorMap: Record<LogEntry['type'], string> = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#38bdf8',
}

const prefixMap: Record<LogEntry['type'], string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
}

export default function AnalysisLog({ logs, isConnected }: AnalysisLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--elevated)] border-b border-[var(--border)]">
        <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest">
          Analysis Log
        </span>
        <span className={`flex items-center gap-1 text-[10px] ${isConnected ? 'text-[var(--green)]' : 'text-[var(--muted)]'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[var(--green)] animate-pulse' : 'bg-[var(--muted)]'}`} />
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-[11px]">
        {logs.length === 0 && (
          <div className="text-[var(--muted)] text-center py-4">
            Waiting for events...
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[var(--muted)] shrink-0">{log.time}</span>
            <span style={{ color: colorMap[log.type] }} className="shrink-0">
              {prefixMap[log.type]}
            </span>
            <span style={{ color: colorMap[log.type] }} className="break-all">
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
