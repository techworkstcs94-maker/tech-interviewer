import recruiterClient from './recruiterClient'

export interface AdminChallenge {
  id: number
  title: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: string
  timeLimitSeconds: number
  deepVerified: boolean
}

/** Full challenge catalogue for the "Create Assessment Link" picker. */
export const getAdminChallenges = async (): Promise<AdminChallenge[]> => {
  const res = await recruiterClient.get<AdminChallenge[]>('/api/recruiter/challenges')
  return res.data
}
