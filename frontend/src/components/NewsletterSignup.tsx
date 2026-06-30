'use client'

import { useState } from 'react'
import { getApiBaseUrl } from '@/utils/apiBase'

const API_URL = getApiBaseUrl()

export default function NewsletterSignup({
  compact = false,
  source,
}: {
  compact?: boolean
  source?: string
}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/public/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: source || (compact ? 'contact_page' : 'homepage') }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        const firstDetail = Array.isArray(result.details) ? result.details[0]?.message : null
        throw new Error(firstDetail || result.error || 'Signup failed')
      }

      setStatus('success')
      setMessage(result.message || 'You are on the PulseToob list.')
      setEmail('')
    } catch (error: any) {
      setStatus('error')
      setMessage(error?.message || 'Could not subscribe right now.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className={compact ? 'space-y-2' : 'flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2'}>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          className="w-full px-4 py-3 text-sm rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-black shadow-inner"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow transition-all whitespace-nowrap disabled:opacity-60"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
        </button>
      </div>
      {message && (
        <p className={`text-xs font-semibold ${status === 'error' ? 'text-red-700' : 'text-green-800'}`}>
          {message}
        </p>
      )}
    </form>
  )
}
