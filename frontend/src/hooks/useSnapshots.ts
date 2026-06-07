import { useCallback } from 'react'

export function useSnapshots(sessionId: string | null) {
  const prefix = sessionId ? `javamsa_code_${sessionId}_` : `javamsa_code_`

  const save = useCallback((challengeId: number, code: string) => {
    try {
      localStorage.setItem(`${prefix}${challengeId}`, code)
    } catch {
      // Ignore storage errors
    }
  }, [prefix])

  const load = useCallback((challengeId: number): string | null => {
    try {
      return localStorage.getItem(`${prefix}${challengeId}`)
    } catch {
      return null
    }
  }, [prefix])

  const clear = useCallback((challengeId: number) => {
    try {
      localStorage.removeItem(`${prefix}${challengeId}`)
    } catch {}
  }, [prefix])

  return { save, load, clear }
}
