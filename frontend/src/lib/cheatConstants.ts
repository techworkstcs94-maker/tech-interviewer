import type { CheatSeverity } from '../types'

export const SEVERITY_POINTS: Record<CheatSeverity, number> = {
  low: 1,
  medium: 3,
  high: 8,
  critical: 20,
}

export function cheatRiskLabel(score: number): 'clean' | 'suspicious' | 'flagged' {
  if (score === 0) return 'clean'
  if (score < 20) return 'suspicious'
  return 'flagged'
}

export function cheatRiskColor(label: 'clean' | 'suspicious' | 'flagged'): string {
  if (label === 'clean') return 'var(--success)'
  if (label === 'suspicious') return 'var(--warning)'
  return 'var(--danger)'
}

export function cheatRiskBg(label: 'clean' | 'suspicious' | 'flagged'): string {
  if (label === 'clean') return 'rgba(78,222,163,0.1)'
  if (label === 'suspicious') return 'rgba(255,213,156,0.1)'
  return 'rgba(255,180,171,0.1)'
}
