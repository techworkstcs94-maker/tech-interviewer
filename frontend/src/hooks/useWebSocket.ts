import { useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { AnalysisResult, DeepResult, LogEntry, WebSocketMsg } from '../types'

interface UseWebSocketReturn {
  instantResults: AnalysisResult | null
  deepResults: DeepResult | null
  logs: LogEntry[]
  deepStatus: 'idle' | 'running' | 'done' | 'error'
  isConnected: boolean
}

const apiUrl = import.meta.env.VITE_API_URL || ''

export function useWebSocket(
  sessionId: string | null,
  challengeId: number | null,
): UseWebSocketReturn {
  const [instantResults, setInstantResults] = useState<AnalysisResult | null>(null)
  const [deepResults, setDeepResults] = useState<DeepResult | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [deepStatus, setDeepStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryDelay = useRef(1000)
  const deepStatusRef = useRef<'idle' | 'running' | 'done' | 'error'>('idle')
  const connectedOnce = useRef(false)

  // Keep ref in sync so callbacks always see current deepStatus
  useEffect(() => { deepStatusRef.current = deepStatus }, [deepStatus])

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev.slice(-99), { time: new Date().toLocaleTimeString(), type, message }])
  }, [])

  // Fetch submission status from DB — used on reconnect and as polling fallback
  const fetchDeepStatus = useCallback(async () => {
    if (!sessionId || !challengeId || deepStatusRef.current === 'done') return
    try {
      const resp = await fetch(`${apiUrl}/api/submissions/status?sessionId=${sessionId}&challengeId=${challengeId}`)
      if (!resp.ok) return
      const data = await resp.json()
      if (data.status === 'DEEP_DONE') {
        const result: DeepResult = {
          deepScore: data.deepScore ?? 0,
          passedCount: data.passedCount ?? 0,
          totalCount: data.totalCount ?? 0,
          rawOutput: data.rawOutput ?? '',
        }
        setDeepResults(result)
        setDeepStatus('done')
        addLog('success', `JUnit result: ${result.passedCount}/${result.totalCount} tests passed · ${result.deepScore}/100`)
      }
    } catch {
      // Network error — will retry on next poll tick
    }
  }, [sessionId, challengeId, addLog])

  const handleMessage = useCallback((msg: WebSocketMsg) => {
    switch (msg.type) {
      case 'INSTANT_RESULT': {
        const result = msg.payload as AnalysisResult
        setInstantResults(result)
        const passed = result.testResults?.filter((t) => t.passed).length ?? 0
        const total = result.testResults?.length ?? 0
        addLog('success', `Structural analysis: ${passed}/${total} checks passed · ${result.instantScore}/100`)
        // If this arrives while deep is still running, GitHub Actions is not configured
        // → fall through to AST fallback so the spinner doesn't run forever
        if (deepStatusRef.current === 'running') {
          setDeepStatus('error')
          addLog('warning', 'GitHub Actions not configured — showing structural analysis only')
        }
        break
      }
      case 'DEEP_STARTED':
        setDeepStatus('running')
        addLog('info', 'Deep verification started · GitHub Actions is running JUnit tests...')
        break
      case 'DEEP_RESULT': {
        const result = msg.payload as DeepResult
        setDeepResults(result)
        setDeepStatus('done')
        addLog('success', `JUnit complete · ${result.passedCount}/${result.totalCount} tests passed · Score: ${result.deepScore}/100`)
        break
      }
      case 'ERROR':
        setDeepStatus('error')
        addLog('error', `Verification error: ${msg.payload}`)
        break
    }
  }, [addLog])

  const scheduleReconnect = useCallback(() => {
    if (retryRef.current) clearTimeout(retryRef.current)
    retryRef.current = setTimeout(() => {
      retryDelay.current = Math.min(retryDelay.current * 2, 30000)
      connect()
    }, retryDelay.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connect = useCallback(() => {
    if (!sessionId) return

    // Deactivate any existing client before creating a new one to avoid duplicate subscriptions
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
    }

    const wsUrl = `${apiUrl}/ws`
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as unknown as WebSocket,
      reconnectDelay: 0,
      onConnect: () => {
        setIsConnected(true)
        retryDelay.current = 1000
        if (!connectedOnce.current) {
          connectedOnce.current = true
          addLog('info', `Connected to session ${sessionId}`)
        }

        client.subscribe(`/topic/session/${sessionId}`, (msg) => {
          try {
            const data: WebSocketMsg = JSON.parse(msg.body)
            handleMessage(data)
          } catch {
            addLog('error', 'Failed to parse WebSocket message')
          }
        })

        // On every (re)connect: check DB in case DEEP_RESULT arrived while disconnected
        fetchDeepStatus()
      },
      onDisconnect: () => {
        setIsConnected(false)
        scheduleReconnect()
      },
      onStompError: () => {
        setIsConnected(false)
        scheduleReconnect()
      },
    })

    client.activate()
    clientRef.current = client
  }, [sessionId, addLog, handleMessage, fetchDeepStatus, scheduleReconnect])

  useEffect(() => {
    if (sessionId) connect()
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      clientRef.current?.deactivate()
    }
  }, [sessionId, connect])

  // Polling fallback: every 4s while deep eval is running, check the DB
  // Catches the case where DEEP_STARTED was received but DEEP_RESULT was missed
  useEffect(() => {
    if (deepStatus !== 'running') return
    const interval = setInterval(fetchDeepStatus, 4000)
    return () => clearInterval(interval)
  }, [deepStatus, fetchDeepStatus])

  // Safety net: if deep verification is still running after 5 minutes, fall back to
  // instant results. GitHub Actions typically finishes within 3–4 min.
  useEffect(() => {
    if (deepStatus !== 'running') return
    const timeout = setTimeout(() => {
      if (deepStatusRef.current === 'running') {
        setDeepStatus('error')
        addLog('warning', 'Deep verification timed out after 5 min — showing structural analysis')
      }
    }, 5 * 60 * 1000)
    return () => clearTimeout(timeout)
  }, [deepStatus, addLog])

  return { instantResults, deepResults, logs, deepStatus, isConnected }
}
