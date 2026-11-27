import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeEditor from '../components/CodeEditor'
import TestResults from '../components/TestResults'
import Timer from '../components/Timer'
import HintsDrawer from '../components/HintsDrawer'
import AntiCheatBanner from '../components/AntiCheatBanner'
import { getChallenges } from '../api/challenges'
import { submitCode } from '../api/submissions'
import { completeSession, getSessionReport, reportCheatEvent } from '../api/sessions'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAssessmentTimer } from '../hooks/useTimer'
import { useSnapshots } from '../hooks/useSnapshots'
import { AntiCheatMonitor } from '../lib/antiCheat'
import type { Challenge, TestCase, CheatEventType, CheatSeverity } from '../types'

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'var(--success)',
  MEDIUM: 'var(--warning)',
  HARD: 'var(--danger)',
}

export default function ChallengeArena() {
  const navigate = useNavigate()
  const sessionId = localStorage.getItem('sessionId')
  const candidateName = localStorage.getItem('candidateName') ?? 'Candidate'

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [codes, setCodes] = useState<Record<number, string>>({})
  const [lineCount, setLineCount] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [submitted, setSubmitted] = useState<Set<number>>(new Set())
  const [passed, setPassed] = useState<Set<number>>(new Set())
  // Assessment-level timer: one deadline for the whole session (from the server), not per challenge
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(0)
  const [timeUp, setTimeUp] = useState(false)
  const [submissionCounts, setSubmissionCounts] = useState<Record<number, number>>({})
  const [hintsOpen, setHintsOpen] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [hintRevealed, setHintRevealed] = useState<Record<number, Set<string>>>({})
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [flagged, setFlagged] = useState(false)

  const monitorRef = useRef<AntiCheatMonitor | null>(null)
  const autoAdvancedChallenges = useRef<Set<number>>(new Set())
  const finishingRef = useRef(false)
  const fiveMinWarnedRef = useRef(false)
  // Last code sent for each challenge — auto-submit at the deadline skips anything already scored
  const lastSubmittedCode = useRef<Record<number, string>>({})
  // Per-challenge time-on-task (seconds accumulated while the challenge was the active tab)
  const challengeSeconds = useRef<Record<number, number>>({})
  const activeSince = useRef<number>(Date.now())

  const activeChallenge = challenges[activeIdx]
  const { instantResults, deepResults, deepStatus, resetForNewSubmission } = useWebSocket(sessionId, activeChallenge?.id ?? null)

  // Mark challenge as passed from structural checks — but only when no deep JUnit
  // verification was ever attempted for this submission. If deepStatus is 'running'
  // or 'error', this instantResults is just a fallback/preview, not a real pass —
  // the deep-result effect below is the source of truth for those challenges.
  useEffect(() => {
    if (!activeChallenge || !instantResults || deepStatus !== 'idle') return
    const allPassed = instantResults.testResults.length > 0 && instantResults.testResults.every(t => t.passed)
    if (allPassed) setPassed(prev => new Set([...prev, activeChallenge.id]))
  }, [instantResults, activeChallenge, deepStatus])

  // Mark challenge as passed when all JUnit tests pass
  useEffect(() => {
    if (!activeChallenge || !deepResults) return
    const allPassed = deepResults.totalCount > 0 && deepResults.passedCount === deepResults.totalCount
    if (allPassed) setPassed(prev => new Set([...prev, activeChallenge.id]))
  }, [deepResults, activeChallenge])

  // Clear the "verifying" lock once we have a final outcome for this submission —
  // a real JUnit done/error, or (when no deep run was ever attempted) the instant result.
  useEffect(() => {
    if (deepStatus === 'done' || deepStatus === 'error') {
      setVerifying(false)
    } else if (deepStatus === 'idle' && instantResults) {
      setVerifying(false)
    }
  }, [deepStatus, instantResults])

  // Reset the verifying lock whenever the active challenge changes
  useEffect(() => { setVerifying(false) }, [activeChallenge?.id])

  // Auto-advance to next challenge 1.5 s after passing (each challenge advances only once)
  useEffect(() => {
    if (!activeChallenge || !passed.has(activeChallenge.id)) return
    if (autoAdvancedChallenges.current.has(activeChallenge.id)) return
    const nextIdx = activeIdx + 1
    if (nextIdx >= challenges.length) return
    autoAdvancedChallenges.current.add(activeChallenge.id)
    const t = setTimeout(() => setActiveIdx(nextIdx), 1500)
    return () => clearTimeout(t)
  }, [passed, activeChallenge, activeIdx, challenges.length])

  const testCases = useMemo<TestCase[]>(() => {
    try { return JSON.parse(activeChallenge?.testCasesJson ?? '[]') } catch { return [] }
  }, [activeChallenge?.testCasesJson])
  const { save, load } = useSnapshots(sessionId)

  // Latest state for async callbacks (deadline auto-submit runs across several renders)
  const latest = useRef({ challenges, codes, passed, hintRevealed })
  latest.current = { challenges, codes, passed, hintRevealed }

  const activeChallengeId = activeChallenge?.id
  const challengeElapsed = (id: number) =>
    Math.round((challengeSeconds.current[id] ?? 0) +
      (id === activeChallengeId ? (Date.now() - activeSince.current) / 1000 : 0))

  // On every challenge switch: persist the code of the challenge being left, and bank its time-on-task.
  // The cleanup closes over the *outgoing* challenge id, so it saves exactly the one being left.
  useEffect(() => {
    if (activeChallengeId === undefined) return
    activeSince.current = Date.now()
    return () => {
      const code = latest.current.codes[activeChallengeId]
      if (code !== undefined) save(activeChallengeId, code)
      challengeSeconds.current[activeChallengeId] =
        (challengeSeconds.current[activeChallengeId] ?? 0) + (Date.now() - activeSince.current) / 1000
    }
  }, [activeChallengeId, save])

  // Deadline reached: lock the arena, submit every attempted-but-unscored challenge, then finish.
  const handleTimeUp = async () => {
    if (finishingRef.current) return
    setTimeUp(true)
    setWarningMessage("Time's up — your work is being submitted automatically.")
    const { challenges: cs, codes: cur, passed: done, hintRevealed: hints } = latest.current
    for (const c of cs) {
      const code = cur[c.id] ?? ''
      if (done.has(c.id)) continue                                   // already passed
      if (!code.trim() || code === (c.starterCode ?? '')) continue    // never attempted
      if (lastSubmittedCode.current[c.id] === code) continue         // this exact code already scored
      save(c.id, code)
      lastSubmittedCode.current[c.id] = code
      try {
        await submitCode({
          challengeId: c.id,
          code,
          elapsedSeconds: challengeElapsed(c.id),
          hintsUsed: hints[c.id]?.size ?? 0,
        })
      } catch {
        // Best effort — a failure here (e.g. past the server's grace window) must not block finishing
      }
    }
    await handleFinish()
  }

  const timer = useAssessmentTimer(deadlineMs, handleTimeUp)

  // One-time heads-up when 5 minutes remain
  useEffect(() => {
    if (timer.remaining === null || fiveMinWarnedRef.current) return
    if (timer.remaining > 0 && timer.remaining <= 300 && timeLimitSeconds > 300) {
      fiveMinWarnedRef.current = true
      setWarningMessage('5 minutes left — all attempted challenges will be submitted automatically when time runs out.')
    }
  }, [timer.remaining, timeLimitSeconds])

  // ── Session guard: block back-navigation while in assessment ────────────
  useEffect(() => {
    if (!sessionId) { navigate('/'); return }

    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [sessionId, navigate])

  // ── Anti-cheat monitor ──────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return

    const handleEvent = (type: CheatEventType, severity: CheatSeverity, detail?: string) => {
      reportCheatEvent(sessionId, type, severity, detail).catch(() => {})
    }
    const handleWarning = (message: string) => {
      setWarningMessage(message)
    }
    const handleFlag = () => {
      setFlagged(true)
      setWarningMessage('Your session has been flagged due to multiple violations. The recruiter will review this session.')
    }

    const monitor = new AntiCheatMonitor({
      sessionId,
      onEvent: handleEvent,
      onWarning: handleWarning,
      onSessionFlag: handleFlag,
    })
    monitorRef.current = monitor
    monitor.start()

    return () => { monitor.finish() }
  }, [sessionId])

  // ── Auto-save every 30s ─────────────────────────────────────────────────
  useEffect(() => {
    if (!activeChallenge) return
    const t = setInterval(() => {
      const code = codes[activeChallenge.id]
      if (code) save(activeChallenge.id, code)
    }, 30000)
    return () => clearInterval(t)
  }, [activeChallenge, codes, save])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'h') { e.preventDefault(); setHintsOpen(o => !o) }
      if (e.ctrlKey && !isNaN(Number(e.key)) && Number(e.key) >= 1 && Number(e.key) <= 6) {
        e.preventDefault()
        setActiveIdx(Number(e.key) - 1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Load challenges ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return
    Promise.all([getChallenges(), getSessionReport(sessionId).catch(() => null)]).then(([cs, session]) => {
      setChallenges(cs)
      const initial: Record<number, string> = {}
      cs.forEach(c => { initial[c.id] = load(c.id) ?? c.starterCode ?? '' })
      setCodes(initial)
      // Server-side remaining time survives refreshes and is the authority (submissions are rejected
      // after the deadline). Fallback to the sum of challenge limits only if the session can't be read.
      const fallback = cs.reduce((sum, c) => sum + (c.timeLimitSeconds ?? 0), 0)
      const remaining = session?.remainingSeconds ?? fallback
      setTimeLimitSeconds(session?.timeLimitSeconds ?? fallback)
      setDeadlineMs(Date.now() + remaining * 1000)
    })
  }, [sessionId, load])

  const handleSubmit = async () => {
    if (!activeChallenge || timeUp || submitting || verifying || passed.has(activeChallenge.id)) return
    resetForNewSubmission()
    setSubmitting(true)
    setVerifying(true)
    setSubmitError('')
    const newCount = (submissionCounts[activeChallenge.id] ?? 0) + 1
    setSubmissionCounts(prev => ({ ...prev, [activeChallenge.id]: newCount }))
    monitorRef.current?.logMultipleSubmissions(activeChallenge.id, newCount)
    try {
      save(activeChallenge.id, codes[activeChallenge.id] ?? '')
      lastSubmittedCode.current[activeChallenge.id] = codes[activeChallenge.id] ?? ''
      const hintsUsed = hintRevealed[activeChallenge.id]?.size ?? 0
      await submitCode({
        challengeId: activeChallenge.id,
        code: codes[activeChallenge.id] ?? '',
        elapsedSeconds: challengeElapsed(activeChallenge.id),
        hintsUsed,
      })
      setSubmitted(prev => new Set([...prev, activeChallenge.id]))
    } catch (e: any) {
      setVerifying(false)
      setSubmitError(e?.response?.data?.message ?? 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinish = async () => {
    if (!sessionId || finishingRef.current) return
    finishingRef.current = true
    if (activeChallenge) save(activeChallenge.id, latest.current.codes[activeChallenge.id] ?? '')
    monitorRef.current?.finish()
    try { await completeSession(sessionId) } catch {}
    localStorage.setItem('completedSessionId', sessionId)
    localStorage.removeItem('sessionId')
    localStorage.removeItem('candidateName')
    navigate('/report')
  }

  if (challenges.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--muted)]">
          <div className="animate-spin w-5 h-5 border-2 border-[var(--blue)] border-t-transparent rounded-full" />
          Loading challenges...
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)] overflow-hidden">

      {/* Flagged overlay */}
      {flagged && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          background: 'rgba(10,14,26,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-raised)',
            border: '1px solid rgba(255,180,171,0.4)',
            borderTop: '4px solid var(--danger)',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '480px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🚨</div>
            <h2 style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--danger)', marginBottom: '12px' }}>
              Session Flagged
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Multiple integrity violations were detected. Your session has been flagged and will be reviewed by the recruiter. You may still submit your work.
            </p>
            <button
              onClick={() => setFlagged(false)}
              style={{
                background: 'var(--danger-muted)', border: '1px solid rgba(255,180,171,0.3)',
                borderRadius: '8px', color: 'var(--danger)',
                padding: '10px 24px', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.9rem',
              }}
            >
              Continue Assessment
            </button>
          </div>
        </div>
      )}

      {/* Time's up overlay — shown while the deadline auto-submit + finish runs */}
      {timeUp && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3100,
          background: 'rgba(10,14,26,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="flex flex-col items-center gap-4 text-center px-10 py-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] max-w-md">
            <div className="orbitron text-xl font-bold text-[var(--red)]">Time's up</div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              The assessment time limit has been reached. Your attempted challenges are being
              submitted automatically and you'll be taken to your report.
            </p>
            <div className="animate-spin w-6 h-6 border-2 border-[var(--blue)] border-t-transparent rounded-full" />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-14 flex items-center px-4 gap-4 bg-[var(--surface)] border-b border-[var(--border)] shrink-0 z-20">
        <div className="orbitron text-sm font-bold text-white shrink-0">
          Java<span className="text-[var(--blue)]">MSA</span>
        </div>

        {/* Challenge tabs */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {challenges.map((c, i) => {
            const isPassed = passed.has(c.id)
            return (
              <button
                key={c.id}
                onClick={() => setActiveIdx(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors ${
                  i === activeIdx
                    ? isPassed
                      ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                      : 'bg-[var(--elevated)] text-white border border-[var(--border)]'
                    : isPassed
                      ? 'text-green-400/70 hover:text-green-300'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <span className="font-mono">{i + 1}</span>
                <span className="hidden md:inline">{c.title.split(' ')[0]}</span>
                {isPassed ? (
                  <span className="text-[9px] px-1 rounded bg-green-800/40 text-green-400 border border-green-700/40 font-semibold">PASSED</span>
                ) : (
                  <span
                    className="text-[10px] px-1 rounded border"
                    style={{ color: DIFFICULTY_COLORS[c.difficulty], borderColor: DIFFICULTY_COLORS[c.difficulty] }}
                  >
                    {c.difficulty[0]}
                  </span>
                )}
                {submitted.has(c.id) && !isPassed && <span className="text-[var(--green)]">✓</span>}
              </button>
            )
          })}
        </div>

        {/* Session info + finish */}
        <div className="flex items-center gap-3 shrink-0">
          {flagged && (
            <span style={{
              fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
              background: 'rgba(255,180,171,0.1)', color: 'var(--danger)',
              border: '1px solid rgba(255,180,171,0.3)',
              fontFamily: 'var(--font-code)', letterSpacing: '0.04em',
            }}>⚠ FLAGGED</span>
          )}
          {timer.remaining !== null && (
            <Timer remaining={timer.remaining} limitSeconds={timeLimitSeconds} />
          )}
          <span className="text-xs text-[var(--muted)] hidden sm:inline">{candidateName}</span>
          <button
            onClick={handleFinish}
            className="px-3 py-1.5 text-xs bg-[var(--green)] hover:bg-green-400 text-black font-semibold rounded transition-colors"
          >
            Finish & Report
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '60% 40%' }}>
        {/* Left: Editor */}
        <div className="flex flex-col border-r border-[var(--border)] overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={codes[activeChallenge.id] ?? ''}
              onChange={val => setCodes(prev => ({ ...prev, [activeChallenge.id]: val }))}
              onSubmit={handleSubmit}
              lineCount={lineCount}
              onLineCountChange={setLineCount}
              readOnly={timeUp || passed.has(activeChallenge.id)}
            />
          </div>
          <div className="h-10 flex items-center justify-between px-3 bg-[var(--surface)] border-t border-[var(--border)] shrink-0">
            <span className="text-[10px] text-[var(--muted)]">
              {passed.has(activeChallenge.id) ? 'Challenge passed — read only' : `${lineCount} lines · Ctrl+Enter to run`}
            </span>
            {submitError && (
              <span className="text-[10px] text-[var(--red)] truncate max-w-xs">{submitError}</span>
            )}
            {passed.has(activeChallenge.id) ? (
              <span className="flex items-center gap-1.5 px-3 py-1 text-xs bg-green-800/30 text-green-400 border border-green-700/40 rounded">
                ✓ All Tests Passed
              </span>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={timeUp || submitting || verifying}
                className="flex items-center gap-1.5 px-3 py-1 text-xs bg-[var(--blue)] hover:bg-blue-500 disabled:opacity-50 text-white rounded transition-colors"
              >
                {submitting || verifying ? (
                  <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                ) : '▶'}
                Run Tests
              </button>
            )}
          </div>
        </div>

        {/* Right: Info + Results */}
        <div className="flex flex-col overflow-hidden">
          <div className="shrink-0 border-b border-[var(--border)]">
            <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-white text-sm">{activeChallenge.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded border"
                    style={{ color: DIFFICULTY_COLORS[activeChallenge.difficulty], borderColor: DIFFICULTY_COLORS[activeChallenge.difficulty] }}
                  >
                    {activeChallenge.difficulty}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">{activeChallenge.category}</span>
                </div>
              </div>
              <button
                onClick={() => setHintsOpen(true)}
                className="text-[10px] px-2 py-1 rounded border border-[var(--amber)] text-[var(--amber)] hover:bg-amber-900/20 transition-colors shrink-0"
              >
                💡 Hints
              </button>
            </div>

            <div className="px-4 pb-2 max-h-52 overflow-y-auto space-y-3">
              <div>
                <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold mb-1.5">
                  Scoring — 100 pts total
                </div>
                <div className="space-y-0.5">
                  {testCases.map((tc, i) => (
                    <div key={tc.id} className="flex items-center justify-between gap-2 py-0.5">
                      <span className="text-[10px] text-[var(--muted)]">{i + 1}. {tc.label}</span>
                      <span className="text-[10px] font-mono text-[var(--blue)] shrink-0">{tc.weight} pt</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold mb-1.5">
                  Description
                </div>
                <pre className="text-[11px] text-[var(--muted)] leading-relaxed whitespace-pre-wrap font-sans">
                  {activeChallenge.description}
                </pre>
              </div>
            </div>
          </div>

          {/* Test Results — takes all remaining height */}
          <div className="flex-1 overflow-y-auto p-3">
            <TestResults
              instantResults={instantResults}
              deepResults={deepResults}
              deepStatus={deepStatus}
            />
          </div>
        </div>
      </div>

      <HintsDrawer
        hintsJson={activeChallenge.hintsJson}
        open={hintsOpen}
        onClose={() => setHintsOpen(false)}
        revealed={hintRevealed[activeChallenge.id] ?? new Set()}
        onReveal={(hintId) => setHintRevealed(prev => ({
          ...prev,
          [activeChallenge.id]: new Set([...(prev[activeChallenge.id] ?? []), hintId]),
        }))}
      />

      <AntiCheatBanner
        message={warningMessage}
        onDismiss={() => setWarningMessage(null)}
      />
    </div>
  )
}
