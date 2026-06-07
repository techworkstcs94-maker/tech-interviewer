import { useCallback } from 'react'

const PREFIX = 'javamsa_code_'

export function useSnapshots() {
  const save = useCallback((challengeId: number, code: string) => {
    try {
      localStorage.setItem(`${PREFIX}${challengeId}`, code)
    } catch {
      // Ignore storage errors
    }
  }, [])

  const load = useCallback((challengeId: number): string | null => {
    try {
      return localStorage.getItem(`${PREFIX}${challengeId}`)
    } catch {
      return null
    }
  }, [])

  const clear = useCallback((challengeId: number) => {
    try {
      localStorage.removeItem(`${PREFIX}${challengeId}`)
    } catch {}
  }, [])

  return { save, load, clear }
}
