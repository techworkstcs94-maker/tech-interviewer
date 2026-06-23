import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getRecruiterSessions, deleteRecruiterSession } from '../api/sessions'
import { cheatRiskLabel, cheatRiskColor, cheatRiskBg } from '../lib/cheatConstants'
import type { SessionSummary } from '../types'

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<keyof SessionSummary>('startTime')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const token = localStorage.getItem('recruiterToken')
    if (!token) { navigate('/recruiter'); return }
    load()
  }, [navigate])

  const load = () => {
    setLoading(true)
    setError('')
    getRecruiterSessions()
      .then(setSessions)
      .catch((err) => {
        // 401/403 handled by recruiterClient interceptor (redirects to login) — don't show error
        if (!err?._isAuthRedirect) {
          setError('Failed to load sessions. The server may be starting up — please try refreshing in a moment.')
        }
      })
      .finally(() => setLoading(false))
  }

  const handleLogout = () => {
    localStorage.removeItem('recruiterToken')
    navigate('/recruiter')
  }

  const handleOpenReport = () => {
    const token = localStorage.getItem('recruiterToken')
    const base = import.meta.env.VITE_API_URL || ''
    window.open(`${base}/api/recruiter/report-html?token=${encodeURIComponent(token ?? '')}`, '_blank')
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Status', 'Started', 'Submissions', 'Instant Score', 'Deep Score', 'Cheat Score']
    const rows = sessions.map(s => [
      s.candidateName,
      s.candidateEmail,
      s.status,
      s.startTime ? new Date(s.startTime).toLocaleString() : '',
      s.submissionCount,
      Math.round(s.avgInstantScore),
      Math.round(s.avgDeepScore),
      s.cheatScore,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `javamsa-sessions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const handleDelete = async (sessionId: string, name: string) => {
    if (!confirm(`Delete session for ${name}? This cannot be undone.`)) return
    setError('')
    setDeletingId(sessionId)
    try {
      await deleteRecruiterSession(sessionId)
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId))
    } catch (err: unknown) {
      if (!(err as { _isAuthRedirect?: boolean })?._isAuthRedirect) {
        setError('Failed to delete session.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const toggleSort = (key: keyof SessionSummary) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...sessions].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const chartData = sessions.slice(0, 10).map(s => ({
    name: s.candidateName.split(' ')[0],
    instant: Math.round(s.avgInstantScore),
    deep: Math.round(s.avgDeepScore),
    cheat: s.cheatScore,
  }))

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.avgDeepScore || s.avgInstantScore || 0), 0) / sessions.length)
    : 0

  const completed = sessions.filter(s => s.status === 'COMPLETED').length
  const inProgress = sessions.filter(s => s.status !== 'COMPLETED').length
  const flagged = sessions.filter(s => s.cheatScore >= 20).length

  const stats = [
    { val: sessions.length, label: 'Total Sessions', sub: 'All submissions',  color: 'var(--accent)' },
    { val: completed,       label: 'Completed',      sub: 'Finished',         color: 'var(--success)' },
    { val: inProgress,      label: 'In Progress',    sub: 'Active',           color: 'var(--warning)' },
    { val: flagged,         label: 'Flagged',        sub: 'Integrity risk',   color: 'var(--danger)' },
  ]

  const SortTh = ({ label, k }: { label: string; k: keyof SessionSummary }) => (
    <th
      onClick={() => toggleSort(k)}
      style={{
        padding: '12px 16px', textAlign: 'left',
        fontFamily: 'var(--font-code)', fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        color: sortKey === k ? 'var(--accent)' : 'var(--text-muted)',
        cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  )

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {sessions.length > 0 && (
              <span style={{
                background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.25)',
                borderRadius: '6px', padding: '4px 12px',
                fontSize: '0.8rem', color: 'var(--success)', fontFamily: 'var(--font-code)',
              }}>
                avg {avgScore}%
              </span>
            )}
            {sessions.length > 0 && (
              <button
                onClick={handleOpenReport}
                style={{
                  background: 'var(--accent-muted)', border: '1px solid rgba(164,230,255,0.3)',
                  borderRadius: '8px', color: 'var(--accent)',
                  padding: '6px 16px', cursor: 'pointer',
                  fontSize: '0.85rem', fontFamily: 'var(--font-ui)', fontWeight: 600,
                }}
              >
                ↓ Solutions PDF
              </button>
            )}
            {sessions.length > 0 && (
              <button
                onClick={handleExportCSV}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text-secondary)',
                  padding: '6px 16px', cursor: 'pointer',
                  fontSize: '0.85rem', fontFamily: 'var(--font-ui)',
                }}
              >
                ↓ Export CSV
              </button>
            )}
            <button
              onClick={load}
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
          <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Assessment Dashboard
          </h1>
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
            <p style={{ fontSize: '1rem' }}>No candidate sessions yet.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Share the assessment link to get started.</p>
          </div>
        ) : (
          <>
            {/* ── Stats ──────────────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {stats.map(({ val, label, sub, color }) => (
                <div key={label} style={{
                  background: 'var(--bg-raised)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '24px', transition: 'border-color 0.2s', cursor: 'default',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div className="label-caps" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>{sub}</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color, marginBottom: '4px' }}>{val}</div>
                  <div className="label-caps" style={{ color: 'var(--text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* ── Chart ──────────────────────────────────────────────────────── */}
            <div style={{
              background: 'var(--bg-raised)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '24px', marginBottom: '28px',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>Score Comparison</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'var(--font-ui)' }}>Top 10 candidates — instant vs deep score</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-code)' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-code)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-ui)' }} />
                  <Bar dataKey="instant" name="Instant Score" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deep" name="Deep Score" fill="var(--success)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Candidates table ────────────────────────────────────────────── */}
            <section style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>All Candidates</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'var(--font-ui)' }}>
                    Click Review to view full session with cheat timeline
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-code)', fontSize: '0.8rem', color: 'var(--text-muted)',
                }}>
                  {sorted.length} session{sorted.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <SortTh label="Candidate" k="candidateName" />
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-code)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Email</th>
                      <SortTh label="Started" k="startTime" />
                      <SortTh label="Status" k="status" />
                      <SortTh label="Submissions" k="submissionCount" />
                      <SortTh label="Instant" k="avgInstantScore" />
                      <SortTh label="Deep" k="avgDeepScore" />
                      <SortTh label="Cheat Risk" k="cheatScore" />
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-code)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(s => {
                      const risk = cheatRiskLabel(s.cheatScore)
                      const riskColor = cheatRiskColor(risk)
                      const riskBg = cheatRiskBg(risk)
                      return (
                        <tr
                          key={s.sessionId}
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-overlay)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
                            {s.candidateName}
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem' }}>
                            {s.candidateEmail}
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-code)' }}>
                            {s.startTime ? new Date(s.startTime).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
                              textTransform: 'uppercase', padding: '3px 10px', borderRadius: '20px',
                              fontFamily: 'var(--font-code)',
                              background: s.status === 'COMPLETED' ? 'rgba(78,222,163,0.1)' : 'rgba(164,230,255,0.1)',
                              color: s.status === 'COMPLETED' ? 'var(--success)' : 'var(--accent)',
                              border: `1px solid ${s.status === 'COMPLETED' ? 'rgba(78,222,163,0.25)' : 'rgba(164,230,255,0.25)'}`,
                            }}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
                            {s.submissionCount}
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--accent)', fontWeight: 800, fontFamily: 'var(--font-ui)', fontSize: '1rem' }}>
                            {Math.round(s.avgInstantScore)}
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--success)', fontWeight: 800, fontFamily: 'var(--font-ui)', fontSize: '1rem' }}>
                            {Math.round(s.avgDeepScore)}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '3px 10px',
                              borderRadius: '20px', fontFamily: 'var(--font-code)',
                              letterSpacing: '0.05em', textTransform: 'uppercase',
                              background: riskBg, color: riskColor,
                              border: `1px solid ${riskColor}44`,
                            }}>
                              {risk === 'clean' ? '✓' : risk === 'suspicious' ? '!' : '⚠'} {s.cheatScore}pts
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => navigate(`/recruiter/session/${s.sessionId}`)}
                                style={{
                                  background: 'var(--accent-muted)', border: '1px solid rgba(164,230,255,0.3)',
                                  borderRadius: '6px', color: 'var(--accent)',
                                  padding: '5px 12px', cursor: 'pointer',
                                  fontSize: '0.8rem', fontFamily: 'var(--font-ui)', fontWeight: 600,
                                }}
                              >
                                Review
                              </button>
                              <button
                                disabled={deletingId === s.sessionId}
                                onClick={() => handleDelete(s.sessionId, s.candidateName)}
                                style={{
                                  background: 'var(--danger-muted)', border: '1px solid rgba(255,180,171,0.3)',
                                  borderRadius: '6px', color: 'var(--danger)',
                                  padding: '5px 12px', cursor: deletingId === s.sessionId ? 'not-allowed' : 'pointer',
                                  fontSize: '0.8rem', fontFamily: 'var(--font-ui)',
                                  opacity: deletingId === s.sessionId ? 0.6 : 1,
                                }}
                              >
                                {deletingId === s.sessionId ? '…' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
