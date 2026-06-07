import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recruiterLogin } from '../api/sessions'

export default function RecruiterLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await recruiterLogin(username, password)
      localStorage.setItem('recruiterToken', res.token)
      localStorage.setItem('token', res.token)
      navigate('/recruiter/dashboard')
    } catch {
      setError('Invalid credentials. Try admin / admin123')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎯</div>
          <h1 className="orbitron text-2xl font-bold text-white">Recruiter Portal</h1>
          <p className="text-[var(--muted)] text-sm mt-1">Sign in to view candidate sessions</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="admin123"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              disabled={loading}
            />
          </div>

          {error && <p className="text-[var(--red)] text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--amber)] hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Back to home
          </button>
        </form>
      </div>
    </div>
  )
}
