import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerReturn {
  elapsed: number
  remaining: number
  isRunning: boolean
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
}

export function useTimer(limitSeconds: number, onExpire?: () => void): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  const start = useCallback(() => {
    setElapsed(0)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => setIsRunning(false), [])
  const resume = useCallback(() => setIsRunning(true), [])
  const reset = useCallback(() => { setIsRunning(false); setElapsed(0) }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= limitSeconds) {
            setIsRunning(false)
            setTimeout(() => onExpireRef.current?.(), 0)
            return e
          }
          return e + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, limitSeconds])

  return {
    elapsed,
    remaining: Math.max(0, limitSeconds - elapsed),
    isRunning,
    start,
    pause,
    resume,
    reset,
  }
}
