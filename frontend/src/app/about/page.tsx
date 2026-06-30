import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import { getSiteUrl } from '@/lib/publicContent'

export const metadata: Metadata = {
  title: 'About PulseToob',
  description: 'Learn about PulseToob, our editorial standards, corrections process, privacy posture, and reader contact channels.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About PulseToob',
    description: 'PulseToob covers entertainment, lifestyle, culture, sports, finance, education, and internet-led stories with an editorial-first CMS.',
    url: '/about',
    type: 'website',
  },
}

const standards = [
  {
    title: 'Editorial Independence',
    copy: 'Coverage decisions are made for reader value, timeliness, accuracy, and cultural relevance. Sponsored work should be labeled clearly when it appears.',
  },
  {
    title: 'Corrections',
    copy: 'Readers can send correction requests through the contact page. When a material issue is confirmed, the article should be updated promptly.',
  },
  {
    title: 'Attribution',
    copy: 'PulseToob aims to credit sources, people, images, and context clearly so readers can understand where information and media come from.',
  },
  {
    title: 'Reader Privacy',
    copy: 'PulseToob publishes a privacy policy covering analytics, advertising, newsletter signup, contact messages, cookies, and consent tooling.',
  },
]

export default function AboutPage() {
  const siteUrl = getSiteUrl()
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About PulseToob',
      url: `${siteUrl}/about`,
      isPartOf: {
        '@type': 'WebSite',
        name: 'PulseToob',
        url: siteUrl,
      },
      mainEntity: {
        '@type': 'Organization',
        name: 'PulseToob',
        url: siteUrl,
        sameAs: [siteUrl],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'About', item: `${siteUrl}/about` },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-950">
      <JsonLd data={schema} />
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            PulseToob
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-gray-600">
            <Link href="/blog" className="hover:text-gray-950">All Stories</Link>
            <Link href="/search" className="hover:text-gray-950">Search</Link>
            <Link href="/privacy" className="hover:text-gray-950">Privacy</Link>
            <Link href="/contact" className="hover:text-gray-950">Contact</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="border-b border-gray-200 pb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">About</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">PulseToob is a reader-first digital publication.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">
            PulseToob covers entertainment, lifestyle, culture, sports, finance, education, and internet-led stories through a custom CMS built for fast publishing, clean article pages, RSS distribution, analytics, and editorial control.
          </p>
          <p className="mt-3 text-xs font-semibold text-gray-400">Last updated: July 1, 2026</p>
        </header>

        <section className="grid gap-5 py-10 md:grid-cols-2">
          {standards.map((item) => (
            <article key={item.title} className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-base font-extrabold text-gray-950">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.copy}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-8 border-t border-gray-200 py-10 md:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold tracking-tight">Privacy, consent, and reader data</h2>
            <p className="text-sm leading-relaxed text-gray-600">
              PulseToob uses analytics, advertising, newsletter signup, contact forms, and a SecurePrivacy banner. The full privacy policy explains what data may be processed, why it is used, and how readers can contact PulseToob for privacy requests.
            </p>
            <Link href="/privacy" className="inline-flex rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800">
              Read Privacy Policy
            </Link>
          </div>

          <aside className="rounded-lg border border-green-200 bg-green-50 p-5">
            <h2 className="text-sm font-extrabold text-green-950">Corrections and contact</h2>
            <p className="mt-2 text-sm leading-relaxed text-green-800">
              Send corrections, story tips, collaboration ideas, and advertising inquiries through the public contact page.
            </p>
            <Link href="/contact" className="mt-4 inline-flex text-sm font-bold text-green-900 underline">
              Contact PulseToob
            </Link>
          </aside>
        </section>
      </main>
    </div>
  )
}
