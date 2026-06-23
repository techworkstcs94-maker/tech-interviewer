import React, { useEffect, useState } from 'react'

interface AntiCheatBannerProps {
  message: string | null
  onDismiss: () => void
}

export default function AntiCheatBanner({ message, onDismiss }: AntiCheatBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const t = setTimeout(() => { setVisible(false); onDismiss() }, 5000)
    return () => clearTimeout(t)
  }, [message])

  if (!visible || !message) return null

  return (
    <div
      className="banner-enter"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        width: '360px',
        background: 'var(--bg-overlay)',
        border: '1px solid rgba(255,180,171,0.4)',
        borderLeft: '4px solid var(--danger)',
        borderRadius: '10px',
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <strong style={{ color: 'var(--danger)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
            Suspicious activity detected
          </strong>
        </div>
        <button
          onClick={() => { setVisible(false); onDismiss() }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1,
            padding: '0 2px', fontFamily: 'var(--font-ui)',
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <p style={{
        color: 'var(--text-secondary)', fontSize: '0.8rem',
        lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-ui)',
      }}>
        {message}
      </p>
      <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', marginTop: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          background: 'var(--danger)',
          borderRadius: '1px',
          animation: 'banner-shrink 5s linear forwards',
        }} />
      </div>
    </div>
  )
}
