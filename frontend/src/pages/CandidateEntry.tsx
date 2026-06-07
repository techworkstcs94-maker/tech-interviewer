import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession } from '../api/sessions'

export default function CandidateEntry() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await startSession(name.trim(), email.trim())
      localStorage.setItem('token', res.token)
      localStorage.setItem('sessionId', res.sessionId)
      localStorage.setItem('candidateName', res.candidateName)
      navigate('/challenge')
    } catch (err) {
      setError('Failed to start session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
            disabled={loading}
            className="w-full bg-[var(--blue)] hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Starting...
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
