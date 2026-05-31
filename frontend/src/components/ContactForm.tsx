'use client'

import { useState } from 'react'
import { getApiBaseUrl } from '@/utils/apiBase'

const API_URL = getApiBaseUrl()

const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100'

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: 'collaboration',
    subject: '',
    message: '',
    consent: false,
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [notice, setNotice] = useState('')

  const updateField = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    setNotice('')

    try {
      const response = await fetch(`${API_URL}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        const firstDetail = Array.isArray(result.details) ? result.details[0]?.message : null
        throw new Error(firstDetail || result.error || 'Message could not be sent')
      }

      setStatus('success')
      setNotice(result.message || 'Message received. Thank you.')
      setForm({
        name: '',
        email: '',
        topic: 'collaboration',
        subject: '',
        message: '',
        consent: false,
      })
    } catch (error: any) {
      setStatus('error')
      setNotice(error?.message || 'Message could not be sent right now.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Name
          <input
            className={`${inputClass} mt-1.5`}
            required
            minLength={2}
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Your name"
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Email
          <input
            className={`${inputClass} mt-1.5`}
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="you@example.com"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Topic
          <select
            className={`${inputClass} mt-1.5`}
            value={form.topic}
            onChange={(event) => updateField('topic', event.target.value)}
          >
            <option value="collaboration">Collaboration</option>
            <option value="advertising">Advertising</option>
            <option value="correction">Correction or feedback</option>
            <option value="story_tip">Story tip</option>
            <option value="general">General note</option>
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Subject
          <input
            className={`${inputClass} mt-1.5`}
            required
            minLength={4}
            value={form.subject}
            onChange={(event) => updateField('subject', event.target.value)}
            placeholder="What should we look at?"
          />
        </label>
      </div>

      <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
        Message
        <textarea
          className={`${inputClass} mt-1.5 min-h-[170px] resize-y leading-relaxed`}
          required
          minLength={20}
          value={form.message}
          onChange={(event) => updateField('message', event.target.value)}
          placeholder="Send a pitch, partnership idea, correction, audience tip, or note for the editorial desk."
        />
      </label>

      <label className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
        <input
          type="checkbox"
          required
          checked={form.consent}
          onChange={(event) => updateField('consent', event.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0"
        />
        <span>
          I understand that PulseToob may review, edit, decline, or follow up on submissions at its discretion. Sponsored or partner content must be clearly disclosed and will remain separate from independent editorial judgment.
        </span>
      </label>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 py-3 rounded-lg bg-green-700 text-white text-sm font-bold hover:bg-green-800 disabled:opacity-60"
        >
          {status === 'loading' ? 'Sending...' : 'Send Message'}
        </button>
        {notice && (
          <p className={`text-sm font-semibold ${status === 'error' ? 'text-red-700' : 'text-green-700'}`}>
            {notice}
          </p>
        )}
      </div>
    </form>
  )
}
