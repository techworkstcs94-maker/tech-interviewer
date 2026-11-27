import React from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Public home page. Candidates no longer self-register here — they start only through the
 * single-use assessment link (/a/:token) their recruiter sends them.
 */
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        height: '64px',
      }}>
        <div style={{
          maxWidth: '1440px', margin: '0 auto',
          padding: '0 32px', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32, height: 32, flexShrink: 0,
              background: 'var(--accent)',
              borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.8rem', color: 'var(--on-accent)',
              fontFamily: 'var(--font-ui)',
            }}>JM</div>
            <span style={{
              fontFamily: 'var(--font-ui)', fontWeight: 700,
              fontSize: '1.05rem', color: 'var(--accent)',
              letterSpacing: '-0.01em',
            }}>Java MSA Interviewer</span>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main style={{ paddingTop: '88px', paddingBottom: '48px', flex: 1 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>

          {/* ── Hero: info card + registration panel ─────────────────────── */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: '1fr 420px',
            gap: '28px',
          }}>
            {/* Left: Info card */}
            <div style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '12px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '380px',
            }}>
              {/* Subtle radial glow */}
              <div style={{
                position: 'absolute', top: -100, right: -100,
                width: 320, height: 320,
                background: 'radial-gradient(circle, rgba(164,230,255,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '14px' }}>
                  Developer Assessment Portal
                </div>
                <h1 style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                  maxWidth: '520px',
                }}>
                  Java Spring Boot<br />
                  <span style={{ color: 'var(--accent)' }}>Microservices</span><br />
                  Technical Challenge
                </h1>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  maxWidth: '480px',
                  marginBottom: '28px',
                }}>
                  A timed, proctored assessment covering REST APIs, Service Layer, JPA,
                  Exception Handling, WebClient, and JWT Security.
                  Instant JavaParser analysis with GitHub Actions deep verification.
                </p>

                {/* Tech badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Spring Boot 3.2', 'Java 17', 'JavaParser AST', 'JPA / Hibernate', 'JWT Security'].map(tag => (
                    <span key={tag} style={{
                      background: 'var(--accent-muted)',
                      border: '1px solid rgba(164,230,255,0.2)',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '0.8rem',
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-code)',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: how to start */}
            <div className="glass-panel" style={{ borderRadius: '12px', padding: '36px', display: 'flex', flexDirection: 'column' }}>
              <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '8px' }}>
                Candidates
              </div>
              <h2 style={{
                fontFamily: 'var(--font-ui)', fontWeight: 700,
                fontSize: '1.25rem', color: 'var(--text-primary)',
                letterSpacing: '-0.01em', marginBottom: '10px',
              }}>
                Start with your invite link
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '20px' }}>
                Assessments are by invitation only. Open the personal link your recruiter sent you —
                it contains your challenges and starts your timed session. Each link can be used once.
              </p>
              <div style={{
                background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: '8px',
                padding: '12px 14px', fontFamily: 'var(--font-code)', fontSize: '0.8rem',
                color: 'var(--text-muted)', marginBottom: '28px', wordBreak: 'break-all',
              }}>
                {window.location.origin}/a/<span style={{ color: 'var(--accent)' }}>your-invite-code</span>
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <div className="label-caps" style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Recruiters</div>
                <button
                  onClick={() => navigate('/recruiter')}
                  style={{
                    width: '100%', padding: '11px 20px',
                    background: 'var(--accent-muted)', border: '1px solid rgba(164,230,255,0.3)',
                    borderRadius: '8px', color: 'var(--accent)', cursor: 'pointer',
                    fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem',
                  }}
                >
                  Recruiter sign in →
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
