import client from './client'
import recruiterClient from './recruiterClient'
import type { LoginResponse, Session, CheatSeverity, CheatEventType } from '../types'

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

export const reportCheatEvent = async (
  sessionId: string,
  eventType: CheatEventType,
  severity: CheatSeverity,
  detail?: string
): Promise<void> => {
  await client.post(`/api/sessions/${sessionId}/cheat-events`, { eventType, severity, detail })
}

export const recruiterLogin = async (username: string, password: string) => {
  const res = await client.post('/api/auth/recruiter', { username, password })
  return res.data
}

export const getRecruiterSessions = async () => {
  const res = await recruiterClient.get('/api/recruiter/sessions')
  return res.data
}

export const getRecruiterSessionDetail = async (sessionId: string): Promise<Session> => {
  const res = await recruiterClient.get<Session>(`/api/recruiter/sessions/${sessionId}`)
  return res.data
}

export const deleteRecruiterSession = async (sessionId: string): Promise<void> => {
  await recruiterClient.delete(`/api/recruiter/sessions/${sessionId}`)
}
