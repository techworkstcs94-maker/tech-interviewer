import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CODE_LINES = [
  '@RestController',
  '@RequestMapping("/api")',
  'public class ProductController {',
  '  @Autowired private ProductService svc;',
  '',
  '  @GetMapping("/products")',
  '  public List<Product> all() {',
  '    return svc.findAll();',
  '  }',
  '',
  '  @GetMapping("/products/{id}")',
  '  public ResponseEntity<Product> byId(@PathVariable Long id) {',
  '    return svc.findById(id)',
  '      .map(ResponseEntity::ok)',
  '      .orElse(ResponseEntity.notFound().build());',
  '  }',
  '}',
]

export default function Landing() {
  const navigate = useNavigate()
  const [displayedLines, setDisplayed] = useState<string[]>([])
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)

  // Poll the backend until it responds, then cache readiness in localStorage.
  // CandidateEntry reads this cache — if the user spent any time on this page
  // the backend will already be confirmed awake before they hit "Start Assessment".
  useEffect(() => {
    let stopped = false
    const poll = async () => {
      while (!stopped) {
        try {
          const res = await fetch('/api/challenges', { signal: AbortSignal.timeout(8000) })
          if (res.ok) {
            localStorage.setItem('backendReady', Date.now().toString())
            return
          }
        } catch {}
        await new Promise(r => setTimeout(r, 3000))
      }
    }
    poll()
    return () => { stopped = true }
  }, [])

  useEffect(() => {
    if (lineIdx >= CODE_LINES.length) return
    const line = CODE_LINES[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 30)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setDisplayed(prev => [...prev, line])
        setLineIdx(l => l + 1)
        setCharIdx(0)
      }, 50)
      return () => clearTimeout(t)
    }
  }, [lineIdx, charIdx])

  const currentLine = lineIdx < CODE_LINES.length ? CODE_LINES[lineIdx].slice(0, charIdx) : ''

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-4xl w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="orbitron text-5xl font-black text-white">
            Java<span className="text-[var(--blue)]">MSA</span>Interviewer
          </h1>
          <p className="text-[var(--muted)] text-sm max-w-xl mx-auto">
            Spring Boot Microservices Assessment Platform · Instant JavaParser analysis + GitHub Actions deep verification
          </p>
        </div>

        {/* Typewriter code block */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 font-mono text-sm shadow-2xl shadow-blue-900/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[var(--red)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--amber)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--green)]" />
            <span className="ml-2 text-[var(--muted)] text-xs">ProductController.java</span>
          </div>
          <div className="space-y-0 text-sm leading-6 min-h-[280px]">
            {displayedLines.map((line, i) => (
              <div key={i} className="text-[var(--text)] whitespace-pre">
                {line || <span>&nbsp;</span>}
              </div>
            ))}
            {lineIdx < CODE_LINES.length && (
              <div className="text-[var(--text)] whitespace-pre">
                {currentLine}
                <span className="inline-block w-2 h-4 bg-[var(--blue)] ml-0.5 animate-pulse align-middle" />
              </div>
            )}
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/start')}
            className="group bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--blue)] rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/20"
          >
            <div className="text-3xl mb-3">🚀</div>
            <h2 className="text-lg font-bold text-white group-hover:text-[var(--blue)] transition-colors mb-2">
              Start Assessment
            </h2>
            <p className="text-sm text-[var(--muted)]">
              6 challenges · REST, Service Layer, JPA, Exception Handling, WebClient, JWT Security
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['EASY', 'MEDIUM', 'HARD'].map(d => (
                <span key={d} className={`text-[10px] px-2 py-0.5 rounded border difficulty-${d.toLowerCase()}`}>{d}</span>
              ))}
            </div>
          </button>

          <button
            onClick={() => navigate('/recruiter')}
            className="group bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--amber)] rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:shadow-amber-900/20"
          >
            <div className="text-3xl mb-3">🎯</div>
            <h2 className="text-lg font-bold text-white group-hover:text-[var(--amber)] transition-colors mb-2">
              Recruiter Portal
            </h2>
            <p className="text-sm text-[var(--muted)]">
              View all candidate sessions, scores, and detailed code submissions
            </p>
            <div className="mt-4 text-xs text-[var(--muted)]">
              Secure recruiter dashboard
            </div>
          </button>
        </div>

        {/* Tech badges */}
        <div className="flex flex-wrap justify-center gap-2 text-[10px] text-[var(--muted)]">
          {['Spring Boot 3.2', 'Java 17', 'JavaParser AST', 'GitHub Actions', 'React 18', 'Monaco Editor', 'WebSocket', 'PostgreSQL'].map(t => (
            <span key={t} className="px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)]">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
