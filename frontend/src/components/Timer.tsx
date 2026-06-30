import React from 'react'

interface TimerProps {
  remaining: number
  limitSeconds: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Timer({ remaining, limitSeconds }: TimerProps) {
  const pct = limitSeconds > 0 ? (remaining / limitSeconds) * 100 : 100
  const color = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444'
  const expired = remaining === 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="orbitron text-3xl font-bold" style={{ color }}>
        {formatTime(remaining)}
      </div>
      {expired && (
        <div className="text-[10px] text-[var(--red)] uppercase tracking-widest font-semibold">
          Time's up
        </div>
      )}
      <div className="w-full bg-[var(--surface)] rounded-full h-1">
        <div
          className="h-1 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
