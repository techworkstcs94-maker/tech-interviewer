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
