import type { CheatEventType, CheatSeverity } from '../types'
import { SEVERITY_POINTS } from './cheatConstants'

interface AntiCheatConfig {
  sessionId: string
  onEvent: (type: CheatEventType, severity: CheatSeverity, detail?: string) => void
  onWarning: (message: string) => void
  onSessionFlag: () => void
}

export class AntiCheatMonitor {
  private config: AntiCheatConfig
  private events: { type: CheatEventType; severity: CheatSeverity }[] = []
  private blurTimer: ReturnType<typeof setTimeout> | null = null
  private devToolsInterval: ReturnType<typeof setInterval> | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private typingBuffer: number[] = []
  private cleanupFns: (() => void)[] = []
  private flagged = false
  private finished = false

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
    if (this.blurTimer) clearTimeout(this.blurTimer)
    if (this.devToolsInterval) clearInterval(this.devToolsInterval)
    if (this.idleTimer) clearTimeout(this.idleTimer)
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

  private requestFullscreen() {
    if (typeof document === 'undefined') return
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  private listenVisibilityChange() {
    const handler = () => {
      if (document.hidden) this.log('TAB_SWITCH', 'medium', 'Candidate switched tabs')
    }
    document.addEventListener('visibilitychange', handler)
    this.cleanupFns.push(() => document.removeEventListener('visibilitychange', handler))
  }

  private listenWindowBlur() {
    const blurHandler = () => {
      this.log('WINDOW_BLUR', 'low')
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
      if (ctrl && e.key === 'c') this.log('COPY_DETECTED', 'medium', 'Ctrl+C detected')
      if (ctrl && e.key === 'v') this.log('PASTE_DETECTED', 'high', 'Ctrl+V detected')
      if (e.key === 'PrintScreen') this.log('SCREENSHOT_ATTEMPT', 'low')
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
      const elapsed = (now - this.typingBuffer[0]) / 1000 / 60
      const wpm = (this.typingBuffer.length / 5) / elapsed
      if (wpm > 200) {
        this.log('RAPID_TYPING', 'high', `~${Math.round(wpm)} WPM — possible paste`)
        this.typingBuffer = []
      }
    }
  }

  private listenContextMenu() {
    const handler = (e: MouseEvent) => { e.preventDefault(); this.log('RIGHT_CLICK', 'low') }
    document.addEventListener('contextmenu', handler)
    this.cleanupFns.push(() => document.removeEventListener('contextmenu', handler))
  }

  private listenFullscreenChange() {
    const handler = () => {
      if (!document.fullscreenElement) this.log('FULLSCREEN_EXIT', 'medium', 'Exited fullscreen')
    }
    document.addEventListener('fullscreenchange', handler)
    this.cleanupFns.push(() => document.removeEventListener('fullscreenchange', handler))
  }

  private startDevToolsPolling() {
    this.devToolsInterval = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        this.log('DEVTOOLS_OPENED', 'critical', 'DevTools heuristic triggered')
      }
    }, 1000)
  }

  private startIdleDetection() { this.resetIdle() }

  private resetIdle() {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      this.log('IDLE_TOO_LONG', 'low', 'No keystrokes for 5+ minutes')
    }, 5 * 60 * 1000)
  }

  private log(type: CheatEventType, severity: CheatSeverity, detail?: string) {
    if (this.flagged || this.finished) return
    this.events.push({ type, severity })
    this.config.onEvent(type, severity, detail)

    if (severity === 'critical') { this.flagSession(); return }

    const highCount = this.events.filter(e => e.severity === 'high' || e.severity === 'critical').length
    if (highCount >= 5) { this.flagSession(); return }

    if (severity === 'medium' || severity === 'high') {
      this.config.onWarning('Suspicious activity detected — logged for recruiter review.')
    }
  }

  private flagSession() {
    this.flagged = true
    this.config.onEvent('SESSION_FLAGGED', 'critical', 'Session flagged due to repeated violations')
    this.config.onSessionFlag()
  }
}
