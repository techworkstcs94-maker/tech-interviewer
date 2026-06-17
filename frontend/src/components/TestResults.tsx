import React from 'react'
import type { AnalysisResult, DeepResult } from '../types'

interface TestResultsProps {
  instantResults: AnalysisResult | null
  deepResults: DeepResult | null
  deepStatus: 'idle' | 'running' | 'done' | 'error'
}

export default function TestResults({ instantResults, deepResults, deepStatus }: TestResultsProps) {
  const deepSucceeded = deepStatus === 'done' && deepResults !== null
  const astFallback = instantResults !== null && (deepStatus === 'error' || (deepStatus === 'idle' && instantResults !== null))

  const displayScore = deepSucceeded
    ? deepResults!.deepScore
    : astFallback
      ? instantResults!.instantScore
      : undefined

  const hasAnyResult = deepSucceeded || astFallback

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="bg-[var(--elevated)] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Test Results
          </span>
          {deepStatus === 'running' && (
            <div className="animate-spin w-2.5 h-2.5 border border-[var(--amber)] border-t-transparent rounded-full shrink-0" />
          )}
        </div>
        {hasAnyResult && displayScore !== undefined && (
          <span
            className="text-xs font-bold orbitron"
            style={{ color: displayScore >= 80 ? 'var(--green)' : displayScore >= 50 ? 'var(--amber)' : 'var(--red)' }}
          >
            {displayScore}/100
          </span>
        )}
      </div>

      {deepStatus === 'running' ? (
        /* WAITING — deep verification in progress, don't show AST */
        <div className="px-3 py-8 flex flex-col items-center gap-3 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-[var(--amber)] border-t-transparent rounded-full" />
          <div>
            <p className="text-xs text-[var(--text)] font-medium">Running deep verification</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">GitHub Actions · JUnit tests · ~2–3 min</p>
          </div>
        </div>
      ) : !hasAnyResult ? (
        <div className="px-3 py-6 text-[var(--muted)] text-xs text-center">
          Submit code to run tests
        </div>
      ) : deepSucceeded ? (
        /* DEEP RESULT — GitHub Actions JUnit result */
        <div className="p-3 space-y-3">
          <div className="w-full bg-[var(--surface)] rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${deepResults!.deepScore}%`,
                backgroundColor: deepResults!.deepScore >= 80 ? 'var(--green)' : deepResults!.deepScore >= 50 ? 'var(--amber)' : 'var(--red)',
              }}
            />
          </div>

          <div className="flex items-center justify-between px-3 py-2.5 rounded bg-[var(--surface)]">
            <div className="flex items-center gap-2.5">
              <span className={`text-lg ${deepResults!.passedCount === deepResults!.totalCount ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>
                {deepResults!.passedCount === deepResults!.totalCount ? '✓' : '⚠'}
              </span>
              <div>
                <div className="text-xs font-semibold text-[var(--text)]">
                  {deepResults!.passedCount}/{deepResults!.totalCount} JUnit tests passed
                </div>
                <div className="text-[10px] text-[var(--muted)]">Verified by GitHub Actions</div>
              </div>
            </div>
            {deepResults!.rawOutput && (
              <details className="text-[10px] relative">
                <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] list-none select-none">
                  [raw]
                </summary>
                <pre className="absolute z-10 mt-1 p-2 bg-[var(--surface)] border border-[var(--border)] rounded text-[10px] overflow-x-auto whitespace-pre-wrap text-[var(--muted)] max-w-xs max-h-40 right-0">
                  {atob(deepResults!.rawOutput)}
                </pre>
              </details>
            )}
          </div>
        </div>
      ) : (
        /* AST FALLBACK — GitHub not configured or deep timed out */
        <div className="p-2 space-y-1">
          <div className="text-[10px] text-[var(--amber)] px-2 py-1 bg-amber-900/20 rounded mb-2">
            Structural analysis result (deep verification unavailable)
          </div>

          {instantResults!.parseError && (
            <div className="text-xs text-[var(--red)] px-2 py-1 bg-red-900/20 rounded mb-2">
              Parse error: {instantResults!.parseError}
            </div>
          )}

          <div className="w-full bg-[var(--surface)] rounded-full h-1.5 mb-3">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${instantResults!.instantScore ?? 0}%`,
                backgroundColor: (instantResults!.instantScore ?? 0) >= 80 ? 'var(--green)' : (instantResults!.instantScore ?? 0) >= 50 ? 'var(--amber)' : 'var(--red)',
              }}
            />
          </div>

          {instantResults!.testResults.map((t) => (
            <div key={t.id} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-[var(--elevated)]">
              <span className={`mt-0.5 shrink-0 ${t.passed ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {t.passed ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-xs ${t.passed ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
                  {t.label}
                </div>
                {!t.passed && t.feedback && (
                  <div className="text-[10px] text-[var(--muted)] mt-0.5 truncate">{t.feedback}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
