'use client'

import Link from 'next/link'

export default function ArticleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4">
      <div className="max-w-md text-center space-y-4">
        <p className="text-sm font-bold uppercase text-green-700">Temporary issue</p>
        <h1 className="text-3xl font-extrabold text-gray-950">Article unavailable</h1>
        <p className="text-sm text-gray-600">
          We could not reach the article service. Please try again shortly.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
