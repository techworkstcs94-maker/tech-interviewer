import client from './client'
import recruiterClient from './recruiterClient'
import type { LoginResponse } from '../types'

// ── Candidate side ──────────────────────────────────────────────────────────

export type InviteLinkState = 'VALID' | 'EXPIRED' | 'USED' | 'REVOKED'

export interface InviteInfo {
  title: string
  candidateName: string
  challengeCount: number
  totalTimeSeconds: number
  expiresAt: string
  state: InviteLinkState
}

export const getInviteInfo = async (token: string): Promise<InviteInfo> => {
  const res = await client.get<InviteInfo>(`/api/invites/${encodeURIComponent(token)}`)
  return res.data
}

/** Uses the single-use link: creates the candidate session. */
export const startWithInvite = async (inviteToken: string): Promise<LoginResponse> => {
  const res = await client.post<LoginResponse>('/api/auth/login', { inviteToken })
  return res.data
}

// ── Recruiter side ──────────────────────────────────────────────────────────

export type InviteState =
  | 'PENDING' | 'LINK_EXPIRED' | 'REVOKED'
  | 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'SESSION_DELETED'

export interface RecruiterInvite {
  id: number
  token: string
  title: string
  candidateName: string
  candidateEmail: string
  challenges: { id: number; title: string }[]
  totalTimeSeconds: number
  createdAt: string
  expiresAt: string
  startedAt: string | null
  sessionId: string | null
  state: InviteState
}

export interface CreateInviteRequest {
  title: string
  candidateName: string
  candidateEmail: string
  challengeIds: number[]
  expiresInDays: number
}

export const listInvites = async (): Promise<RecruiterInvite[]> => {
  const res = await recruiterClient.get<RecruiterInvite[]>('/api/recruiter/invites')
  return res.data
}

export const createInvite = async (req: CreateInviteRequest): Promise<{ id: number; token: string }> => {
  const res = await recruiterClient.post<{ id: number; token: string }>('/api/recruiter/invites', req)
  return res.data
}

export const revokeInvite = async (id: number): Promise<void> => {
  await recruiterClient.post(`/api/recruiter/invites/${id}/revoke`)
}

/** The shareable URL — built from the frontend's own origin (Vercel), not the API host. */
export const inviteUrl = (token: string) => `${window.location.origin}/a/${token}`

export const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}
