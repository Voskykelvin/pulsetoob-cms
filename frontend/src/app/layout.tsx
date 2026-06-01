import type { Metadata } from 'next'
import SiteAnalyticsTracker from '@/components/SiteAnalyticsTracker'
import { ADSENSE_CLIENT } from '@/utils/adsense'
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
  return (
    <html lang="en">
      <head>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>
        <SiteAnalyticsTracker />
        {children}
      </body>
    </html>
  )
}
