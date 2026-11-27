import React from 'react'

interface TimerProps {
  remaining: number
  limitSeconds: number
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mmss = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

/** Compact, header-sized countdown for the whole assessment. */
export default function Timer({ remaining, limitSeconds }: TimerProps) {
  const pct = limitSeconds > 0 ? Math.min(100, (remaining / limitSeconds) * 100) : 100
  const color = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444'
  const expired = remaining === 0

  return (
    <div className="flex flex-col items-end gap-1 min-w-[96px]" title="Time remaining for the whole assessment">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--muted)]">
          {expired ? "Time's up" : 'Time left'}
        </span>
        <span className="orbitron text-sm font-bold tabular-nums" style={{ color }}>
          {formatTime(remaining)}
        </span>
      </div>
      <div className="w-full bg-[var(--elevated)] rounded-full h-0.5">
        <div
          className="h-0.5 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
