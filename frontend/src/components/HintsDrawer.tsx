import React, { useState } from 'react'

interface Hint {
  id: string
  text: string
}

interface HintsDrawerProps {
  hintsJson: string
  open: boolean
  onClose: () => void
}

export default function HintsDrawer({ hintsJson, open, onClose }: HintsDrawerProps) {
  const [revealed, setReveal] = useState<Set<string>>(new Set())
  const hints: Hint[] = (() => {
    try { return JSON.parse(hintsJson) } catch { return [] }
  })()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--surface)] border-l border-[var(--border)] w-80 h-full flex flex-col z-10">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-sm text-[var(--amber)]">💡 Hints</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)] text-lg">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {hints.length === 0 && (
            <div className="text-[var(--muted)] text-sm text-center">No hints available</div>
          )}
          {hints.map((hint, idx) => {
            const isRevealed = revealed.has(hint.id)
            const isNextToReveal = !isRevealed && hints.slice(0, idx).every(h => revealed.has(h.id))
            return (
              <div key={hint.id} className="rounded-lg border border-[var(--border)] overflow-hidden">
                <div className="bg-[var(--elevated)] px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)]">Hint {idx + 1}</span>
                  {!isRevealed && isNextToReveal && (
                    <button
                      onClick={() => setReveal(prev => new Set([...prev, hint.id]))}
                      className="text-xs text-[var(--blue)] hover:underline"
                    >
                      Reveal
                    </button>
                  )}
                </div>
                <div className="px-3 py-2">
                  {isRevealed ? (
                    <p className="text-xs text-[var(--text)]">{hint.text}</p>
                  ) : (
                    <p className="text-xs blur-sm select-none text-[var(--muted)]">
                      {hint.text}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="p-3 border-t border-[var(--border)] text-[10px] text-[var(--muted)] text-center">
          Ctrl+H to toggle hints
        </div>
      </div>
    </div>
  )
}
