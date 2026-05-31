import type { Metadata } from 'next'
import Script from 'next/script'
import SiteAnalyticsTracker from '@/components/SiteAnalyticsTracker'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pulsetoob.com'),
  title: {
    default: 'PulseToob',
    template: '%s | PulseToob',
  },
  description: 'Breaking stories, entertainment, lifestyle and trending content',
  applicationName: 'PulseToob',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    siteName: 'PulseToob',
    title: 'PulseToob',
    description: 'Breaking stories, entertainment, lifestyle and trending content',
    url: 'https://www.pulsetoob.com',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

  return (
    <html lang="en">
      <body>
        {adsenseClient && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <SiteAnalyticsTracker />
        {children}
      </body>
    </html>
  )
}
