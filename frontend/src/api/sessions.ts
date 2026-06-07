import client from './client'
import type { LoginResponse, Session } from '../types'

export const startSession = async (name: string, email: string): Promise<LoginResponse> => {
  const res = await client.post<LoginResponse>('/api/auth/login', { name, email })
  return res.data
}

export const completeSession = async (sessionId: string): Promise<Session> => {
  const res = await client.post<Session>(`/api/sessions/${sessionId}/complete`)
  return res.data
}

export const getSessionReport = async (sessionId: string): Promise<Session> => {
  const res = await client.get<Session>(`/api/sessions/${sessionId}`)
  return res.data
}

export const recruiterLogin = async (username: string, password: string) => {
  const res = await client.post('/api/auth/recruiter', { username, password })
  return res.data
}

export const getRecruiterSessions = async () => {
  const res = await client.get('/api/recruiter/sessions')
  return res.data
}
