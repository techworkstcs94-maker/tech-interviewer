import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#0a0e1a', color: '#ef4444', minHeight: '100vh', padding: '2rem', fontFamily: 'monospace', fontSize: '14px' }}>
          <h2 style={{ color: '#f59e0b', marginBottom: '1rem' }}>⚠ React Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#64748b', marginTop: '1rem' }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
