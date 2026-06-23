import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession } from '../api/sessions'

type BackendState = 'checking' | 'waking' | 'ready' | 'timeout'

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

export default function Landing() {
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
        const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(8000) })
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
      if (!stopped) pollRef.current = setTimeout(ping, 3000)
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        height: '64px',
      }}>
        <div style={{
          maxWidth: '1440px', margin: '0 auto',
          padding: '0 32px', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32, height: 32, flexShrink: 0,
              background: 'var(--accent)',
              borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.8rem', color: 'var(--on-accent)',
              fontFamily: 'var(--font-ui)',
            }}>JM</div>
            <span style={{
              fontFamily: 'var(--font-ui)', fontWeight: 700,
              fontSize: '1.05rem', color: 'var(--accent)',
              letterSpacing: '-0.01em',
            }}>Java MSA Interviewer</span>
          </div>
          <button
            onClick={() => navigate('/recruiter')}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              padding: '6px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-ui)',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          >
            Recruiter Portal
          </button>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main style={{ paddingTop: '88px', paddingBottom: '48px', flex: 1 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>

          {/* ── Hero: info card + registration panel ─────────────────────── */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: '1fr 420px',
            gap: '28px',
          }}>
            {/* Left: Info card */}
            <div style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '12px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '380px',
            }}>
              {/* Subtle radial glow */}
              <div style={{
                position: 'absolute', top: -100, right: -100,
                width: 320, height: 320,
                background: 'radial-gradient(circle, rgba(164,230,255,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '14px' }}>
                  Developer Assessment Portal
                </div>
                <h1 style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                  maxWidth: '520px',
                }}>
                  Java Spring Boot<br />
                  <span style={{ color: 'var(--accent)' }}>Microservices</span><br />
                  Technical Challenge
                </h1>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  maxWidth: '480px',
                  marginBottom: '28px',
                }}>
                  A timed, proctored assessment covering REST APIs, Service Layer, JPA,
                  Exception Handling, WebClient, and JWT Security.
                  Instant JavaParser analysis with GitHub Actions deep verification.
                </p>

                {/* Tech badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Spring Boot 3.2', 'Java 17', 'JavaParser AST', 'JPA / Hibernate', 'JWT Security'].map(tag => (
                    <span key={tag} style={{
                      background: 'var(--accent-muted)',
                      border: '1px solid rgba(164,230,255,0.2)',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '0.8rem',
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-code)',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Registration glass panel */}
            <div className="glass-panel" style={{ borderRadius: '12px', padding: '36px' }}>
              <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '8px' }}>
                Start Your Assessment
              </div>
              <h2 style={{
                fontFamily: 'var(--font-ui)', fontWeight: 700,
                fontSize: '1.25rem', color: 'var(--text-primary)',
                letterSpacing: '-0.01em', marginBottom: '6px',
              }}>
                Register &amp; Begin
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Enter your details to start the Spring Boot Microservices assessment.
              </p>

              {/* Backend status */}
              <div style={{ marginBottom: '16px', fontSize: '10px', fontFamily: 'var(--font-code)' }}>
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
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
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
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = loading ? '0.7' : '1'; }}
                >
                  {loading ? (
                    <>
                      <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
                      </svg>
                      Starting Assessment…
                    </>
                  ) : backendState !== 'ready' ? (
                    'Waiting for backend...'
                  ) : 'Begin Assessment →'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  By starting you agree that this session is monitored for academic integrity.
                </p>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
