import React, { useEffect, useRef, useState } from 'react'
import type { AnalysisResult, DeepResult } from '../types'

interface TestResultsProps {
  instantResults: AnalysisResult | null
  deepResults: DeepResult | null
  deepStatus: 'idle' | 'running' | 'done' | 'error'
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)'
  return (
    <div className="w-full bg-[var(--surface)] rounded-full h-1.5">
      <div
        className="h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  )
}

export default function TestResults({ instantResults, deepResults, deepStatus }: TestResultsProps) {
  const deepSucceeded = deepStatus === 'done' && deepResults !== null
  const isRunning = deepStatus === 'running'
  const isFallback = instantResults !== null && !deepSucceeded && !isRunning

  const displayScore = deepSucceeded
    ? deepResults!.deepScore
    : isFallback
      ? instantResults!.instantScore
      : undefined

  // Elapsed timer — resets whenever running state begins
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (deepStatus === 'running') {
      if (startTimeRef.current === null) startTimeRef.current = Date.now()
      const iv = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000))
      }, 1000)
      return () => clearInterval(iv)
    } else {
      startTimeRef.current = null
      setElapsed(0)
    }
  }, [deepStatus])

  const elapsedStr = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`
  const isSlowRun = elapsed >= 180

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-[var(--elevated)] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Test Results
          </span>
          {isRunning && (
            <div className="animate-spin w-2.5 h-2.5 border border-[var(--amber)] border-t-transparent rounded-full shrink-0" />
          )}
          {deepSucceeded && (
            <span className="text-[10px] text-[var(--green)] bg-green-900/20 border border-green-800/30 px-1.5 py-0.5 rounded">
              ✓ JUnit verified
            </span>
          )}
          {isFallback && (
            <span className="text-[10px] text-[var(--amber)] bg-amber-900/15 border border-amber-800/25 px-1.5 py-0.5 rounded">
              Structural only
            </span>
          )}
        </div>
        {displayScore !== undefined && (
          <span
            className="text-xs font-bold orbitron"
            style={{ color: displayScore >= 80 ? 'var(--green)' : displayScore >= 50 ? 'var(--amber)' : 'var(--red)' }}
          >
            {displayScore}/100
          </span>
        )}
      </div>

      {/* ── Body ── */}

      {/* IDLE — nothing submitted yet */}
      {deepStatus === 'idle' && !instantResults && (
        <div className="px-3 py-10 flex flex-col items-center gap-2 text-[var(--muted)]">
          <span className="text-2xl opacity-20">▶</span>
          <span className="text-xs">Submit your code to run tests</span>
          <span className="text-[10px] opacity-60">Results appear here after submission</span>
        </div>
      )}

      {/* RUNNING — deep verification in progress */}
      {isRunning && (
        <div className="p-3 space-y-3">

          {/* Status card */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded bg-amber-900/10 border border-amber-800/30">
            <div className="flex items-center gap-2.5">
              <div className="animate-spin w-4 h-4 border-2 border-[var(--amber)] border-t-transparent rounded-full shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[var(--amber)]">
                  {isSlowRun ? 'Still running — almost there' : 'Deep verification running'}
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-0.5">
                  {isSlowRun
                    ? 'GitHub Actions can take 3–5 min on cold runners'
                    : 'GitHub Actions · JUnit tests'}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-mono font-bold text-[var(--amber)] tabular-nums">{elapsedStr}</div>
              <div className="text-[9px] text-[var(--muted)]">
                {isSlowRun ? 'results update live' : 'est. 2–3 min'}
              </div>
            </div>
          </div>

          {/* Step pipeline */}
          <div className="space-y-1 px-1">
            {([
              { label: 'Code submitted',       done: true,                  active: false },
              { label: 'Structural analysis',  done: instantResults !== null, active: false, score: instantResults?.instantScore },
              { label: 'JUnit tests running',  done: false,                 active: true  },
            ] as const).map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`text-xs shrink-0 w-3 text-center ${step.done ? 'text-[var(--green)]' : step.active ? 'text-[var(--amber)]' : 'text-[var(--muted)]'}`}>
                  {step.done ? '✓' : step.active ? '›' : '○'}
                </span>
                <span className={`text-[11px] flex-1 ${step.done ? 'text-[var(--text)]' : step.active ? 'text-[var(--amber)]' : 'text-[var(--muted)]'}`}>
                  {step.label}
                </span>
                {'score' in step && step.score !== undefined && (
                  <span className="text-[10px] text-[var(--muted)]">{step.score}/100</span>
                )}
              </div>
            ))}
          </div>

          {/* Instant score preview while waiting */}
          {instantResults && (
            <div className="border border-[var(--border)] rounded overflow-hidden">
              <div className="px-3 py-1.5 bg-[var(--elevated)] flex items-center justify-between">
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wide">Structural preview</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: (instantResults.instantScore ?? 0) >= 80 ? 'var(--green)' : (instantResults.instantScore ?? 0) >= 50 ? 'var(--amber)' : 'var(--red)' }}
                >
                  {instantResults.instantScore}/100
                </span>
              </div>
              <div className="p-2 space-y-0.5">
                <ScoreBar score={instantResults.instantScore ?? 0} />
                <div className="mt-2 space-y-0.5">
                  {instantResults.testResults.map((t) => (
                    <div key={t.id} className="flex items-center gap-1.5 px-1 py-0.5">
                      <span className={`text-[10px] shrink-0 ${t.passed ? 'text-[var(--green)]' : 'text-[var(--muted)]'}`}>
                        {t.passed ? '✓' : '○'}
                      </span>
                      <span className={`text-[10px] flex-1 ${t.passed ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>
                        {t.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DONE — GitHub Actions JUnit result */}
      {deepSucceeded && (
        <div className="p-3 space-y-3">
          <ScoreBar score={deepResults!.deepScore} />

          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded bg-[var(--surface)]">
            <span className={`text-lg shrink-0 ${deepResults!.passedCount === deepResults!.totalCount ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>
              {deepResults!.passedCount === deepResults!.totalCount ? '✓' : '⚠'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[var(--text)]">
                {deepResults!.passedCount}/{deepResults!.totalCount} JUnit tests passed
              </div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">Verified by GitHub Actions</div>
            </div>
            <span
              className="text-sm font-bold orbitron shrink-0"
              style={{ color: deepResults!.deepScore >= 80 ? 'var(--green)' : deepResults!.deepScore >= 50 ? 'var(--amber)' : 'var(--red)' }}
            >
              {deepResults!.deepScore}/100
            </span>
          </div>

          {deepResults!.rawOutput && (
            <details className="border border-[var(--border)] rounded overflow-hidden">
              <summary className="px-3 py-2 bg-[var(--elevated)] text-[10px] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer select-none flex items-center justify-between list-none">
                <span>Raw test output</span>
                <span className="text-[9px] opacity-50">▼ expand</span>
              </summary>
              <pre className="p-3 bg-[var(--surface)] text-[10px] font-mono leading-relaxed text-[var(--muted)] overflow-x-auto whitespace-pre-wrap max-h-52 overflow-y-auto">
                {atob(deepResults!.rawOutput)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* FALLBACK — structural analysis only (GitHub not configured or timed out) */}
      {isFallback && (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-[var(--amber)] bg-amber-900/10 border border-amber-800/25 rounded">
            <span className="shrink-0">⚠</span>
            <span>
              {deepStatus === 'error'
                ? 'JUnit verification unavailable — showing structural analysis only'
                : 'Structural analysis complete'}
            </span>
          </div>

          {instantResults!.parseError && (
            <div className="flex items-start gap-1.5 px-2 py-1.5 text-[10px] text-[var(--red)] bg-red-900/10 border border-red-800/25 rounded">
              <span className="shrink-0">✗</span>
              <span>Parse error: {instantResults!.parseError}</span>
            </div>
          )}

          <ScoreBar score={instantResults!.instantScore ?? 0} />

          <div className="space-y-0.5">
            {instantResults!.testResults.map((t) => (
              <div key={t.id} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-[var(--elevated)]">
                <span className={`mt-0.5 shrink-0 text-xs ${t.passed ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                  {t.passed ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs ${t.passed ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
                    {t.label}
                  </div>
                  {!t.passed && t.feedback && (
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">{t.feedback}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
