import client from './client'
import type { Submission } from '../types'

export interface SubmitPayload {
  challengeId: number
  code: string
  elapsedSeconds: number
}

export interface SubmitResponse {
  submissionId: number
  instantResults: unknown[]
  instantScore: number
  qualityScore: number
  status: string
}

export const submitCode = async (payload: SubmitPayload): Promise<SubmitResponse> => {
  const res = await client.post<SubmitResponse>('/api/submissions', payload)
  return res.data
}

export const getSession = async (sessionId: string) => {
  const res = await client.get(`/api/sessions/${sessionId}`)
  return res.data
}
