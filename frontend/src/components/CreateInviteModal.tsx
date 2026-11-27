import React, { useEffect, useMemo, useState } from 'react'
import { getAdminChallenges, type AdminChallenge } from '../api/adminChallenges'
import { createInvite, inviteUrl, formatDuration } from '../api/invites'

const DIFF_COLOR: Record<string, string> = {
  EASY: 'var(--success)',
  MEDIUM: 'var(--warning)',
  HARD: 'var(--danger)',
}

const EXPIRY_OPTIONS = [1, 3, 7, 14, 30]

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'var(--bg-highest)', border: '1px solid var(--border)', borderRadius: '6px',
  color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '6px',
  fontFamily: 'var(--font-code)', fontSize: '10px', letterSpacing: '0.05em',
  textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)',
}

/**
 * Recruiter picks a candidate + an ordered set of challenges and gets a single-use link to share.
 * Click order = the candidate's tab order.
 */
export default function CreateInviteModal({ open, onClose, onCreated }: Props) {
  const [challenges, setChallenges] = useState<AdminChallenge[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [title, setTitle] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const reset = () => {
    setSelected([]); setTitle(''); setCandidateName(''); setCandidateEmail('')
    setExpiresInDays(7); setError(''); setCreatedUrl(null); setCopied(false)
  }

  useEffect(() => {
    if (!open) return
    reset()
    setLoading(true)
    getAdminChallenges()
      .then(setChallenges)
      .catch((err) => { if (!err?._isAuthRedirect) setError('Failed to load challenges.') })
      .finally(() => setLoading(false))
  }, [open])

  const grouped = useMemo(() => {
    const map = new Map<string, AdminChallenge[]>()
    for (const c of challenges) {
      if (!map.has(c.category)) map.set(c.category, [])
      map.get(c.category)!.push(c)
    }
    return Array.from(map.entries())
  }, [challenges])

  const totalSeconds = useMemo(
    () => selected.reduce((sum, id) => sum + (challenges.find(c => c.id === id)?.timeLimitSeconds ?? 0), 0),
    [selected, challenges])

  const toggle = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail.trim())
  const canCreate = !saving && !loading && selected.length > 0
    && title.trim() !== '' && candidateName.trim() !== '' && emailValid

  const handleCreate = async () => {
    if (!canCreate) return
    setSaving(true)
    setError('')
    try {
      const res = await createInvite({
        title: title.trim(),
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        challengeIds: selected,
        expiresInDays,
      })
      setCreatedUrl(inviteUrl(res.token))
      onCreated?.()
    } catch (err: any) {
      if (!err?._isAuthRedirect) setError(err?.response?.data?.message ?? 'Failed to create the link.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!createdUrl) return
    try {
      await navigator.clipboard.writeText(createdUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed — select the link and copy it manually.')
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(10,14,26,0.75)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-raised)', border: '1px solid var(--border)',
          borderRadius: '12px', width: '100%', maxWidth: '680px',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '4px' }}>Single-use link</div>
          <h2 style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
            Create Assessment Link
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
            The candidate will see only the challenges you select, in the order you select them.
          </p>
        </div>

        {createdUrl ? (
          /* ── Success: share the link ── */
          <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ color: 'var(--success)', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
              ✓ Link created for {candidateName.trim()}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input readOnly value={createdUrl} onFocus={e => e.currentTarget.select()}
                     style={{ ...inputStyle, fontFamily: 'var(--font-code)', fontSize: '0.8rem' }} />
              <button onClick={handleCopy} style={primaryBtn(false)}>{copied ? 'Copied ✓' : 'Copy'}</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
              {selected.length} challenge{selected.length !== 1 ? 's' : ''} · {formatDuration(totalSeconds)} total ·
              link expires in {expiresInDays} day{expiresInDays !== 1 ? 's' : ''} if unused · works once.
            </p>
            {error && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</span>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button onClick={reset} style={secondaryBtn}>Create another</button>
              <button onClick={onClose} style={primaryBtn(false)}>Done</button>
            </div>
          </div>
        ) : (
          <>
            {/* Body */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Assessment title</label>
                  <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)}
                         placeholder="Senior Java Developer – Round 2" maxLength={200} />
                </div>
                <div>
                  <label style={labelStyle}>Candidate name</label>
                  <input style={inputStyle} value={candidateName} onChange={e => setCandidateName(e.target.value)}
                         placeholder="Jane Smith" maxLength={200} />
                </div>
                <div>
                  <label style={labelStyle}>Candidate email</label>
                  <input style={{ ...inputStyle, borderColor: candidateEmail && !emailValid ? 'var(--danger)' : 'var(--border)' }}
                         type="email" value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)}
                         placeholder="jane@example.com" maxLength={200} />
                </div>
                <div>
                  <label style={labelStyle}>Link expires after</label>
                  <select style={inputStyle} value={expiresInDays} onChange={e => setExpiresInDays(Number(e.target.value))}>
                    {EXPIRY_OPTIONS.map(d => <option key={d} value={d}>{d} day{d !== 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Assessment time</label>
                  <div style={{ ...inputStyle, background: 'transparent', color: totalSeconds ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700 }}>
                    {totalSeconds ? formatDuration(totalSeconds) : '—'} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.75rem' }}>(sum of selected)</span>
                  </div>
                </div>
              </div>

              <label style={{ ...labelStyle, marginTop: '8px' }}>Challenges</label>
              {loading ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
              ) : (
                grouped.map(([category, items]) => (
                  <div key={category} style={{ marginBottom: '14px' }}>
                    <div className="label-caps" style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>{category}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {items.map((c) => {
                        const pos = selected.indexOf(c.id)
                        const isOn = pos >= 0
                        return (
                          <label key={c.id} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                            background: isOn ? 'var(--accent-muted)' : 'var(--bg-overlay)',
                            border: `1px solid ${isOn ? 'rgba(164,230,255,0.35)' : 'var(--border)'}`,
                          }}>
                            <input type="checkbox" checked={isOn} onChange={() => toggle(c.id)}
                                   style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                            <span style={{
                              width: 20, textAlign: 'center', fontFamily: 'var(--font-code)', fontSize: '0.75rem',
                              color: 'var(--accent)', fontWeight: 700,
                            }} title="Order shown to the candidate">{isOn ? pos + 1 : ''}</span>
                            <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {c.title}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                              {Math.round(c.timeLimitSeconds / 60)}m
                            </span>
                            <span style={{
                              fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                              padding: '2px 8px', borderRadius: '4px',
                              color: DIFF_COLOR[c.difficulty], border: `1px solid ${DIFF_COLOR[c.difficulty]}55`,
                            }}>{c.difficulty}</span>
                            <span title={c.deepVerified ? 'JUnit deep verification' : 'Structural analysis only'} style={{
                              fontSize: '9px', fontFamily: 'var(--font-code)', padding: '2px 8px', borderRadius: '4px',
                              color: c.deepVerified ? 'var(--success)' : 'var(--text-muted)',
                              border: `1px solid ${c.deepVerified ? 'rgba(78,222,163,0.3)' : 'var(--border)'}`,
                            }}>{c.deepVerified ? 'JUnit' : 'AST'}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            }}>
              <span style={{ fontSize: '0.8rem', color: error ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                {error || `${selected.length} of ${challenges.length} selected`}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onClose} style={secondaryBtn}>Cancel</button>
                <button onClick={handleCreate} disabled={!canCreate} style={primaryBtn(!canCreate)}>
                  {saving ? 'Creating…' : 'Create Link'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const secondaryBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
  color: 'var(--text-secondary)', padding: '8px 16px', cursor: 'pointer',
  fontSize: '0.85rem', fontFamily: 'var(--font-ui)',
}

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  background: 'var(--accent)', border: 'none', borderRadius: '8px',
  color: 'var(--on-accent)', padding: '8px 20px', whiteSpace: 'nowrap',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '0.85rem', fontFamily: 'var(--font-ui)', fontWeight: 700,
  opacity: disabled ? 0.6 : 1,
})
