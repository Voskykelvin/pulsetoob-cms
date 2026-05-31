'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/utils/apiError'

interface SettingsState {
  siteName: string;
  siteUrl: string;
  postsPerPage: number;
  allowComments: boolean;
  enableRss: boolean;
  msn?: {
    enable: boolean;
    feedUrl: string;
  };
}

const DEFAULT_SETTINGS: SettingsState = {
  siteName: 'PulseToob',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pulsetoob.com',
  postsPerPage: 12,
  allowComments: true,
  enableRss: true,
  msn: {
    enable: false,
    feedUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pulsetoob.com'}/api/rss/msn`,
  },
}

function normalizeSettings(data: any): SettingsState {
  const siteUrl = data?.siteUrl || data?.site?.url || DEFAULT_SETTINGS.siteUrl
  const msnEnabled = data?.msn?.enable ?? data?.msn?.enabled ?? DEFAULT_SETTINGS.msn?.enable

  return {
    siteName: data?.siteName || data?.site?.name || DEFAULT_SETTINGS.siteName,
    siteUrl,
    postsPerPage: Number(data?.postsPerPage ?? data?.content?.postsPerPage ?? DEFAULT_SETTINGS.postsPerPage),
    allowComments: Boolean(data?.allowComments ?? data?.content?.allowComments ?? DEFAULT_SETTINGS.allowComments),
    enableRss: Boolean(data?.enableRss ?? data?.rss?.enabled ?? DEFAULT_SETTINGS.enableRss),
    msn: {
      enable: Boolean(msnEnabled),
      feedUrl: data?.msn?.feedUrl || `${siteUrl.replace(/\/+$/, '')}/api/rss/msn`,
    },
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/login')
      return
    }
    void fetchSettings()
  }, [router])

  const fetchSettings = async () => {
    try {
      setError('')
      const res = await api.get('/admin/settings')
      if (res.data.success) {
        setSettings(normalizeSettings(res.data.data))
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      setError(getApiErrorMessage(err, 'Failed to load settings.'))
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    try {
      const res = await api.put('/admin/settings', settings)
      if (res.data.success) {
        setSettings(normalizeSettings(res.data.data || settings))
        alert('Settings saved successfully!')
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert(getApiErrorMessage(err, 'Failed to save settings.'))
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      [key]: value
    })
  }

  const handleMsnChange = (key: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      msn: {
        ...settings.msn,
        [key]: value
      } as any
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">
              {error}
            </div>
          )}

          {/* Site Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Site Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Site Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                  value={settings?.siteName || ''}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Site URL</label>
                <input
                  type="url"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                  value={settings?.siteUrl || ''}
                  onChange={(e) => handleChange('siteUrl', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Content Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Content Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Posts Per Page</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                  value={settings?.postsPerPage || 10}
                  onChange={(e) => handleChange('postsPerPage', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowComments"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={settings?.allowComments || false}
                  onChange={(e) => handleChange('allowComments', e.target.checked)}
                />
                <label htmlFor="allowComments" className="ml-2 block text-sm text-gray-600">
                  Allow Comments
                </label>
              </div>
            </div>
          </div>

          {/* RSS Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">RSS Settings</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableRss"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={settings?.enableRss || false}
                onChange={(e) => handleChange('enableRss', e.target.checked)}
              />
              <label htmlFor="enableRss" className="ml-2 block text-sm text-gray-600">
                Enable RSS Feeds
              </label>
            </div>
          </div>

          {/* MSN Integration */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">MSN Integration</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableMsn"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={settings?.msn?.enable || false}
                  onChange={(e) => handleMsnChange('enable', e.target.checked)}
                />
                <label htmlFor="enableMsn" className="ml-2 block text-sm text-gray-600">
                  Enable MSN Feed
                </label>
              </div>
              {settings?.msn?.feedUrl && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
                  <span className="font-semibold">Feed URL:</span> {settings.msn.feedUrl}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow transition duration-150 disabled:bg-blue-400"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
