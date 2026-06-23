import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRecruiterSessionDetail } from '../api/sessions'
import { cheatRiskLabel, cheatRiskColor, cheatRiskBg, SEVERITY_POINTS } from '../lib/cheatConstants'
import type { Session, CheatEvent } from '../types'

const SEVERITY_COLOR: Record<string, string> = {
  low: 'var(--text-muted)',
  medium: 'var(--warning)',
  high: 'var(--danger)',
  critical: '#ff4040',
}

const SEVERITY_BG: Record<string, string> = {
  low: 'rgba(255,255,255,0.05)',
  medium: 'rgba(255,213,156,0.08)',
  high: 'rgba(255,180,171,0.1)',
  critical: 'rgba(255,64,64,0.12)',
}

// Jackson without write-dates-as-timestamps=false serialises LocalDateTime as
// [year, month, day, hour, minute, second, nano]. Handle both forms.
function toDate(val: unknown): Date | null {
  if (!val) return null
  if (Array.isArray(val)) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = val as number[]
    return new Date(y, mo - 1, d, h, mi, s)
  }
  const dt = new Date(val as string)
  return isNaN(dt.getTime()) ? null : dt
}

function fmtTime(val: unknown): string {
  const dt = toDate(val)
  if (!dt) return String(val ?? '—')
  return dt.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function fmtDuration(startVal: unknown, endVal?: unknown): string {
  const start = toDate(startVal)
  const end   = toDate(endVal)
  if (!start || !end) return '—'
  const ms = end.getTime() - start.getTime()
  if (ms < 0) return '—'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

function eventLabel(type: string) {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function RecruiterSessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSubs, setOpenSubs] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const token = localStorage.getItem('recruiterToken')
    if (!token) { navigate('/recruiter'); return }
    if (!sessionId) { navigate('/recruiter/dashboard'); return }

    getRecruiterSessionDetail(sessionId)
      .then(setSession)
      .catch(() => navigate('/recruiter/dashboard'))
      .finally(() => setLoading(false))
  }, [sessionId, navigate])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg style={{ animation: 'spin 1s linear infinite' }} width="36" height="36" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="3" opacity="0.25" />
        <path fill="var(--accent)" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
      </svg>
    </div>
  )

  if (!session) return null

  const cheatEvents = session.cheatEvents ?? []
  const cheatScore = session.cheatScore ?? cheatEvents.reduce((sum, e) => sum + SEVERITY_POINTS[e.severity], 0)
  const risk = cheatRiskLabel(cheatScore)
  const riskColor = cheatRiskColor(risk)
  const riskBg = cheatRiskBg(risk)

  const avgInstant = session.averageInstantScore ?? 0
  const avgDeep = session.averageDeepScore ?? 0
  const displayScore = Math.round(avgDeep > 0 ? avgDeep : avgInstant)

  const duration = fmtDuration(session.startTime, session.endTime)

  const btnHover = (el: HTMLButtonElement, enter: boolean) => {
    el.style.borderColor = enter ? 'var(--accent)' : 'var(--border)'
    el.style.color = enter ? 'var(--accent)' : 'var(--text-secondary)'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '64px', background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 32px',
      }}>
        <div style={{
          maxWidth: '1200px', width: '100%', margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button
            onClick={() => navigate('/recruiter/dashboard')}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-secondary)',
              padding: '6px 14px', cursor: 'pointer',
              fontSize: '0.85rem', fontFamily: 'var(--font-ui)',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => btnHover(e.currentTarget as HTMLButtonElement, true)}
            onMouseLeave={e => btnHover(e.currentTarget as HTMLButtonElement, false)}
          >
            ← Dashboard
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-ui)' }}>
            / Session Detail
          </span>
          <span style={{
            color: 'var(--text-primary)', fontWeight: 600,
            fontSize: '0.9rem', fontFamily: 'var(--font-ui)',
          }}>
            {session.candidateName}
          </span>

          {/* Cheat badge in header */}
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.75rem', fontWeight: 700,
            padding: '4px 12px', borderRadius: '20px',
            fontFamily: 'var(--font-code)', letterSpacing: '0.05em', textTransform: 'uppercase',
            background: riskBg, color: riskColor,
            border: `1px solid ${riskColor}44`,
          }}>
            {risk === 'clean' ? '✓' : risk === 'suspicious' ? '!' : '⚠'} {cheatScore} risk pts
          </span>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Score card ──────────────────────────────────────────────── */}
          <section style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: '12px', overflow: 'hidden',
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '6px' }}>Candidate</div>
              <h2 style={{
                fontFamily: 'var(--font-ui)', fontWeight: 800,
                fontSize: '1.5rem', letterSpacing: '-0.02em',
                color: 'var(--text-primary)', marginBottom: '4px',
              }}>
                {session.candidateName}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
                {session.candidateEmail}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0',
            }}>
              {[
                { label: 'Status', value: session.status, color: session.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)' },
                { label: 'Duration', value: duration, color: 'var(--text-primary)' },
                { label: 'Avg Instant', value: `${Math.round(avgInstant)}%`, color: 'var(--accent)' },
                { label: 'Avg Deep', value: `${Math.round(avgDeep)}%`, color: 'var(--success)' },
                { label: 'Submissions', value: String(session.submissions.length), color: 'var(--text-primary)' },
                { label: 'Cheat Score', value: `${cheatScore} pts`, color: riskColor },
              ].map(({ label, value, color }, i) => (
                <div key={label} style={{
                  padding: '20px 24px',
                  borderRight: i < 5 ? '1px solid var(--border)' : 'none',
                }}>
                  <div className="label-caps" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</div>
                  <div style={{
                    fontFamily: 'var(--font-ui)', fontWeight: 800,
                    fontSize: '1.25rem', color,
                    letterSpacing: '-0.01em',
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Cheat risk banner for flagged sessions */}
            {risk === 'flagged' && (
              <div style={{
                borderTop: '1px solid rgba(255,180,171,0.3)',
                background: 'rgba(255,180,171,0.06)',
                padding: '12px 24px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                  This session has been flagged for integrity violations. Review the cheat timeline below.
                </span>
              </div>
            )}
          </section>

          {/* ── Submissions accordion ────────────────────────────────────── */}
          <section style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: '12px', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
                Challenge Solutions
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'var(--font-ui)' }}>
                {session.submissions.length} submission{session.submissions.length !== 1 ? 's' : ''} — click to expand code
              </p>
            </div>

            {session.submissions.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No submissions recorded for this session.
              </div>
            ) : (
              session.submissions.map(sub => {
                const score = sub.deepScore ?? sub.instantScore ?? 0
                const scoreColor = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
                const isOpen = openSubs[sub.id] ?? false
                const method = sub.deepScore != null ? 'JUnit' : 'AST'

                return (
                  <div key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setOpenSubs(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                      style={{
                        width: '100%',
                        background: isOpen ? 'var(--bg-overlay)' : 'none',
                        border: 'none', padding: '16px 24px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', fontFamily: 'var(--font-ui)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)' }}
                      onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{
                          width: 36, height: 36, flexShrink: 0,
                          background: `${scoreColor}1A`,
                          border: `1px solid ${scoreColor}40`,
                          borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700, color: scoreColor,
                          fontFamily: 'var(--font-code)',
                        }}>{score}%</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            Challenge {sub.challengeId}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '10px', fontFamily: 'var(--font-code)',
                              color: 'var(--text-muted)', letterSpacing: '0.04em',
                            }}>
                              {method}
                            </span>
                            {sub.elapsedSeconds && (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                                {Math.floor(sub.elapsedSeconds / 60)}m {sub.elapsedSeconds % 60}s
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-code)', fontSize: '0.875rem',
                          color: scoreColor, fontWeight: 700,
                        }}>
                          {score}/100
                        </span>
                        <span style={{
                          color: 'var(--text-muted)', fontSize: '0.75rem',
                          transition: 'transform 0.15s', display: 'inline-block',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}>▾</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                        {sub.code ? (
                          <pre style={{
                            margin: 0,
                            padding: '20px 24px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-code)',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '400px',
                            overflowY: 'auto',
                          }}>
                            {sub.code}
                          </pre>
                        ) : (
                          <div style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
                            No code saved for this submission.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </section>

          {/* ── Anti-cheat timeline ──────────────────────────────────────── */}
          <section style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: '12px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
                  Anti-Cheat Timeline
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'var(--font-ui)' }}>
                  {cheatEvents.length} event{cheatEvents.length !== 1 ? 's' : ''} detected
                </p>
              </div>
              <div style={{
                background: riskBg,
                border: `1px solid ${riskColor}44`,
                borderRadius: '8px', padding: '6px 14px',
                fontSize: '0.85rem', fontWeight: 600,
                color: riskColor, fontFamily: 'var(--font-ui)',
              }}>
                {risk === 'clean' ? '✓' : risk === 'suspicious' ? '!' : '⚠'} {cheatScore} risk pts
              </div>
            </div>

            <div style={{ padding: '16px 24px' }}>
              {cheatEvents.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '32px 0',
                  color: 'var(--success)', fontFamily: 'var(--font-ui)',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✓</div>
                  <p style={{ fontSize: '0.9rem' }}>No suspicious activity detected.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {cheatEvents.map((e, i) => (
                    <div
                      key={e.id ?? i}
                      style={{
                        display: 'flex', gap: '12px', alignItems: 'flex-start',
                        padding: '10px 14px', borderRadius: '8px',
                        background: SEVERITY_BG[e.severity] ?? 'transparent',
                        border: `1px solid ${SEVERITY_COLOR[e.severity] ?? 'var(--border)'}22`,
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Severity dot */}
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: '5px',
                        background: SEVERITY_COLOR[e.severity] ?? 'var(--text-muted)',
                        boxShadow: e.severity === 'critical' ? `0 0 6px ${SEVERITY_COLOR[e.severity]}` : 'none',
                      }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.8rem', fontWeight: 600,
                            color: SEVERITY_COLOR[e.severity] ?? 'var(--text-primary)',
                            fontFamily: 'var(--font-ui)',
                          }}>
                            {eventLabel(e.eventType)}
                          </span>
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                            padding: '1px 6px', borderRadius: '10px',
                            fontFamily: 'var(--font-code)',
                            background: `${SEVERITY_COLOR[e.severity]}1A`,
                            color: SEVERITY_COLOR[e.severity] ?? 'var(--text-muted)',
                          }}>
                            {e.severity} +{SEVERITY_POINTS[e.severity]}pts
                          </span>
                        </div>
                        {e.detail && (
                          <p style={{
                            margin: '3px 0 0',
                            fontSize: '0.78rem', color: 'var(--text-muted)',
                            fontFamily: 'var(--font-ui)', lineHeight: 1.4,
                          }}>
                            {e.detail}
                          </p>
                        )}
                      </div>

                      <span style={{
                        fontSize: '0.75rem', color: 'var(--text-muted)',
                        fontFamily: 'var(--font-code)', flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}>
                        {fmtTime(e.occurredAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
