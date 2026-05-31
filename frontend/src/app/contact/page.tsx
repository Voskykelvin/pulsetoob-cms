import type { Metadata } from 'next'
import Link from 'next/link'
import ContactForm from '@/components/ContactForm'
import NewsletterSignup from '@/components/NewsletterSignup'

const CONTACT_EMAIL = 'kelvinvosky2@gmail.com'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact PulseToob for collaborations, advertising, corrections, story tips, and editorial feedback.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-950">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            PulseToob
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-gray-600">
            <Link href="/blog" className="hover:text-gray-950">All Stories</Link>
            <Link href="/contact" className="text-green-700">Contact</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-7">
            <div className="space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">
                Work With PulseToob
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Send us the signal. We will follow the pulse.
              </h1>
              <p className="text-gray-600 leading-relaxed">
                PulseToob is open to smart collaborators: writers with sharp angles, brands with audience-fit campaigns, readers with corrections, and people who notice culture before it becomes obvious.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Direct Email</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-lg font-bold text-green-700 hover:underline">
                {CONTACT_EMAIL}
              </a>
              <p className="text-sm text-gray-500 leading-relaxed">
                Use the form for structured submissions, or email directly if you need to include attachments, decks, or longer pitch material.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['Editorial tips', 'Corrections, context, new angles, and leads worth checking.'],
                ['Collaborators', 'Writers, researchers, photographers, and creators with a distinct voice.'],
                ['Advertising', 'Campaigns, placements, and sponsor ideas that fit the audience.'],
                ['Transparency', 'Sponsored work is labeled. Editorial decisions stay independent.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-lg border border-gray-200 bg-white p-4">
                  <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">{copy}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-5">
              <h2 className="text-sm font-extrabold text-green-950">Stay close to the next wave</h2>
              <p className="text-sm text-green-800 mt-2">
                Get the weekly PulseToob digest while we build the editorial network.
              </p>
              <div className="mt-4">
                <NewsletterSignup compact />
              </div>
            </div>
          </div>

          <section className="lg:col-span-7 rounded-lg border border-gray-200 bg-white p-5 sm:p-7 shadow-sm">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-extrabold">Contact Form</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tell us who you are, what you are proposing, and why it belongs on PulseToob. Clear pitches beat loud pitches.
              </p>
            </div>
            <ContactForm />
          </section>
        </section>
      </main>
    </div>
  )
}
