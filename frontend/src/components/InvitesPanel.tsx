import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { inviteUrl, revokeInvite, formatDuration, type RecruiterInvite, type InviteState } from '../api/invites'

const STATE_STYLE: Record<InviteState, { label: string; color: string }> = {
  PENDING:         { label: 'Not started',  color: 'var(--accent)' },
  IN_PROGRESS:     { label: 'In progress',  color: 'var(--warning)' },
  COMPLETED:       { label: 'Completed',    color: 'var(--success)' },
  TIMED_OUT:       { label: 'Time ran out', color: 'var(--success)' },
  LINK_EXPIRED:    { label: 'Link expired', color: 'var(--text-muted)' },
  REVOKED:         { label: 'Revoked',      color: 'var(--text-muted)' },
  SESSION_DELETED: { label: 'Session deleted', color: 'var(--text-muted)' },
}

const th: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-code)', fontSize: '10px',
  fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap',
}
const td: React.CSSProperties = { padding: '12px 16px', fontFamily: 'var(--font-ui)', fontSize: '0.82rem', verticalAlign: 'top' }

interface Props {
  invites: RecruiterInvite[]
  onChanged: () => void
  onCreate: () => void
}

/** Recruiter's list of single-use assessment links with copy / revoke / review actions. */
export default function InvitesPanel({ invites, onChanged, onCreate }: Props) {
  const navigate = useNavigate()
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const copy = async (inv: RecruiterInvite) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(inv.token))
      setCopiedId(inv.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      window.prompt('Copy this link:', inviteUrl(inv.token))
    }
  }

  const revoke = async (inv: RecruiterInvite) => {
    if (!window.confirm(`Revoke the link for ${inv.candidateName}? It will stop working immediately.`)) return
    setBusyId(inv.id)
    try {
      await revokeInvite(inv.id)
      onChanged()
    } catch (err: any) {
      if (!err?._isAuthRedirect) window.alert(err?.response?.data?.message ?? 'Failed to revoke link')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '28px' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>Assessment Links</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'var(--font-ui)' }}>
            Each link is for one candidate and can be used once
          </p>
        </div>
        <button onClick={onCreate} style={{
          background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'var(--on-accent)',
          padding: '7px 16px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-ui)', fontWeight: 700,
        }}>+ New Link</button>
      </div>

      {invites.length === 0 ? (
        <div style={{ padding: '36px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No links yet. Create one to invite your first candidate.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={th}>Candidate</th>
                <th style={th}>Assessment</th>
                <th style={th}>Challenges</th>
                <th style={th}>Status</th>
                <th style={th}>Expires / Started</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => {
                const st = STATE_STYLE[inv.state] ?? { label: inv.state, color: 'var(--text-muted)' }
                const usable = inv.state === 'PENDING'
                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.candidateName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{inv.candidateEmail}</div>
                    </td>
                    <td style={{ ...td, color: 'var(--text-secondary)' }}>
                      {inv.title}
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-code)' }}>
                        {formatDuration(inv.totalTimeSeconds)}
                      </div>
                    </td>
                    <td style={{ ...td, color: 'var(--text-muted)', fontSize: '0.75rem', maxWidth: 260 }}>
                      {inv.challenges.map((c, i) => `${i + 1}. ${c.title}`).join(' · ')}
                    </td>
                    <td style={td}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                        padding: '3px 10px', borderRadius: '20px', fontFamily: 'var(--font-code)', whiteSpace: 'nowrap',
                        color: st.color, border: `1px solid ${st.color}`, opacity: 0.9,
                      }}>{st.label}</span>
                    </td>
                    <td style={{ ...td, color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {inv.startedAt
                        ? `started ${new Date(inv.startedAt).toLocaleString()}`
                        : `${inv.state === 'LINK_EXPIRED' ? 'expired' : 'expires'} ${new Date(inv.expiresAt).toLocaleDateString()}`}
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {usable && (
                          <button onClick={() => copy(inv)} style={smallBtn('var(--accent)')}>
                            {copiedId === inv.id ? 'Copied ✓' : 'Copy link'}
                          </button>
                        )}
                        {usable && (
                          <button disabled={busyId === inv.id} onClick={() => revoke(inv)} style={smallBtn('var(--danger)')}>
                            {busyId === inv.id ? '…' : 'Revoke'}
                          </button>
                        )}
                        {inv.sessionId && inv.state !== 'SESSION_DELETED' && (
                          <button onClick={() => navigate(`/recruiter/session/${inv.sessionId}`)} style={smallBtn('var(--accent)')}>
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const smallBtn = (color: string): React.CSSProperties => ({
  background: 'transparent', border: `1px solid ${color}`, borderRadius: '6px', color,
  padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-ui)',
  fontWeight: 600, whiteSpace: 'nowrap',
})
