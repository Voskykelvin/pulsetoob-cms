import { getApiBaseUrl } from './apiBase'

export type AnalyticsEventType = 'page_view' | 'article_view' | 'share' | 'click' | 'scroll' | 'time_on_page' | 'bounce'

interface AnalyticsEventPayload {
  eventType: AnalyticsEventType
  articleId?: string | null
  duration?: number
  metadata?: Record<string, unknown>
}

const API_URL = getApiBaseUrl()
const VISITOR_KEY = 'pulse_visitor_id'
const SESSION_KEY = 'pulse_session_id'
const SESSION_STARTED_KEY = 'pulse_session_started_at'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

function createId(prefix: string) {
  const randomId = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
  return `${prefix}_${randomId}`
}

function getStoredId(storage: Storage, key: string, prefix: string) {
  let value = storage.getItem(key)
  if (!value) {
    value = createId(prefix)
    storage.setItem(key, value)
  }
  return value
}

function getIdentity() {
  const now = Date.now()
  const visitorId = getStoredId(window.localStorage, VISITOR_KEY, 'visitor')
  const sessionStartedAt = Number(window.sessionStorage.getItem(SESSION_STARTED_KEY) || 0)
  let sessionId = window.sessionStorage.getItem(SESSION_KEY)

  if (!sessionId || !sessionStartedAt || now - sessionStartedAt > SESSION_TIMEOUT_MS) {
    sessionId = createId('session')
    window.sessionStorage.setItem(SESSION_KEY, sessionId)
    window.sessionStorage.setItem(SESSION_STARTED_KEY, String(now))
  }

  return { visitorId, sessionId }
}

function getSafeIdentity() {
  try {
    return getIdentity()
  } catch {
    return {
      visitorId: createId('visitor'),
      sessionId: createId('session'),
    }
  }
}

function getTrafficSource() {
  const params = new URLSearchParams(window.location.search)
  const utmSource = params.get('utm_source')?.trim()
  const utmMedium = params.get('utm_medium')?.trim()
  const referrer = document.referrer || ''

  if (utmSource) {
    return {
      source: utmSource.toLowerCase(),
      medium: utmMedium?.toLowerCase() || 'campaign',
      referrer: referrer || undefined,
    }
  }

  if (referrer) {
    try {
      const referrerHost = new URL(referrer).hostname.replace(/^www\./, '')
      const currentHost = window.location.hostname.replace(/^www\./, '')

      if (referrerHost && referrerHost !== currentHost) {
        return { source: referrerHost, medium: 'referral', referrer }
      }
    } catch {
      return { source: 'referral', medium: 'referral', referrer }
    }
  }

  return { source: 'direct', medium: 'none', referrer: referrer || undefined }
}

export function trackAnalyticsEvent(payload: AnalyticsEventPayload) {
  if (typeof window === 'undefined') return

  const body = JSON.stringify({
    ...getSafeIdentity(),
    ...getTrafficSource(),
    eventType: payload.eventType,
    articleId: payload.articleId || null,
    duration: payload.duration,
    metadata: {
      path: window.location.pathname,
      query: window.location.search,
      title: document.title,
      ...payload.metadata,
    },
  })

  fetch(`${API_URL}/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch((error) => {
    console.error('Analytics event failed:', error)
  })
}
