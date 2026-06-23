import type { CheatEventType, CheatSeverity } from '../types'
import { SEVERITY_POINTS } from './cheatConstants'

interface AntiCheatConfig {
  sessionId: string
  onEvent: (type: CheatEventType, severity: CheatSeverity, detail?: string) => void
  onWarning: (message: string) => void
  onSessionFlag: () => void
}

// Minimum ms between two firings of the same event type
const EVENT_COOLDOWN_MS: Partial<Record<CheatEventType, number>> = {
  TAB_SWITCH:          8_000,
  WINDOW_BLUR:         5_000,
  WINDOW_BLUR_EXTENDED:60_000,
  COPY_DETECTED:       15_000,
  PASTE_DETECTED:      10_000,
  RIGHT_CLICK:         5_000,
  FULLSCREEN_EXIT:     10_000,
  DEVTOOLS_OPENED:     0,         // handled via one-shot flag
  RAPID_TYPING:        20_000,
  SCREENSHOT_ATTEMPT:  10_000,
  IDLE_TOO_LONG:       10 * 60_000,
  MULTIPLE_SUBMISSIONS:0,
  SESSION_FLAGGED:     0,
}

export class AntiCheatMonitor {
  private config: AntiCheatConfig
  private events: { type: CheatEventType; severity: CheatSeverity }[] = []
  private lastEventTime: Map<CheatEventType, number> = new Map()

  private blurTimer: ReturnType<typeof setTimeout> | null = null
  private devToolsInterval: ReturnType<typeof setInterval> | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private typingBuffer: number[] = []
  private cleanupFns: (() => void)[] = []

  private flagged = false
  private finished = false
  private enteredFullscreen = false   // only log EXIT if we actually entered
  private devToolsDetected = false    // one-shot — flag session at most once

  constructor(config: AntiCheatConfig) {
    this.config = config
  }

  start() {
    this.requestFullscreen()
    this.listenVisibilityChange()
    this.listenWindowBlur()
    this.listenKeyboard()
    this.listenContextMenu()
    this.listenFullscreenChange()
    this.startDevToolsPolling()
    this.startIdleDetection()
  }

