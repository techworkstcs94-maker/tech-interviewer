import React, { useEffect, useRef } from 'react'
import type { LogEntry } from '../types'

interface AnalysisLogProps {
  logs: LogEntry[]
  isConnected: boolean
}

const styleMap: Record<LogEntry['type'], { color: string; prefix: string; rowBg: string }> = {
  success: { color: '#4ade80', prefix: '✓', rowBg: 'rgba(74,222,128,0.05)' },
  error:   { color: '#f87171', prefix: '✗', rowBg: 'rgba(248,113,113,0.07)' },
  warning: { color: '#fbbf24', prefix: '⚠', rowBg: 'rgba(251,191,36,0.06)'  },
  info:    { color: '#93c5fd', prefix: '›', rowBg: 'transparent'             },
}

export default function AnalysisLog({ logs, isConnected }: AnalysisLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--elevated)] border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest">
            Analysis Log
          </span>
          {logs.length > 0 && (
            <span className="text-[9px] text-[var(--muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded-full">
              {logs.length}
            </span>
          )}
        </div>
        <span className={`flex items-center gap-1.5 text-[10px] font-medium ${isConnected ? 'text-[var(--green)]' : 'text-[var(--muted)]'}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? 'bg-[var(--green)] animate-pulse' : 'bg-[var(--muted)]'}`} />
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Log body */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full gap-2 text-[var(--muted)]">
            <span className="text-base opacity-20">▸</span>
            <span className="text-[10px]">Waiting for events…</span>
          </div>
        ) : (
          <div className="py-1">
            {logs.map((log, i) => {
              const s = styleMap[log.type]
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 px-2.5 py-1"
                  style={{ backgroundColor: s.rowBg }}
                >
                  <span className="text-[9px] text-[var(--muted)] shrink-0 tabular-nums pt-px leading-tight opacity-70">
                    {log.time}
                  </span>
                  <span style={{ color: s.color }} className="shrink-0 text-[11px] leading-tight pt-px">
                    {s.prefix}
                  </span>
                  <span style={{ color: s.color }} className="text-[10.5px] leading-snug break-words min-w-0 font-mono">
                    {log.message}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
