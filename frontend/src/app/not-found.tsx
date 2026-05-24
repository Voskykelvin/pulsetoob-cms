import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4">
      <div className="max-w-md text-center space-y-4">
        <p className="text-sm font-bold uppercase text-green-700">404</p>
        <h1 className="text-3xl font-extrabold text-gray-950">Page not found</h1>
        <p className="text-sm text-gray-600">The page you are looking for may have moved, or the link may be outdated.</p>
        <Link href="/" className="inline-flex px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700">
          Go Home
        </Link>
      </div>
    </main>
  )
}
