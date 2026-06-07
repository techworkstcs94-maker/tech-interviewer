import React from 'react'

interface TimerProps {
  remaining: number
  elapsed: number
  limitSeconds: number
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Timer({ remaining, limitSeconds, isRunning, onStart, onPause, onResume, elapsed }: TimerProps) {
  const pct = limitSeconds > 0 ? (remaining / limitSeconds) * 100 : 100
  const color = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444'
  const started = elapsed > 0 || isRunning

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="orbitron text-3xl font-bold" style={{ color }}>
        {formatTime(remaining)}
      </div>
      <div className="w-full bg-[var(--surface)] rounded-full h-1">
        <div
          className="h-1 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex gap-2">
        {!started && (
          <button
            onClick={onStart}
            className="px-3 py-1 text-xs rounded bg-[var(--blue)] text-white hover:bg-blue-500 transition-colors"
          >
            Start
          </button>
        )}
        {started && isRunning && (
          <button
            onClick={onPause}
            className="px-3 py-1 text-xs rounded bg-[var(--elevated)] text-[var(--text)] hover:bg-[var(--border)] transition-colors"
          >
            Pause
          </button>
        )}
        {started && !isRunning && (
          <button
            onClick={onResume}
            className="px-3 py-1 text-xs rounded bg-[var(--blue)] text-white hover:bg-blue-500 transition-colors"
          >
            Resume
          </button>
        )}
      </div>
    </div>
  )
}
