'use client'

import { useEffect } from 'react'
import { getApiBaseUrl } from '@/utils/apiBase'

const API_URL = getApiBaseUrl()

export default function ArticleViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return

    fetch(`${API_URL}/articles/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to track article view:', error)
    })
  }, [slug])

  return null
}
