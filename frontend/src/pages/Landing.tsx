import React from 'react'

/**
 * Public home page. Informational only — candidates start through the single-use assessment link
 * (/a/:token) their recruiter sends them; recruiters go to /recruiter directly.
 */

const STACK = ['Java 17', 'Spring Boot 3.2', 'Microservices', 'REST APIs']
const INSIDE = ['Spring Boot 3.2', 'Java 17', 'JavaParser AST', 'JPA / Hibernate', 'JWT Security', 'WebClient']
const FEATURES = [
  { icon: '⌘', title: 'Real-world engineering', body: 'Explore backend patterns and practical Java development concepts.' },
  { icon: '⌁', title: 'Code-level insight', body: 'JavaParser AST analysis and structured technical evaluation.' },
  { icon: '◈', title: 'Security in focus', body: 'Discover API security concepts, JWT, and robust application design.' },
]

// Scoped styles: layout breakpoints + hover states that inline styles can't express
const css = `
.lp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
.lp-hero { display: grid; grid-template-columns: 1.05fr 1fr; gap: 40px; align-items: center; }
.lp-invite { display: grid; grid-template-columns: 1.4fr 1fr; gap: 32px; align-items: center; }
.lp-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.lp-card { transition: border-color .2s, transform .2s; }
.lp-card:hover { border-color: rgba(164,230,255,0.35) !important; transform: translateY(-2px); }
.lp-chip:hover { border-color: var(--accent) !important; }
@media (max-width: 900px) {
  .lp-hero, .lp-invite { grid-template-columns: 1fr; }
  .lp-features { grid-template-columns: 1fr; }
  .lp-h1 { font-size: 2.6rem !important; }
}
@media (max-width: 520px) {
  .lp-wrap { padding: 0 16px; }
  .lp-h1 { font-size: 2.1rem !important; }
  .lp-pad { padding: 24px !important; }
}
`

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <style>{css}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
        <div className="lp-wrap" style={{ height: '72px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 38, height: 38, flexShrink: 0, background: 'var(--accent)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.9rem', color: 'var(--on-accent)', fontFamily: 'var(--font-ui)',
          }}>JM</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Java MSA Interviewer
            </div>
            <div style={{ fontFamily: 'var(--font-code)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Developer assessment portal
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', padding: '72px 0 56px' }}>
          <div aria-hidden style={{
            position: 'absolute', top: -120, left: '30%', width: 560, height: 560, pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(164,230,255,0.10) 0%, transparent 65%)',
          }} />
          <div className="lp-wrap lp-hero" style={{ position: 'relative' }}>
            {/* Left: headline */}
            <div>
              <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '18px' }}>
                The engineering challenge
              </div>
              <h1 className="lp-h1" style={{
                fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '3.4rem', lineHeight: 1.05,
                letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '20px',
              }}>
                Think deeper.<br />
                <span style={{ color: 'var(--accent)' }}>Code smarter.</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '500px', marginBottom: '32px' }}>
                A technical challenge built for developers who love solving real problems. Put your Java,
                Spring Boot, and microservices knowledge into action.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {STACK.map((s, i) => (
                  <span key={s} className="lp-chip" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '999px',
                    background: 'var(--bg-raised)', border: '1px solid var(--border)',
                    fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--text-primary)',
                    transition: 'border-color .2s',
                  }}>
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.7rem', color: 'var(--accent)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: challenge card */}
            <div className="lp-pad" style={{
              position: 'relative', overflow: 'hidden', borderRadius: '16px', padding: '36px',
              background: 'linear-gradient(160deg, var(--bg-surface) 0%, var(--bg-raised) 100%)',
              border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            }}>
              <div aria-hidden style={{
                position: 'absolute', top: -80, right: -80, width: 240, height: 240, pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(78,222,163,0.12) 0%, transparent 70%)',
              }} />
              <div style={{ position: 'relative' }}>
                <div className="label-caps" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Developer assessment portal
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2,
                  letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '14px',
                }}>
                  Java Spring Boot<br />
                  <span style={{ color: 'var(--accent)' }}>Microservices</span> Technical Challenge
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '24px' }}>
                  Explore practical backend engineering concepts across REST APIs, service layers, JPA, exception
                  handling, WebClient, and JWT security. A focused experience designed to highlight the way you
                  approach software engineering.
                </p>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                  <div className="label-caps" style={{ color: 'var(--success)', marginBottom: '12px' }}>Inside the challenge</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {INSIDE.map(tag => (
                      <span key={tag} style={{
                        background: 'var(--accent-muted)', border: '1px solid rgba(164,230,255,0.2)',
                        borderRadius: '6px', padding: '4px 10px',
                        fontSize: '0.78rem', color: 'var(--accent)', fontFamily: 'var(--font-code)',
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Invitation-only ──────────────────────────────────────────── */}
        <section style={{ padding: '24px 0 56px' }}>
          <div className="lp-wrap">
            <div className="lp-invite lp-pad" style={{
              borderRadius: '16px', padding: '40px',
              background: 'var(--bg-raised)', border: '1px solid var(--border)',
            }}>
              <div>
                <h2 style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.75rem',
                  letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '12px',
                }}>
                  <span aria-hidden style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>✳</span>
                  Good code starts with a challenge.
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '560px' }}>
                  Access to assessments is invitation-only. Candidates receive a personal invite link from their
                  recruiter, with the details needed to begin their challenge.
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
                borderRadius: '12px', background: 'var(--bg-overlay)', border: '1px solid rgba(164,230,255,0.25)',
              }}>
                <span aria-hidden style={{
                  width: 44, height: 44, flexShrink: 0, borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--accent)', color: 'var(--on-accent)', fontSize: '1.25rem', fontWeight: 800,
                }}>↗</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Personal invite access
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>A dedicated link for every candidate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tagline + features ───────────────────────────────────────── */}
        <section style={{ padding: '8px 0 72px' }}>
          <div className="lp-wrap">
            <p style={{
              textAlign: 'center', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.35rem',
              letterSpacing: '-0.01em', color: 'var(--text-primary)', marginBottom: '32px',
            }}>
              One challenge. Your skills. <span style={{ color: 'var(--success)' }}>Your moment to shine.</span>
            </p>
            <div className="lp-features">
              {FEATURES.map(f => (
                <div key={f.title} className="lp-card" style={{
                  borderRadius: '14px', padding: '28px',
                  background: 'var(--bg-raised)', border: '1px solid var(--border)',
                }}>
                  <div aria-hidden style={{
                    width: 44, height: 44, borderRadius: '10px', marginBottom: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--accent-muted)', border: '1px solid rgba(164,230,255,0.2)',
                    color: 'var(--accent)', fontSize: '1.2rem',
                  }}>{f.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {f.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.65 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 0' }}>
        <div className="lp-wrap" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, color: 'var(--text-primary)' }}>Java MSA Interviewer</span>
            <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.75rem', color: 'var(--accent)' }}>✦ Technical challenge portal</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Built for curious minds and better code.</span>
        </div>
      </footer>
    </div>
  )
}
