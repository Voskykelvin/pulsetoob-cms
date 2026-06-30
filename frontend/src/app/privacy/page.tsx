import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How PulseToob handles analytics, advertising, newsletter, contact, and cookie-related data.',
  alternates: { canonical: '/privacy' },
}

const sections = [
  {
    title: 'Information We Collect',
    body: [
      'PulseToob collects information you choose to submit, such as newsletter email addresses and contact form messages.',
      'The site also processes standard technical information such as page views, referral sources, browser/device signals, approximate location from network data, and interaction timing through analytics tools.',
    ],
  },
  {
    title: 'Analytics And Advertising',
    body: [
      'PulseToob uses internal analytics to understand article performance and site usage.',
      'PulseToob also uses Google Analytics and Google AdSense. These services may use cookies or similar technologies to measure usage, support advertising, and help improve the site experience.',
    ],
  },
  {
    title: 'Cookies And Consent',
    body: [
      'PulseToob uses a SecurePrivacy banner to provide cookie and privacy choices where applicable.',
      'Your browser may also provide controls for blocking, deleting, or limiting cookies.',
    ],
  },
  {
    title: 'How We Use Information',
    body: [
      'We use submitted information to respond to messages, manage newsletter signups, improve editorial decisions, monitor site reliability, measure audience interest, and support advertising operations.',
      'We do not sell contact form messages or newsletter submissions.',
    ],
  },
  {
    title: 'Data Retention',
    body: [
      'Newsletter subscriptions, contact messages, analytics records, and operational logs may be retained while they are useful for operating the site or meeting legal, security, and business needs.',
      'You can request removal of submitted contact or newsletter information by contacting PulseToob.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-950">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            PulseToob
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-gray-600">
            <Link href="/blog" className="hover:text-gray-950">All Stories</Link>
            <Link href="/search" className="hover:text-gray-950">Search</Link>
            <Link href="/about" className="hover:text-gray-950">About</Link>
            <Link href="/contact" className="hover:text-gray-950">Contact</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="border-b border-gray-200 pb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">Privacy</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600">
            This page explains how PulseToob handles data connected to reading, analytics, advertising, newsletter signup, and contact messages.
          </p>
          <p className="mt-3 text-xs font-semibold text-gray-400">Last updated: June 29, 2026</p>
        </header>

        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-extrabold text-gray-950">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-gray-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-lg border border-green-200 bg-green-50 p-6">
            <h2 className="text-lg font-extrabold text-green-950">Contact</h2>
            <p className="mt-3 text-sm leading-relaxed text-green-800">
              For privacy questions, corrections, or removal requests, contact PulseToob at{' '}
              <a href="mailto:kelvinvosky2@gmail.com" className="font-bold underline">
                kelvinvosky2@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