  stop() {
    this.cleanupFns.forEach(fn => fn())
    this.cleanupFns = []
    if (this.blurTimer) { clearTimeout(this.blurTimer); this.blurTimer = null }
    if (this.devToolsInterval) { clearInterval(this.devToolsInterval); this.devToolsInterval = null }
    if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null }
  }

  finish() {
    this.finished = true
    this.stop()
  }

  logMultipleSubmissions(challengeId: number, attemptNumber: number) {
    if (attemptNumber > 3) {
      this.log('MULTIPLE_SUBMISSIONS', 'medium', `Challenge ${challengeId} submitted ${attemptNumber} times`)
    }
  }

  getCheatScore(): number {
    return this.events.reduce((sum, e) => sum + SEVERITY_POINTS[e.severity], 0)
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private requestFullscreen() {
    if (typeof document === 'undefined') return
    document.documentElement.requestFullscreen?.()
      .then(() => { this.enteredFullscreen = true })
      .catch(() => { /* user declined or browser blocked — no event */ })
  }

  private listenVisibilityChange() {
    const handler = () => {
      if (document.hidden) this.log('TAB_SWITCH', 'medium', 'Candidate switched tabs or minimised')
    }
    document.addEventListener('visibilitychange', handler)
    this.cleanupFns.push(() => document.removeEventListener('visibilitychange', handler))
  }

  private listenWindowBlur() {
    const blurHandler = () => {
      // Ignore blur events caused by the Monaco editor grabbing focus internally
      if (document.activeElement && document.activeElement !== document.body) return
      this.log('WINDOW_BLUR', 'low', 'Window lost focus')
      this.blurTimer = setTimeout(() => {
        this.log('WINDOW_BLUR_EXTENDED', 'high', 'Focus lost for over 30 seconds')
      }, 30_000)
    }
    const focusHandler = () => {
      if (this.blurTimer) { clearTimeout(this.blurTimer); this.blurTimer = null }
    }
    window.addEventListener('blur', blurHandler)
    window.addEventListener('focus', focusHandler)
    this.cleanupFns.push(() => {
      window.removeEventListener('blur', blurHandler)
      window.removeEventListener('focus', focusHandler)
    })
  }

  private listenKeyboard() {
    const handler = (e: KeyboardEvent) => {
      this.resetIdle()
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'c') this.log('COPY_DETECTED', 'low', 'Ctrl+C detected')
      if (ctrl && e.key === 'v') this.log('PASTE_DETECTED', 'high', 'Ctrl+V detected — possible external paste')
      if (e.key === 'PrintScreen') this.log('SCREENSHOT_ATTEMPT', 'low', 'PrintScreen key pressed')
      this.detectRapidTyping()
    }
    document.addEventListener('keydown', handler)
    this.cleanupFns.push(() => document.removeEventListener('keydown', handler))
  }

  private detectRapidTyping() {
    const now = Date.now()
    this.typingBuffer = this.typingBuffer.filter(t => now - t < 5000)
    this.typingBuffer.push(now)
    if (this.typingBuffer.length > 16) {
      const elapsedMin = (now - this.typingBuffer[0]) / 1000 / 60
      const wpm = (this.typingBuffer.length / 5) / elapsedMin
      if (wpm > 200) {
        this.log('RAPID_TYPING', 'high', `~${Math.round(wpm)} WPM detected — possible bulk paste`)
        this.typingBuffer = []
      }
    }
  }

  private listenContextMenu() {
    const handler = (e: MouseEvent) => {
      e.preventDefault()
      this.log('RIGHT_CLICK', 'low', 'Right-click / context menu opened')
    }
    document.addEventListener('contextmenu', handler)
    this.cleanupFns.push(() => document.removeEventListener('contextmenu', handler))
  }

  private listenFullscreenChange() {
    const handler = () => {
      if (document.fullscreenElement) {
        // Just entered fullscreen — record the fact
        this.enteredFullscreen = true
      } else if (this.enteredFullscreen) {
        // Only report EXIT if the session actually entered fullscreen first
        this.log('FULLSCREEN_EXIT', 'medium', 'Candidate exited fullscreen mode')
        this.enteredFullscreen = false
      }
    }
    document.addEventListener('fullscreenchange', handler)
    this.cleanupFns.push(() => document.removeEventListener('fullscreenchange', handler))
  }

  private startDevToolsPolling() {
    // Check every 3 s; fire at most once per session (one-shot).
    // Raise threshold to 200px to reduce false positives from browser chrome.
    this.devToolsInterval = setInterval(() => {
      if (this.devToolsDetected || this.flagged || this.finished) return
      const widthDiff  = window.outerWidth  - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight
      if (widthDiff > 200 || heightDiff > 200) {
        this.devToolsDetected = true
        this.log('DEVTOOLS_OPENED', 'critical', 'Browser DevTools appear to be open')
      }
    }, 3000)
  }

  private startIdleDetection() { this.resetIdle() }

  private resetIdle() {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      this.log('IDLE_TOO_LONG', 'low', 'No activity for 5+ minutes')
    }, 5 * 60 * 1000)
  }

  // ── Core logging ────────────────────────────────────────────────────────────

  private log(type: CheatEventType, severity: CheatSeverity, detail?: string) {
    if (this.flagged || this.finished) return

    // Per-event-type cooldown
    const cooldown = EVENT_COOLDOWN_MS[type] ?? 0
    if (cooldown > 0) {
      const last = this.lastEventTime.get(type) ?? 0
      if (Date.now() - last < cooldown) return
    }
    this.lastEventTime.set(type, Date.now())

    this.events.push({ type, severity })
    this.config.onEvent(type, severity, detail)

    if (severity === 'critical') { this.flagSession(); return }

    const highCount = this.events.filter(e => e.severity === 'high' || e.severity === 'critical').length
    if (highCount >= 5) { this.flagSession(); return }

    if (severity === 'medium' || severity === 'high') {
      this.config.onWarning('Suspicious activity detected — this has been logged for recruiter review.')
    }
  }

  private flagSession() {
    this.flagged = true
    this.config.onEvent('SESSION_FLAGGED', 'critical', 'Session flagged due to repeated integrity violations')
    this.config.onSessionFlag()
  }
}
