import client from './client'
import type { Challenge } from '../types'

export const getChallenges = async (): Promise<Challenge[]> => {
  const res = await client.get<Challenge[]>('/api/challenges')
  return res.data
}

export const getChallenge = async (id: number): Promise<Challenge> => {
  const res = await client.get<Challenge>(`/api/challenges/${id}`)
  return res.data
}
