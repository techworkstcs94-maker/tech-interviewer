import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getInviteInfo, startWithInvite, formatDuration, type InviteInfo } from '../api/invites'

type BackendState = 'checking' | 'waking' | 'ready' | 'timeout'

/**
 * Landing page for a recruiter-issued, single-use assessment link (/a/:token).
 * Shows who the link is for and what it contains, then starts the session on confirm.
 */
export default function InviteEntry() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const [backendState, setBackendState] = useState<BackendState>('checking')
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loadError, setLoadError] = useState('')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const startedAt = useRef(Date.now())

  // Wake the (free-tier) backend before asking it about the link
  useEffect(() => {
    const cached = localStorage.getItem('backendReady')
    if (cached && Date.now() - Number(cached) < 120_000) { setBackendState('ready'); return }
    let stopped = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const ping = async () => {
      if (stopped) return
      attempts++
      try {
        const base = import.meta.env.VITE_API_URL || ''
        const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(8000) })
        if (res.ok) {
          localStorage.setItem('backendReady', Date.now().toString())
          setBackendState('ready')
          return
        }
      } catch {}
      if (stopped) return
      if (Date.now() - startedAt.current > 90_000) { setBackendState('timeout'); return }
      if (attempts >= 2) setBackendState('waking')
      timer = setTimeout(ping, 3000)
    }
    ping()
    return () => { stopped = true; clearTimeout(timer) }
  }, [])

  useEffect(() => {
    if (backendState !== 'ready') return
    getInviteInfo(token)
      .then(setInfo)
      .catch((err) => setLoadError(
        err?.response?.status === 404
          ? 'This assessment link is not valid. Please check the URL or contact your recruiter.'
          : 'Could not load this assessment link. Please refresh the page.'))
  }, [backendState, token])

  // Same browser that already started this link → offer to resume instead of "already used"
  const canResume = info?.state === 'USED'
    && localStorage.getItem('inviteToken') === token
    && !!localStorage.getItem('sessionId')
    && !!localStorage.getItem('token')

  const handleStart = async () => {
    setStarting(true)
    setStartError('')
    try {
      const res = await startWithInvite(token)
      localStorage.setItem('token', res.token)
      localStorage.setItem('sessionId', res.sessionId)
      localStorage.setItem('candidateName', res.candidateName)
      localStorage.setItem('inviteToken', token)
      navigate('/challenge')
    } catch (err: any) {
      setStartError(err?.response?.data?.message ?? 'Failed to start the assessment. Please try again.')
      // Refresh state (e.g. link was used in another tab or revoked meanwhile)
      getInviteInfo(token).then(setInfo).catch(() => {})
    } finally {
      setStarting(false)
    }
  }

  const blocked: Record<string, { title: string; body: string }> = {
    EXPIRED: { title: 'Link expired', body: 'This assessment link has expired. Please contact your recruiter for a new one.' },
    REVOKED: { title: 'Link revoked', body: 'This assessment link is no longer active. Please contact your recruiter.' },
    USED: { title: 'Link already used', body: 'This assessment has already been started. Each link can only be used once — contact your recruiter if this is unexpected.' },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        height: '64px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 32px', gap: '10px',
      }}>
        <div style={{
          width: 32, height: 32, flexShrink: 0, background: 'var(--accent)', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.8rem', color: 'var(--on-accent)', fontFamily: 'var(--font-ui)',
        }}>JM</div>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent)' }}>
          Java MSA Interviewer
        </span>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', padding: '36px' }}>
          {backendState !== 'ready' && !loadError ? (
            <StatusLine state={backendState} />
          ) : loadError ? (
            <Message title="Link unavailable" body={loadError} tone="danger" />
          ) : !info ? (
            <StatusLine state="checking" label="Loading your assessment…" />
          ) : info.state !== 'VALID' && !canResume ? (
            <Message {...blocked[info.state]} tone={info.state === 'USED' ? 'warning' : 'danger'} />
          ) : (
            <>
              <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '10px' }}>
                {canResume ? 'Assessment in progress' : 'You are invited'}
              </div>
              <h1 style={{
                fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.5rem',
                letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '6px',
              }}>
                {info.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Hi <strong style={{ color: 'var(--text-primary)' }}>{info.candidateName}</strong> — this assessment was prepared for you.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <Stat label="Challenges" value={String(info.challengeCount)} />
                <Stat label="Total time" value={formatDuration(info.totalTimeSeconds)} />
              </div>

              {!canResume && (
                <ul style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.7, marginBottom: '24px', paddingLeft: '18px' }}>
                  <li>The timer starts as soon as you click <em>Begin</em> and covers all challenges.</li>
                  <li>When time runs out, everything you've written is submitted automatically.</li>
                  <li>This link works once — don't close the tab mid-assessment on another device.</li>
                  <li>The session is monitored for academic integrity.</li>
                </ul>
              )}

              {startError && (
                <div style={{
                  background: 'var(--danger-muted)', border: '1px solid rgba(255,180,171,0.3)',
                  borderRadius: '6px', padding: '10px 14px', color: 'var(--danger)',
                  fontSize: '0.85rem', marginBottom: '16px',
                }}>{startError}</div>
              )}

              <button
                onClick={canResume ? () => navigate('/challenge') : handleStart}
                disabled={starting}
                style={{
                  width: '100%', padding: '12px 24px', background: 'var(--accent)', color: 'var(--on-accent)',
                  border: 'none', borderRadius: '8px', fontFamily: 'var(--font-ui)', fontWeight: 700,
                  fontSize: '0.95rem', cursor: starting ? 'not-allowed' : 'pointer', opacity: starting ? 0.7 : 1,
                }}
              >
                {starting ? 'Starting…' : canResume ? 'Resume Assessment →' : 'Begin Assessment →'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
      <div className="label-caps" style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function Message({ title, body, tone }: { title: string; body: string; tone: 'danger' | 'warning' }) {
  const color = tone === 'danger' ? 'var(--danger)' : 'var(--warning)'
  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.3rem', color, marginBottom: '10px' }}>{title}</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{body}</p>
    </div>
  )
}

function StatusLine({ state, label }: { state: BackendState; label?: string }) {
  const text = label ?? {
    checking: 'Connecting…',
    waking: 'Server waking up — usually 20–40s',
    ready: 'Ready',
    timeout: 'Server unreachable — please refresh the page',
  }[state]
  const color = state === 'timeout' ? 'var(--danger)' : state === 'waking' ? 'var(--warning)' : 'var(--text-muted)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color, fontFamily: 'var(--font-code)', fontSize: '0.85rem', padding: '24px 0' }}>
      {state !== 'timeout' && (
        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
      )}
      {text}
    </div>
  )
}
