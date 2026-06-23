import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getRecruiterSessions } from '../api/sessions'

interface SessionSummary {
  sessionId: string
  candidateName: string
  candidateEmail: string
  startTime: string
  endTime: string
  status: string
  submissionCount: number
  avgInstantScore: number
  avgDeepScore: number
}

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('recruiterToken')
    if (!token) { navigate('/recruiter'); return }
    getRecruiterSessions()
      .then(setSessions)
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('recruiterToken')
    navigate('/recruiter')
  }

  const handleRefresh = () => {
    setLoading(true)
    getRecruiterSessions().then(setSessions).catch(() => setError('Failed to load sessions')).finally(() => setLoading(false))
  }

  const chartData = sessions.map(s => ({
    name: s.candidateName.split(' ')[0],
    instant: Math.round(s.avgInstantScore),
    deep: Math.round(s.avgDeepScore),
  }))

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + ((s.avgDeepScore || s.avgInstantScore) || 0), 0) / sessions.length)
    : 0

  const completed = sessions.filter(s => s.status === 'COMPLETED').length
  const inProgress = sessions.filter(s => s.status !== 'COMPLETED').length

  const stats = [
    { val: sessions.length, label: 'Total Sessions', sub: 'All submissions', color: 'var(--accent)' },
    { val: completed,       label: 'Completed',      sub: 'Finished',        color: 'var(--success)' },
    { val: inProgress,      label: 'In Progress',    sub: 'Active',          color: 'var(--warning)' },
    { val: `${avgScore}%`,  label: 'Avg Score',      sub: 'Deep score',      color: 'var(--accent-dim)' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky Navbar ────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '64px', background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 32px',
      }}>
        <div style={{
          maxWidth: '1440px', width: '100%', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 32, height: 32, flexShrink: 0,
                background: 'var(--accent)', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.8rem', color: 'var(--on-accent)',
                fontFamily: 'var(--font-ui)',
              }}>JM</div>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent)', fontFamily: 'var(--font-ui)' }}>
                Java MSA Interviewer
              </span>
            </div>
            <span style={{
              color: 'var(--accent)', fontWeight: 700, fontSize: '0.875rem',
              borderBottom: '2px solid var(--accent)', paddingBottom: '2px',
              fontFamily: 'var(--font-ui)',
            }}>
              Dashboard
            </span>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {sessions.length > 0 && (
              <span style={{
                background: 'rgba(78,222,163,0.1)',
                border: '1px solid rgba(78,222,163,0.25)',
                borderRadius: '6px', padding: '4px 12px',
                fontSize: '0.8rem', color: 'var(--success)',
                fontFamily: 'var(--font-code)',
              }}>
                avg {avgScore}%
              </span>
            )}
            <button
              onClick={handleRefresh}
              style={{
                background: 'var(--accent-muted)', border: '1px solid rgba(164,230,255,0.3)',
                borderRadius: '8px', color: 'var(--accent)',
                padding: '6px 16px', cursor: 'pointer',
                fontSize: '0.85rem', fontFamily: 'var(--font-ui)', fontWeight: 600,
              }}
            >
              ↻ Refresh
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-secondary)',
                padding: '6px 16px', cursor: 'pointer',
                fontSize: '0.85rem', fontFamily: 'var(--font-ui)',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: '28px' }}>
          <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '6px' }}>Recruiter Portal</div>
          <h1 style={{
            fontFamily: 'var(--font-ui)', fontWeight: 800,
            fontSize: '1.75rem', letterSpacing: '-0.02em', color: 'var(--text-primary)',
          }}>Assessment Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            {sessions.length} candidate session{sessions.length !== 1 ? 's' : ''} registered
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-muted)', border: '1px solid rgba(255,180,171,0.3)',
            borderRadius: '8px', padding: '12px 16px',
            color: 'var(--danger)', marginBottom: '24px', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <svg style={{ animation: 'spin 1s linear infinite' }} width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="3" opacity="0.25" />
              <path fill="var(--accent)" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
            </svg>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '1rem', fontFamily: 'var(--font-ui)' }}>No candidate sessions yet.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Share the assessment link to get started.</p>
          </div>
        ) : (
          <>
            {/* ── Stats cards ──────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {stats.map(({ val, label, sub, color }) => (
                <div key={label} style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '24px',
                  transition: 'border-color 0.2s', cursor: 'default',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div className="label-caps" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>{sub}</div>
                  <div style={{
                    fontFamily: 'var(--font-ui)', fontSize: '2.25rem', fontWeight: 800,
                    letterSpacing: '-0.02em', color, marginBottom: '4px',
                  }}>{val}</div>
                  <div className="label-caps" style={{ color: 'var(--text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* ── Score chart ───────────────────────────────────────────────── */}
            <div style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: '12px', padding: '24px',
              marginBottom: '28px',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Score Comparison</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>Instant vs deep analysis scores per candidate</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-code)' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-code)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8, fontSize: 12,
                      fontFamily: 'var(--font-ui)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-ui)' }} />
                  <Bar dataKey="instant" name="Instant Score" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deep" name="Deep Score" fill="var(--success)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Candidates table ──────────────────────────────────────────── */}
            <section style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>All Candidates</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'var(--font-ui)' }}>
                    Click a row to view the full session report
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Candidate', 'Email', 'Started', 'Status', 'Submissions', 'Instant', 'Deep'].map(h => (
                        <th key={h} style={{
                          padding: '12px 24px',
                          textAlign: 'left',
                          fontFamily: 'var(--font-code)',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr
                        key={s.sessionId}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-overlay)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => navigate(`/recruiter/session/${s.sessionId}`)}
                      >
                        <td style={{ padding: '14px 24px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
                          {s.candidateName}
                        </td>
                        <td style={{ padding: '14px 24px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                          {s.candidateEmail}
                        </td>
                        <td style={{ padding: '14px 24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-code)' }}>
                          {s.startTime ? new Date(s.startTime).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '14px 24px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontFamily: 'var(--font-code)',
                            background: s.status === 'COMPLETED' ? 'rgba(78,222,163,0.1)' : 'rgba(164,230,255,0.1)',
                            color: s.status === 'COMPLETED' ? 'var(--success)' : 'var(--accent)',
                            border: `1px solid ${s.status === 'COMPLETED' ? 'rgba(78,222,163,0.25)' : 'rgba(164,230,255,0.25)'}`,
                          }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
                          {s.submissionCount}
                        </td>
                        <td style={{ padding: '14px 24px', color: 'var(--accent)', fontWeight: 800, fontFamily: 'var(--font-ui)', fontSize: '1rem' }}>
                          {Math.round(s.avgInstantScore)}
                        </td>
                        <td style={{ padding: '14px 24px', color: 'var(--success)', fontWeight: 800, fontFamily: 'var(--font-ui)', fontSize: '1rem' }}>
                          {Math.round(s.avgDeepScore)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
