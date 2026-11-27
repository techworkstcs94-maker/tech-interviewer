import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import InviteEntry from './pages/InviteEntry'
import ChallengeArena from './pages/ChallengeArena'
import SessionReport from './pages/SessionReport'
import RecruiterLogin from './pages/RecruiterLogin'
import RecruiterDashboard from './pages/RecruiterDashboard'
import RecruiterSessionDetail from './pages/RecruiterSessionDetail'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  const sessionId = localStorage.getItem('sessionId')
  if (!token || !sessionId) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireCompletedSession({ children }: { children: React.ReactNode }) {
  const sessionId = localStorage.getItem('completedSessionId')
  if (!sessionId) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireRecruiterAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('recruiterToken')
  if (!token) return <Navigate to="/recruiter" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* Candidates enter only via their single-use assessment link */}
        <Route path="/a/:token" element={<InviteEntry />} />
        <Route path="/start" element={<Navigate to="/" replace />} />
        <Route
          path="/challenge"
          element={
            <RequireAuth>
              <ChallengeArena />
            </RequireAuth>
          }
        />
        <Route
          path="/report"
          element={
            <RequireCompletedSession>
              <SessionReport />
            </RequireCompletedSession>
          }
        />
        <Route path="/recruiter" element={<RecruiterLogin />} />
        <Route
          path="/recruiter/dashboard"
          element={
            <RequireRecruiterAuth>
              <RecruiterDashboard />
            </RequireRecruiterAuth>
          }
        />
        <Route
          path="/recruiter/session/:sessionId"
          element={
            <RequireRecruiterAuth>
              <RecruiterSessionDetail />
            </RequireRecruiterAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
