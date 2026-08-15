import React, { useEffect, useMemo, useState } from 'react'
import { getAdminChallenges, setActiveChallenges, type AdminChallenge } from '../api/adminChallenges'

const DIFF_COLOR: Record<string, string> = {
  EASY: 'var(--success)',
  MEDIUM: 'var(--warning)',
  HARD: 'var(--danger)',
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

export default function ManageChallengesModal({ open, onClose, onSaved }: Props) {
  const [challenges, setChallenges] = useState<AdminChallenge[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
    getAdminChallenges()
      .then((cs) => {
        setChallenges(cs)
        setSelected(new Set(cs.filter((c) => c.active).map((c) => c.id)))
      })
      .catch((err) => {
        if (!err?._isAuthRedirect) setError('Failed to load challenges.')
      })
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

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (selected.size === 0) {
      setError('Select at least one challenge — candidates need something to attempt.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await setActiveChallenges([...selected])
      onSaved?.()
      onClose()
    } catch (err: unknown) {
      if (!(err as { _isAuthRedirect?: boolean })?._isAuthRedirect) setError('Failed to save selection.')
    } finally {
      setSaving(false)
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
          borderRadius: '12px', width: '100%', maxWidth: '620px',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '4px' }}>Global Selection</div>
          <h2 style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
            Manage Challenges
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
            Selected challenges are shown to every candidate who starts an assessment.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            grouped.map(([category, items]) => (
              <div key={category} style={{ marginBottom: '18px' }}>
                <div className="label-caps" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>{category}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {items.map((c) => {
                    const isOn = selected.has(c.id)
                    return (
                      <label
                        key={c.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                          background: isOn ? 'var(--accent-muted)' : 'var(--bg-overlay)',
                          border: `1px solid ${isOn ? 'rgba(164,230,255,0.35)' : 'var(--border)'}`,
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                      >
                        <input type="checkbox" checked={isOn} onChange={() => toggle(c.id)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                        <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {c.title}
                        </span>
                        <span style={{
                          fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: '4px',
                          color: DIFF_COLOR[c.difficulty], border: `1px solid ${DIFF_COLOR[c.difficulty]}55`,
                          background: `${DIFF_COLOR[c.difficulty]}18`,
                        }}>{c.difficulty}</span>
                        <span
                          title={c.deepVerified ? 'JUnit deep verification' : 'Structural analysis only'}
                          style={{
                            fontSize: '9px', fontFamily: 'var(--font-code)', padding: '2px 8px', borderRadius: '4px',
                            color: c.deepVerified ? 'var(--success)' : 'var(--text-muted)',
                            border: `1px solid ${c.deepVerified ? 'rgba(78,222,163,0.3)' : 'var(--border)'}`,
                          }}
                        >
                          {c.deepVerified ? 'JUnit' : 'AST'}
                        </span>
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
            {error || `${selected.size} of ${challenges.length} selected`}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
                color: 'var(--text-secondary)', padding: '8px 16px', cursor: 'pointer',
                fontSize: '0.85rem', fontFamily: 'var(--font-ui)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || selected.size === 0}
              style={{
                background: 'var(--accent)', border: 'none', borderRadius: '8px',
                color: 'var(--on-accent)', padding: '8px 20px',
                cursor: saving || selected.size === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem', fontFamily: 'var(--font-ui)', fontWeight: 700,
                opacity: saving || selected.size === 0 ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save Selection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
