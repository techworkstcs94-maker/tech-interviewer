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
        const base = import.meta.env.VITE_API_URL || ''
        const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) })
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

  const canSubmit = backendState === 'ready' && !loading

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-highest)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-ui)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: 'var(--text-muted)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <header style={{
        height: '64px',
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 32px', gap: '10px',
      }}>
        <div style={{
          width: 32, height: 32, flexShrink: 0,
          background: 'var(--accent)', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.8rem', color: 'var(--on-accent)',
          fontFamily: 'var(--font-ui)',
        }}>JM</div>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent)' }}>
          Java MSA Interviewer
        </span>
      </header>

      {/* Centered card */}
      <main style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px',
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '10px' }}>
              Developer Assessment Portal
            </div>
            <h1 style={{
              fontFamily: 'var(--font-ui)', fontWeight: 800,
              fontSize: '1.75rem', letterSpacing: '-0.02em',
              color: 'var(--text-primary)', marginBottom: '8px',
            }}>
              Start Your Assessment
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Enter your details to begin the Spring Boot Microservices challenge.
            </p>
          </div>

          <div className="glass-panel" style={{ borderRadius: '12px', padding: '40px' }}>

            {/* Backend status */}
            <div style={{ marginBottom: '20px', fontSize: '11px', fontFamily: 'var(--font-code)' }}>
              {backendState === 'checking' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', border: '1px solid currentColor', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  Checking backend...
                </span>
              )}
              {backendState === 'waking' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                  Backend waking up — usually 20–40s
                </span>
              )}
              {backendState === 'ready' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                  Backend ready
                </span>
              )}
              {backendState === 'timeout' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                  Backend unreachable — try refreshing
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  style={inputStyle}
                  disabled={loading}
                  autoComplete="name"
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  style={inputStyle}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <div style={{
                  background: 'var(--danger-muted)',
                  border: '1px solid rgba(255,180,171,0.3)',
                  borderRadius: '6px', padding: '10px 14px',
                  color: 'var(--danger)', fontSize: '0.85rem',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: canSubmit ? 'var(--accent)' : 'var(--bg-highest)',
                  color: canSubmit ? 'var(--on-accent)' : 'var(--text-muted)',
                  border: 'none', borderRadius: '8px',
                  fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.95rem',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
                    </svg>
                    Starting Assessment…
                  </>
                ) : backendState !== 'ready' ? 'Waiting for backend...' : 'Begin Assessment →'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                By starting you agree that this session is monitored for academic integrity.
              </p>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', fontSize: '0.8rem',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
              >
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
