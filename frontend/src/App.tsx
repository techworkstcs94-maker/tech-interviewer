import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import CandidateEntry from './pages/CandidateEntry'
import ChallengeArena from './pages/ChallengeArena'
import SessionReport from './pages/SessionReport'
import RecruiterLogin from './pages/RecruiterLogin'
import RecruiterDashboard from './pages/RecruiterDashboard'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  const sessionId = localStorage.getItem('sessionId')
  if (!token || !sessionId) return <Navigate to="/start" replace />
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
        <Route path="/start" element={<CandidateEntry />} />
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
            <RequireAuth>
              <SessionReport />
            </RequireAuth>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
