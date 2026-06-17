import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { getSessionReport } from '../api/sessions'
import type { Session, Submission } from '../types'

export default function SessionReport() {
  const navigate = useNavigate()
  const sessionId = localStorage.getItem('sessionId')
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!sessionId) { navigate('/'); return }
    getSessionReport(sessionId)
      .then(setSession)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [sessionId, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!session) return null

  const unifiedScore = (sub: typeof session.submissions[0]) =>
    sub.deepScore ?? sub.instantScore ?? 0

  const radarData = [1, 2, 3, 4, 5, 6].map(id => {
    const sub = session.submissions.find(s => s.challengeId === id)
    return {
      subject: `C${id}`,
      score: sub ? unifiedScore(sub) : 0,
    }
  })

  const avgScore = session.submissions.length > 0
    ? Math.round(session.submissions.reduce((s, sub) => s + unifiedScore(sub), 0) / session.submissions.length)
    : 0

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="orbitron text-3xl font-bold text-white">Assessment Report</h1>
            <p className="text-[var(--muted)] text-sm mt-1">{session.candidateName} · {session.candidateEmail}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Home
          </button>
        </div>

        {/* Score summary */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Challenges Attempted', value: session.submissions.length, color: 'var(--blue)' },
            { label: 'Average Score', value: `${avgScore}/100`, color: 'var(--green)' },
          ].map(item => (
            <div key={item.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-center">
              <div className="orbitron text-3xl font-black" style={{ color: item.color }}>{item.value}</div>
              <div className="text-xs text-[var(--muted)] mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Radar chart */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Score Radar</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 12, fontFamily: 'JetBrains Mono' }} />
              <Radar name="Score" dataKey="score" stroke="var(--green)" fill="var(--green)" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-challenge breakdown */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Challenge Breakdown</h2>
          {session.submissions.map((sub) => (
            <div key={sub.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--elevated)] transition-colors"
                onClick={() => setExpanded(prev => {
                  const next = new Set(prev)
                  next.has(sub.id) ? next.delete(sub.id) : next.add(sub.id)
                  return next
                })}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)]">Challenge {sub.challengeId}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: unifiedScore(sub) >= 80 ? 'var(--green)' : unifiedScore(sub) >= 50 ? 'var(--amber)' : 'var(--red)' }}
                    >
                      {unifiedScore(sub)}/100
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      {sub.deepScore != null ? 'JUnit' : 'AST'}
                    </span>
                    {sub.elapsedSeconds && (
                      <span className="text-xs text-[var(--muted)]">
                        {Math.floor(sub.elapsedSeconds / 60)}m {sub.elapsedSeconds % 60}s
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[var(--muted)] text-sm">{expanded.has(sub.id) ? '▾' : '▸'}</span>
              </div>
              {expanded.has(sub.id) && sub.code && (
                <div className="border-t border-[var(--border)] p-4">
                  <pre className="text-[11px] text-[var(--muted)] font-mono overflow-x-auto whitespace-pre-wrap bg-[var(--bg)] rounded p-3 max-h-60">
                    {sub.code}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
