import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession } from '../api/sessions'

type BackendState = 'checking' | 'waking' | 'ready' | 'timeout'

export default function CandidateEntry() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backendState, setBackendState] = useState<BackendState>('checking')
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedAt = useRef(Date.now())

  // Poll /api/challenges until the backend responds 200.
  // Fast-path: if Landing page already confirmed readiness within the last 2 min,
  // skip polling entirely — the backend is already awake.
  useEffect(() => {
    const cached = localStorage.getItem('backendReady')
    if (cached && Date.now() - Number(cached) < 120_000) {
      setBackendState('ready')
      return
    }

    let stopped = false
    let attempts = 0

    const ping = async () => {
      if (stopped) return
      attempts++
      try {
        const res = await fetch('/api/challenges', { signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          localStorage.setItem('backendReady', Date.now().toString())
          setBackendState('ready')
          stopped = true
          return
        }
      } catch {}

      if (stopped) return
      const elapsed = Date.now() - startedAt.current
      if (elapsed > 90_000) {
        setBackendState('timeout')
        stopped = true
      } else if (attempts >= 2) {
        setBackendState('waking')
      }

      if (!stopped) pollRef.current = setTimeout(ping, 2000)
    }

    ping()
    return () => { stopped = true; clearTimeout(pollRef.current!) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required')
      return
    }
    if (backendState !== 'ready') return
    setLoading(true)
    setError('')

    try {
      const res = await startSession(name.trim(), email.trim())
      localStorage.setItem('token', res.token)
      localStorage.setItem('sessionId', res.sessionId)
      localStorage.setItem('candidateName', res.candidateName)
      navigate('/challenge')
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  const backendBadge = () => {
    switch (backendState) {
      case 'checking':
        return (
          <span className="flex items-center gap-1.5 text-[var(--muted)]">
            <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
            Checking backend...
          </span>
        )
      case 'waking':
        return (
          <span className="flex items-center gap-1.5 text-[var(--amber)]">
            <span className="animate-pulse w-2 h-2 rounded-full bg-[var(--amber)]" />
            Backend waking up — usually takes 20–40s
          </span>
        )
      case 'ready':
        return (
          <span className="flex items-center gap-1.5 text-[var(--green)]">
            <span className="w-2 h-2 rounded-full bg-[var(--green)]" />
            Backend ready
          </span>
        )
      case 'timeout':
        return (
          <span className="flex items-center gap-1.5 text-[var(--red)]">
            <span className="w-2 h-2 rounded-full bg-[var(--red)]" />
            Backend unreachable — try refreshing
          </span>
        )
    }
  }

  const canSubmit = backendState === 'ready' && !loading

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="orbitron text-3xl font-bold text-white mb-2">
            Java<span className="text-[var(--blue)]">MSA</span> Arena
          </h1>
          <p className="text-[var(--muted)] text-sm">Enter your details to start the assessment</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 space-y-5">
          {/* Backend status indicator */}
          <div className="text-[10px] pb-1">{backendBadge()}</div>

          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-[var(--red)] text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[var(--blue)] hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Starting...
              </span>
            ) : backendState !== 'ready' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full opacity-50" />
                Waiting for backend...
              </span>
            ) : 'Start Assessment →'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </form>

        <div className="mt-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 text-xs text-[var(--muted)] space-y-1">
          <p className="font-semibold text-[var(--text)]">What to expect:</p>
          <p>• 6 Spring Boot challenges (Easy → Hard)</p>
          <p>• Instant JavaParser analysis (&lt;1s)</p>
          <p>• Deep GitHub Actions verification (2-4min)</p>
          <p>• Live results via WebSocket</p>
        </div>
      </div>
    </div>
  )
}
