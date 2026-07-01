'use client'

import { useEffect, useState } from 'react'
import { getImageUrl } from '@/utils/imageUrl'
import { getApiBaseUrl } from '@/utils/apiBase'
import type { AdSlotName, Advertisement, ApiResponse } from '@/types/cms'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

interface AdSlotProps {
  slot: AdSlotName
  adsenseClient?: string
  adsenseSlot?: string
}

const API_URL = getApiBaseUrl()
const AD_REQUEST_TIMEOUT_MS = 5000

export default function AdSlot({ slot, adsenseClient, adsenseSlot }: AdSlotProps) {
  const [ad, setAd] = useState<Advertisement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchAd = async () => {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), AD_REQUEST_TIMEOUT_MS)

      try {
        const res = await fetch(`${API_URL}/ads/${slot}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const result = await res.json() as ApiResponse<Advertisement | null>

        if (!cancelled && result.success && result.data) {
          setAd(result.data)
          fetch(`${API_URL}/ads/${result.data.id}/impression`, { method: 'POST', keepalive: true }).catch(() => {})
        }
      } catch (err) {
        console.error('Failed to load advertisement slot:', err)
      } finally {
        window.clearTimeout(timeout)
        if (!cancelled) setLoading(false)
      }
    }

    fetchAd()

    return () => {
      cancelled = true
    }
  }, [slot])

  useEffect(() => {
    if (!loading && !ad && adsenseClient && adsenseSlot) {
      try {
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
      } catch (err) {
        console.error('AdSense script error:', err)
      }
    }
  }, [ad, adsenseClient, adsenseSlot, loading])

  const handleAdClick = () => {
    if (!ad) return
    fetch(`${API_URL}/ads/${ad.id}/click`, { method: 'POST', keepalive: true }).catch(() => {})
  }

  if (loading) {
    return <div className={`ad-placeholder loading ${slot}`} aria-hidden="true" data-ad-slot={slot} />
  }

  if (ad) {
    const formattedImageUrl = getImageUrl(ad.imageUrl)

    return (
      <div className={`direct-ad-container ${slot}`} role="complementary" aria-label="Sponsored placement" data-ad-slot={slot}>
        <span className="ad-badge">Sponsored</span>
        <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={handleAdClick}>
          <div className="ad-image-wrapper">
            {formattedImageUrl && <img src={formattedImageUrl} alt={ad.title} />}
          </div>
        </a>
      </div>
    )
  }

  if (adsenseClient && adsenseSlot) {
    return (
      <div className={`adsense-ad-container ${slot}`} role="complementary" aria-label="Advertisement" data-ad-slot={slot}>
        <span className="ad-badge">Advertisement</span>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseClient}
          data-ad-slot={adsenseSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    )
  }

  return null
}
