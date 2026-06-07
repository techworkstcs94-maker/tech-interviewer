import React from 'react'
import type { AnalysisResult, DeepResult } from '../types'

interface TestResultsProps {
  instantResults: AnalysisResult | null
  deepResults: DeepResult | null
  deepStatus: 'idle' | 'running' | 'done' | 'error'
}

export default function TestResults({ instantResults, deepResults, deepStatus }: TestResultsProps) {
  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {/* Instant Analysis Panel */}
      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="bg-[var(--elevated)] px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--blue)] uppercase tracking-wider">
            ⚡ Instant Analysis
          </span>
          {instantResults && (
            <span className="text-xs font-bold text-white orbitron">
              {instantResults.instantScore}/100
            </span>
          )}
        </div>

        {!instantResults ? (
          <div className="px-3 py-4 text-[var(--muted)] text-xs text-center">
            Submit code to see instant analysis
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {instantResults.parseError && (
              <div className="text-xs text-[var(--red)] px-2 py-1 bg-red-900/20 rounded mb-2">
                Parse error: {instantResults.parseError}
              </div>
            )}
            {/* Progress bar */}
            <div className="w-full bg-[var(--surface)] rounded-full h-1.5 mb-2">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${instantResults.instantScore}%`,
                  backgroundColor: instantResults.instantScore >= 80 ? 'var(--green)' : instantResults.instantScore >= 50 ? 'var(--amber)' : 'var(--red)',
                }}
              />
            </div>
            {instantResults.testResults.map((t) => (
              <div key={t.id} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-[var(--elevated)]">
                <span className={`mt-0.5 text-sm ${t.passed ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
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
            {instantResults.qualityScore !== 0 && (
              <div className={`text-xs px-2 py-1 mt-1 rounded ${instantResults.qualityScore > 0 ? 'text-[var(--green)] bg-green-900/10' : 'text-[var(--red)] bg-red-900/10'}`}>
                Quality bonus: {instantResults.qualityScore > 0 ? '+' : ''}{instantResults.qualityScore}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deep Verification Panel */}
      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="bg-[var(--elevated)] px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--amber)] uppercase tracking-wider">
            🔬 Deep Verification
          </span>
          {deepStatus === 'done' && deepResults && (
            <span className="text-xs font-bold text-white orbitron">
              {deepResults.deepScore}/100
            </span>
          )}
        </div>

        <div className="px-3 py-3">
          {deepStatus === 'idle' && (
            <div className="text-[var(--muted)] text-xs text-center">
              Deep verification runs after submission via GitHub Actions
            </div>
          )}

          {deepStatus === 'running' && (
            <div className="flex items-center gap-2 text-[var(--amber)] text-xs">
              <div className="animate-spin w-3 h-3 border border-[var(--amber)] border-t-transparent rounded-full" />
              Running tests on GitHub Actions... (2-4 minutes)
            </div>
          )}

          {deepStatus === 'done' && deepResults && (
            <div className="space-y-2">
              <div className="w-full bg-[var(--surface)] rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${deepResults.deepScore}%`,
                    backgroundColor: deepResults.deepScore >= 80 ? 'var(--green)' : deepResults.deepScore >= 50 ? 'var(--amber)' : 'var(--red)',
                  }}
                />
              </div>
              <div className="text-xs text-[var(--text)]">
                {deepResults.passedCount}/{deepResults.totalCount} tests passed
              </div>
              {deepResults.rawOutput && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)]">
                    Raw output
                  </summary>
                  <pre className="mt-1 p-2 bg-[var(--surface)] rounded text-[10px] overflow-x-auto whitespace-pre-wrap text-[var(--muted)]">
                    {atob(deepResults.rawOutput)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {deepStatus === 'error' && (
            <div className="text-[var(--red)] text-xs">
              Deep evaluation failed. Check GitHub Actions configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
