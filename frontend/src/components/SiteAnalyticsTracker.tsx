'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackAnalyticsEvent } from '@/utils/analytics'

const EXCLUDED_PREFIXES = ['/admin', '/login']
const MIN_DURATION_SECONDS = 2
const BOUNCE_SECONDS = 10

function shouldTrackPath(pathname: string) {
  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false
  if (pathname.startsWith('/article/')) return false
  return true
}

export default function SiteAnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || !shouldTrackPath(pathname)) return

    const startedAt = Date.now()
    let sentDuration = false

    trackAnalyticsEvent({
      eventType: 'page_view',
      metadata: {
        pageType: pathname === '/' ? 'home' : 'public',
      },
    })

    const sendDuration = () => {
      if (sentDuration) return
      sentDuration = true

      const duration = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      if (duration >= MIN_DURATION_SECONDS) {
        trackAnalyticsEvent({
          eventType: 'time_on_page',
          duration,
          metadata: { path: pathname, pageType: pathname === '/' ? 'home' : 'public' },
        })
      }

      if (duration < BOUNCE_SECONDS) {
        trackAnalyticsEvent({
          eventType: 'bounce',
          duration,
          metadata: { path: pathname, pageType: pathname === '/' ? 'home' : 'public' },
        })
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') sendDuration()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', sendDuration)

    return () => {
      sendDuration()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', sendDuration)
    }
  }, [pathname])

  return null
}
