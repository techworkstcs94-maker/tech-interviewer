import React from 'react'
import type { AnalysisResult, DeepResult } from '../types'

interface TestResultsProps {
  instantResults: AnalysisResult | null
  deepResults: DeepResult | null
  deepStatus: 'idle' | 'running' | 'done' | 'error'
}

export default function TestResults({ instantResults, deepResults, deepStatus }: TestResultsProps) {
  const hasResults = instantResults !== null
  const displayScore = deepStatus === 'done' && deepResults
    ? deepResults.deepScore
    : instantResults?.instantScore

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="bg-[var(--elevated)] px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          Test Results
        </span>
        {hasResults && displayScore !== undefined && (
          <span
            className="text-xs font-bold orbitron"
            style={{ color: displayScore >= 80 ? 'var(--green)' : displayScore >= 50 ? 'var(--amber)' : 'var(--red)' }}
          >
            {displayScore}/100
          </span>
        )}
      </div>

      {!hasResults ? (
        <div className="px-3 py-6 text-[var(--muted)] text-xs text-center">
          Submit code to run tests
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {instantResults.parseError && (
            <div className="text-xs text-[var(--red)] px-2 py-1 bg-red-900/20 rounded mb-2">
              Parse error: {instantResults.parseError}
            </div>
          )}

          {/* Score bar */}
          <div className="w-full bg-[var(--surface)] rounded-full h-1.5 mb-3">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${displayScore ?? 0}%`,
                backgroundColor: (displayScore ?? 0) >= 80 ? 'var(--green)' : (displayScore ?? 0) >= 50 ? 'var(--amber)' : 'var(--red)',
              }}
            />
          </div>

          {/* Test cases */}
          {instantResults.testResults.map((t) => (
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

          {/* Quality bonus */}
          {instantResults.qualityScore !== 0 && (
            <div className={`text-xs px-2 py-1 rounded ${instantResults.qualityScore > 0 ? 'text-[var(--green)] bg-green-900/10' : 'text-[var(--red)] bg-red-900/10'}`}>
              Quality bonus: {instantResults.qualityScore > 0 ? '+' : ''}{instantResults.qualityScore}
            </div>
          )}

          {/* Deep status — inline below test list */}
          <div className="mt-2 pt-2 border-t border-[var(--border)]">
            {deepStatus === 'idle' && (
              <span className="text-[10px] text-[var(--muted)]">Deep JUnit verification will run after submission</span>
            )}
            {deepStatus === 'running' && (
              <div className="flex items-center gap-2 text-[var(--amber)] text-xs">
                <div className="animate-spin w-3 h-3 border border-[var(--amber)] border-t-transparent rounded-full shrink-0" />
                Running JUnit tests via GitHub Actions…
              </div>
            )}
            {deepStatus === 'done' && deepResults && (
              <div className="flex items-center gap-2 text-xs">
                <span className={deepResults.passedCount === deepResults.totalCount ? 'text-[var(--green)]' : 'text-[var(--amber)]'}>
                  ✓
                </span>
                <span className="text-[var(--text)]">
                  JUnit: {deepResults.passedCount}/{deepResults.totalCount} tests passed
                </span>
                {deepResults.rawOutput && (
                  <details className="ml-auto text-[10px]">
                    <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] list-none">
                      [raw]
                    </summary>
                    <pre className="absolute z-10 mt-1 p-2 bg-[var(--surface)] border border-[var(--border)] rounded text-[10px] overflow-x-auto whitespace-pre-wrap text-[var(--muted)] max-w-xs max-h-40 right-0">
                      {atob(deepResults.rawOutput)}
                    </pre>
                  </details>
                )}
              </div>
            )}
            {deepStatus === 'error' && (
              <span className="text-[var(--red)] text-[10px]">Deep evaluation failed — check GitHub Actions</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
