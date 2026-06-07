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

  const chartData = sessions.map(s => ({
    name: s.candidateName.split(' ')[0],
    instant: Math.round(s.avgInstantScore),
    deep: Math.round(s.avgDeepScore),
  }))

  const handleLogout = () => {
    localStorage.removeItem('recruiterToken')
    navigate('/recruiter')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="orbitron text-3xl font-bold text-white">Recruiter Dashboard</h1>
            <p className="text-[var(--muted)] text-sm mt-1">{sessions.length} candidate sessions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setLoading(true); getRecruiterSessions().then(setSessions).finally(() => setLoading(false)) }}
              className="px-3 py-1.5 text-xs bg-[var(--elevated)] text-[var(--text)] rounded border border-[var(--border)] hover:border-[var(--blue)] transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-[var(--red)] text-center py-10">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-[var(--muted)]">
            <div className="text-4xl mb-4">📭</div>
            <p>No candidate sessions yet.</p>
            <p className="text-sm mt-1">Share the assessment link to get started.</p>
          </div>
        ) : (
          <>
            {/* Bar chart */}
            {sessions.length > 0 && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
                <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Score Comparison</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="instant" name="Instant Score" fill="var(--blue)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="deep" name="Deep Score" fill="var(--green)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sessions table */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      {['Candidate', 'Email', 'Started', 'Status', 'Submissions', 'Instant', 'Deep'].map(h => (
                        <th key={h} className="px-4 py-3 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr
                        key={s.sessionId}
                        className="border-b border-[var(--border)] hover:bg-[var(--elevated)] cursor-pointer transition-colors"
                        onClick={() => navigate(`/recruiter/session/${s.sessionId}`)}
                      >
                        <td className="px-4 py-3 font-medium text-white">{s.candidateName}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{s.candidateEmail}</td>
                        <td className="px-4 py-3 text-[var(--muted)] text-xs">
                          {s.startTime ? new Date(s.startTime).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            s.status === 'COMPLETED' ? 'bg-green-900/40 text-[var(--green)]' : 'bg-blue-900/40 text-[var(--blue)]'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{s.submissionCount}</td>
                        <td className="px-4 py-3 text-[var(--blue)] font-bold orbitron">{Math.round(s.avgInstantScore)}</td>
                        <td className="px-4 py-3 text-[var(--green)] font-bold orbitron">{Math.round(s.avgDeepScore)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
