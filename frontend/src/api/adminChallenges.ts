import recruiterClient from './recruiterClient'

export interface AdminChallenge {
  id: number
  title: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: string
  active: boolean
  deepVerified: boolean
}

export const getAdminChallenges = async (): Promise<AdminChallenge[]> => {
  const res = await recruiterClient.get<AdminChallenge[]>('/api/recruiter/challenges')
  return res.data
}

export const setActiveChallenges = async (activeIds: number[]): Promise<number[]> => {
  const res = await recruiterClient.put<{ activeIds: number[] }>('/api/recruiter/challenges/active', { activeIds })
  return res.data.activeIds
}
