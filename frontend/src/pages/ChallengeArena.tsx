import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeEditor from '../components/CodeEditor'
import TestResults from '../components/TestResults'
import AnalysisLog from '../components/AnalysisLog'
import Timer from '../components/Timer'
import HintsDrawer from '../components/HintsDrawer'
import { getChallenges, getChallenge } from '../api/challenges'
import { submitCode } from '../api/submissions'
import { completeSession } from '../api/sessions'
import { useWebSocket } from '../hooks/useWebSocket'
import { useTimer } from '../hooks/useTimer'
import { useSnapshots } from '../hooks/useSnapshots'
import type { Challenge } from '../types'

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#22c55e',
  MEDIUM: '#f59e0b',
  HARD: '#ef4444',
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
  const [submitted, setSubmitted] = useState<Set<number>>(new Set())
  const [hintsOpen, setHintsOpen] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const { instantResults, deepResults, logs, deepStatus, isConnected } = useWebSocket(sessionId)
  const { save, load } = useSnapshots(sessionId)

  const activeChallenge = challenges[activeIdx]
  const timer = useTimer(activeChallenge?.timeLimitSeconds ?? 600)

  // Auto-save every 30s
  useEffect(() => {
    if (!activeChallenge) return
    const t = setInterval(() => {
      const code = codes[activeChallenge.id]
      if (code) save(activeChallenge.id, code)
    }, 30000)
    return () => clearInterval(t)
  }, [activeChallenge, codes, save])

  // Keyboard shortcuts
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

  // Load challenges
  useEffect(() => {
    if (!sessionId) { navigate('/start'); return }
    getChallenges().then(cs => {
      setChallenges(cs)
      const initial: Record<number, string> = {}
      cs.forEach(c => {
        initial[c.id] = load(c.id) ?? c.starterCode ?? ''
      })
      setCodes(initial)
    })
  }, [sessionId, navigate, load])

  const handleSubmit = async () => {
    if (!activeChallenge || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      save(activeChallenge.id, codes[activeChallenge.id] ?? '')
      await submitCode({
        challengeId: activeChallenge.id,
        code: codes[activeChallenge.id] ?? '',
        elapsedSeconds: timer.elapsed,
      })
      setSubmitted(prev => new Set([...prev, activeChallenge.id]))
    } catch (e: any) {
      setSubmitError(e?.response?.data?.message ?? 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinish = async () => {
    if (!sessionId) return
    try {
      await completeSession(sessionId)
    } catch {}
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
      {/* Header */}
      <header className="h-14 flex items-center px-4 gap-4 bg-[var(--surface)] border-b border-[var(--border)] shrink-0 z-20">
        {/* Logo */}
        <div className="orbitron text-sm font-bold text-white shrink-0">
          Java<span className="text-[var(--blue)]">MSA</span>
        </div>

        {/* Challenge tabs */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {challenges.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveIdx(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors ${
                i === activeIdx
                  ? 'bg-[var(--elevated)] text-white border border-[var(--border)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <span className="font-mono">{i + 1}</span>
              <span className="hidden md:inline">{c.title.split(' ')[0]}</span>
              <span
                className="text-[10px] px-1 rounded border"
                style={{ color: DIFFICULTY_COLORS[c.difficulty], borderColor: DIFFICULTY_COLORS[c.difficulty] }}
              >
                {c.difficulty[0]}
              </span>
              {submitted.has(c.id) && <span className="text-[var(--green)]">✓</span>}
            </button>
          ))}
        </div>

        {/* Session info + finish */}
        <div className="flex items-center gap-3 shrink-0">
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
            />
          </div>
          {/* Bottom bar */}
          <div className="h-10 flex items-center justify-between px-3 bg-[var(--surface)] border-t border-[var(--border)] shrink-0">
            <span className="text-[10px] text-[var(--muted)]">
              {lineCount} lines · Ctrl+Enter to run
            </span>
            {submitError && (
              <span className="text-[10px] text-[var(--red)] truncate max-w-xs">{submitError}</span>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-[var(--blue)] hover:bg-blue-500 disabled:opacity-50 text-white rounded transition-colors"
            >
              {submitting ? (
                <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
              ) : '▶'}
              Run Tests
            </button>
          </div>
        </div>

        {/* Right: Info + Results + Log */}
        <div className="flex flex-col overflow-hidden">
          {/* Top: Challenge info */}
          <div className="shrink-0 p-4 border-b border-[var(--border)] space-y-3">
            <div className="flex items-start justify-between gap-2">
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
                className="text-[10px] px-2 py-1 rounded border border-[var(--amber)] text-[var(--amber)] hover:bg-amber-900/20 transition-colors"
              >
                💡 Hints
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed max-h-20 overflow-y-auto">
              {activeChallenge.description}
            </p>

            <Timer
              remaining={timer.remaining}
              elapsed={timer.elapsed}
              limitSeconds={activeChallenge.timeLimitSeconds}
              isRunning={timer.isRunning}
              onStart={timer.start}
              onPause={timer.pause}
              onResume={timer.resume}
            />
          </div>

          {/* Middle: Test results */}
          <div className="flex-1 overflow-y-auto p-3">
            <TestResults
              instantResults={instantResults}
              deepResults={deepResults}
              deepStatus={deepStatus}
            />
          </div>

          {/* Bottom: Log */}
          <div className="h-28 shrink-0 border-t border-[var(--border)]">
            <AnalysisLog logs={logs} isConnected={isConnected} />
          </div>
        </div>
      </div>

      <HintsDrawer
        hintsJson={activeChallenge.hintsJson}
        open={hintsOpen}
        onClose={() => setHintsOpen(false)}
      />
    </div>
  )
}
