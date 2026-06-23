export interface Challenge {
  id: number
  title: string
  description: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: string
  timeLimitSeconds: number
  starterCode?: string
  testCasesJson: string
  hintsJson: string
  conceptsJson: string
}

export interface TestCase {
  id: string
  label: string
  weight: number
}

export interface TestResult {
  id: string
  label: string
  passed: boolean
  feedback: string
}

export interface AnalysisResult {
  testResults: TestResult[]
  instantScore: number
  qualityScore: number
  parseError?: string
}

export interface Submission {
  id: number
  sessionId: string
  challengeId: number
  code: string
  instantScore?: number
  deepScore?: number
  instantResults?: string
  deepResults?: string
  elapsedSeconds?: number
  status: 'PENDING' | 'INSTANT_DONE' | 'DEEP_DONE'
  createdAt: string
}

export type CheatSeverity = 'low' | 'medium' | 'high' | 'critical'
export type CheatEventType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'WINDOW_BLUR_EXTENDED'
  | 'COPY_DETECTED'
  | 'PASTE_DETECTED'
  | 'RIGHT_CLICK'
  | 'FULLSCREEN_EXIT'
  | 'DEVTOOLS_OPENED'
  | 'RAPID_TYPING'
  | 'SCREENSHOT_ATTEMPT'
  | 'IDLE_TOO_LONG'
  | 'MULTIPLE_SUBMISSIONS'
  | 'SESSION_FLAGGED'

export interface CheatEvent {
  id?: number
  sessionId: string
  eventType: CheatEventType
  severity: CheatSeverity
  detail?: string
  occurredAt: string
}

export interface Session {
  sessionId: string
  candidateName: string
  candidateEmail: string
  startTime: string
  endTime?: string
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
  submissions: Submission[]
  averageInstantScore: number
  averageDeepScore: number
  cheatEvents?: CheatEvent[]
  cheatScore?: number
}

export interface SessionSummary {
  sessionId: string
  candidateName: string
  candidateEmail: string
  startTime: string
  endTime: string
  status: string
  submissionCount: number
  avgInstantScore: number
  avgDeepScore: number
  cheatScore: number
  cheatEventCount: number
}

export interface LoginResponse {
  sessionId: string
  token: string
  candidateName: string
}

export interface WebSocketMsg {
  type: 'INSTANT_RESULT' | 'DEEP_STARTED' | 'DEEP_RESULT' | 'ERROR'
  payload: unknown
  timestamp: number
}

export interface LogEntry {
  time: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

export interface DeepResult {
  passedCount: number
  totalCount: number
  deepScore: number
  rawOutput: string
}
