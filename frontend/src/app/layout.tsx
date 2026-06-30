import type { Metadata } from 'next'
import Script from 'next/script'
import JsonLd from '@/components/JsonLd'
import SiteAnalyticsTracker from '@/components/SiteAnalyticsTracker'
import ToastProvider from '@/components/ToastProvider'
import { ADSENSE_CLIENT } from '@/utils/adsense'
import './globals.css'

const GA_MEASUREMENT_ID = 'G-WSWVPG42ZF'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pulsetoob.com').replace(/\/+$/, '')
const RSS_FEED_URL = `${SITE_URL}/api/rss/feed`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PulseToob',
    template: '%s | PulseToob',
  },
  description: 'Breaking stories, entertainment, lifestyle and trending content',
  applicationName: 'PulseToob',
  keywords: ['PulseToob', 'entertainment news', 'lifestyle stories', 'music stories', 'movies', 'sports', 'culture'],
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': RSS_FEED_URL,
    },
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    siteName: 'PulseToob',
    title: 'PulseToob',
    description: 'Breaking stories, entertainment, lifestyle and trending content',
    url: SITE_URL,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'PulseToob',
    description: 'Breaking stories, entertainment, lifestyle and trending content',
  },
}

const siteSchema = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PulseToob',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PulseToob',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/rss+xml" title="PulseToob RSS Feed" href={RSS_FEED_URL} />
        <JsonLd data={siteSchema} />
        <Script
          id="secureprivacy-banner"
          src="https://app.secureprivacy.ai/script/6a427b4c50650fd51e3e920f.js"
          strategy="beforeInteractive"
        />
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>
        <SiteAnalyticsTracker />
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
