import { useState, useEffect, useRef } from 'react'

interface UseAssessmentTimerReturn {
  /** Whole seconds left, or null while the deadline is not known yet. */
  remaining: number | null
  expired: boolean
}

/**
 * Assessment-level countdown to an absolute deadline (epoch ms in the browser's clock).
 *
 * Derived from the deadline on every tick rather than incrementing a counter, so it doesn't drift,
 * isn't affected by challenge switches, and picks up where it left off after a page refresh (the
 * deadline is re-fetched from the server). `onExpire` fires exactly once per deadline — immediately
 * if the deadline has already passed when it becomes known.
 */
export function useAssessmentTimer(deadlineMs: number | null, onExpire?: () => void): UseAssessmentTimerReturn {
  const [now, setNow] = useState(() => Date.now())
  const onExpireRef = useRef(onExpire)
  const firedRef = useRef(false)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  useEffect(() => {
    if (deadlineMs === null) return
    firedRef.current = false
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (t >= deadlineMs && !firedRef.current) {
        firedRef.current = true
        onExpireRef.current?.()
      }
    }
    tick()
    // 500ms so the displayed second never lags by almost a full second
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [deadlineMs])

  const remaining = deadlineMs === null ? null : Math.max(0, Math.ceil((deadlineMs - now) / 1000))
  return { remaining, expired: remaining === 0 }
}
