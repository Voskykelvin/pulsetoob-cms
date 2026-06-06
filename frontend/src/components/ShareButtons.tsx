'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Facebook, Linkedin, Mail, Share2, X } from 'lucide-react'
import { trackAnalyticsEvent } from '@/utils/analytics'

interface ShareButtonsProps {
  articleId: string
  title: string
  url: string
  description?: string | null
}

type SharePlatform = 'native' | 'copy' | 'email' | 'facebook' | 'x' | 'linkedin'

export default function ShareButtons({ articleId, title, url, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || title)

  const shareLinks = useMemo(
    () => [
      {
        name: 'Email',
        platform: 'email' as SharePlatform,
        href: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
        icon: Mail,
        className: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
      },
      {
        name: 'Facebook',
        platform: 'facebook' as SharePlatform,
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        icon: Facebook,
        className: 'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
      },
      {
        name: 'X',
        platform: 'x' as SharePlatform,
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        icon: X,
        className: 'hover:border-gray-900 hover:bg-gray-950 hover:text-white',
      },
      {
        name: 'LinkedIn',
        platform: 'linkedin' as SharePlatform,
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        icon: Linkedin,
        className: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700',
      },
    ],
    [encodedDescription, encodedTitle, encodedUrl]
  )

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    if (!copied) return

    const timeout = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timeout)
  }, [copied])

  function trackShare(platform: SharePlatform) {
    trackAnalyticsEvent({
      eventType: 'share',
      articleId,
      metadata: { platform, url },
    })
  }

  async function handleNativeShare() {
    try {
      await navigator.share({
        title,
        text: description || title,
        url,
      })
      trackShare('native')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      await handleCopy()
    }
  }

  async function handleCopy(platform: SharePlatform = 'copy') {
    trackShare(platform)

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      window.prompt('Copy this article link', url)
    }
  }

  return (
    <section className="mt-10 border-y border-gray-200 py-5" aria-label="Share this article">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-extrabold text-gray-950">Share this article</h2>
        <div className="flex flex-wrap items-center gap-2">
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
              aria-label="Share with device"
              title="Share with device"
            >
              <Share2 size={19} aria-hidden="true" />
            </button>
          )}

          {shareLinks.map(({ name, platform, href, icon: Icon, className }) => (
            <a
              key={platform}
              href={href}
              target={platform === 'email' ? undefined : '_blank'}
              rel={platform === 'email' ? undefined : 'noopener noreferrer'}
              onClick={() => trackShare(platform)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 ${className}`}
              aria-label={`Share on ${name}`}
              title={`Share on ${name}`}
            >
              <Icon size={19} aria-hidden="true" />
            </a>
          ))}

          <button
            type="button"
            onClick={() => handleCopy()}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
            aria-label={copied ? 'Article link copied' : 'Copy article link'}
            title={copied ? 'Copied' : 'Copy link'}
          >
            {copied ? <Check size={19} aria-hidden="true" /> : <Copy size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </section>
  )
}
