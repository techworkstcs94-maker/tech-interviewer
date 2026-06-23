import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recruiterLogin } from '../api/sessions'

export default function RecruiterLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await recruiterLogin(username, password)
      localStorage.setItem('recruiterToken', res.token)
      localStorage.setItem('token', res.token)
      navigate('/recruiter/dashboard')
    } catch {
      setError('Incorrect credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
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
        <span style={{
          fontFamily: 'var(--font-ui)', fontWeight: 700,
          fontSize: '1.05rem', color: 'var(--accent)',
        }}>
          Java MSA Interviewer
        </span>
      </header>

      {/* ── Centered card ────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div className="glass-panel" style={{ borderRadius: '12px', padding: '40px' }}>

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '10px' }}>
                Recruiter Portal
              </div>
              <h1 style={{
                fontFamily: 'var(--font-ui)', fontWeight: 700,
                fontSize: '1.4rem', color: 'var(--text-primary)',
                letterSpacing: '-0.01em', marginBottom: '8px',
              }}>
                Assessment Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Sign in to review candidate results, scores, and session reports.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'var(--font-code)',
                  fontSize: '11px', letterSpacing: '0.05em',
                  textTransform: 'uppercase', fontWeight: 700,
                  color: 'var(--text-muted)', marginBottom: '6px',
                }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg-highest)',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    color: 'var(--text-primary)', fontSize: '0.9rem',
                    fontFamily: 'var(--font-ui)',
                  }}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'var(--font-code)',
                  fontSize: '11px', letterSpacing: '0.05em',
                  textTransform: 'uppercase', fontWeight: 700,
                  color: 'var(--text-muted)', marginBottom: '6px',
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter recruiter password"
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg-highest)',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    color: 'var(--text-primary)', fontSize: '0.9rem',
                    fontFamily: 'var(--font-ui)',
                  }}
                  disabled={loading}
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
                disabled={loading}
                style={{
                  padding: '11px 24px',
                  background: 'var(--accent)', color: 'var(--on-accent)',
                  border: 'none', borderRadius: '8px',
                  fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = loading ? '0.7' : '1'; }}
              >
                {loading ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
                    </svg>
                    Signing in…
                  </>
                ) : 'Access Dashboard →'}
              </button>
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
