'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/utils/apiError'
import type { ApiResponse, ContactMessage, NewsletterSubscriber } from '@/types/cms'

type AudienceTab = 'subscribers' | 'messages'

const messageStatusStyles: Record<ContactMessage['status'], string> = {
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  reviewed: 'bg-green-50 text-green-700 border-green-200',
  archived: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function AudiencePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AudienceTab>('subscribers')
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchAudience()
  }, [router])

  const filteredSubscribers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return subscribers
    return subscribers.filter((subscriber) => subscriber.email.toLowerCase().includes(needle))
  }, [search, subscribers])

  const filteredMessages = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return messages
    return messages.filter((message) => (
      message.name.toLowerCase().includes(needle) ||
      message.email.toLowerCase().includes(needle) ||
      message.subject.toLowerCase().includes(needle)
    ))
  }, [search, messages])

  const fetchAudience = async () => {
    try {
      setLoading(true)
      const [subscribersRes, messagesRes] = await Promise.all([
        api.get<ApiResponse<NewsletterSubscriber[]>>('/admin/newsletter/subscribers', { params: { limit: 100 } }),
        api.get<ApiResponse<ContactMessage[]>>('/admin/contact-messages', { params: { limit: 100 } }),
      ])
      if (subscribersRes.data.success) setSubscribers(subscribersRes.data.data)
      if (messagesRes.data.success) setMessages(messagesRes.data.data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load audience data'))
    } finally {
      setLoading(false)
    }
  }

  const updateSubscriberStatus = async (subscriber: NewsletterSubscriber) => {
    const nextStatus = subscriber.status === 'active' ? 'unsubscribed' : 'active'
    try {
      await api.put(`/admin/newsletter/subscribers/${subscriber.id}`, { status: nextStatus })
      toast.success(nextStatus === 'active' ? 'Subscriber reactivated' : 'Subscriber unsubscribed')
      fetchAudience()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update subscriber'))
    }
  }

  const updateMessageStatus = async (message: ContactMessage, status: ContactMessage['status']) => {
    try {
      await api.put(`/admin/contact-messages/${message.id}`, { status })
      toast.success('Message updated')
      fetchAudience()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update message'))
    }
  }

  const copySubscriberEmails = async () => {
    const emails = filteredSubscribers.filter((subscriber) => subscriber.status === 'active').map((subscriber) => subscriber.email)
    if (emails.length === 0) return toast.error('No active subscriber emails to copy')
    await navigator.clipboard.writeText(emails.join(', '))
    toast.success(`${emails.length} email(s) copied`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audience</h1>
          <p className="text-sm text-gray-500 mt-1">Review newsletter signups and contact messages from the public site.</p>
        </div>
        <button
          type="button"
          onClick={copySubscriberEmails}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Copy Active Emails
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Subscribers</p>
          <p className="mt-2 text-2xl font-extrabold text-gray-950">{subscribers.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Active Emails</p>
          <p className="mt-2 text-2xl font-extrabold text-green-700">{subscribers.filter((item) => item.status === 'active').length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">New Messages</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-700">{messages.filter((item) => item.status === 'new').length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex rounded-lg bg-gray-100 p-1">
          {[
            { id: 'subscribers' as const, label: 'Subscribers' },
            { id: 'messages' as const, label: 'Messages' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search audience..."
          className="min-w-[220px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading audience data...</div>
        ) : activeTab === 'subscribers' ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="p-4 text-xs font-bold uppercase text-gray-500">Email</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500">Source</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500">Status</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500">Joined</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-sm text-gray-400">No subscribers found.</td></tr>
              ) : filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-gray-100 text-sm">
                  <td className="p-4 font-semibold text-gray-900">{subscriber.email}</td>
                  <td className="p-4 text-gray-500">{subscriber.source || 'site'}</td>
                  <td className="p-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${subscriber.status === 'active' ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                      {subscriber.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{new Date(subscriber.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => updateSubscriberStatus(subscriber)}
                      className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {subscriber.status === 'active' ? 'Unsubscribe' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMessages.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">No contact messages found.</div>
            ) : filteredMessages.map((message) => (
              <article key={message.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-gray-950">{message.subject}</h2>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${messageStatusStyles[message.status]}`}>
                        {message.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {message.name} &lt;{message.email}&gt; - {message.topic} - {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <select
                    value={message.status}
                    onChange={(event) => updateMessageStatus(message, event.target.value as ContactMessage['status'])}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{message.message}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
