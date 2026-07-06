'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { ApiResponse, CmsUser, MediaAsset, UserAvatar } from '@/types/cms'
import { getAuthorAvatarUrl, getAuthorInitials, getAuthorName } from '@/utils/author'

interface ApiError {
  error?: string
  message?: string
}

interface ProfileSocialLinks {
  twitter: string
  linkedin: string
  facebook: string
  instagram: string
  website: string
}

interface ProfileForm {
  firstName: string
  lastName: string
  bio: string
  avatar: string | UserAvatar | null
  socialLinks: ProfileSocialLinks
}

const emptySocialLinks: ProfileSocialLinks = {
  twitter: '',
  linkedin: '',
  facebook: '',
  instagram: '',
  website: '',
}

const emptyForm: ProfileForm = {
  firstName: '',
  lastName: '',
  bio: '',
  avatar: null,
  socialLinks: emptySocialLinks,
}

function toProfileForm(user: CmsUser): ProfileForm {
  const socialLinks = user.socialLinks || {}

  return {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    bio: user.bio || '',
    avatar: user.avatar || null,
    socialLinks: {
      twitter: socialLinks.twitter || '',
      linkedin: socialLinks.linkedin || '',
      facebook: socialLinks.facebook || '',
      instagram: socialLinks.instagram || '',
      website: socialLinks.website || '',
    },
  }
}

function cleanSocialLinks(socialLinks: ProfileSocialLinks) {
  return Object.fromEntries(
    Object.entries(socialLinks).map(([key, value]) => [key, value.trim() || null])
  )
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.error || axiosError.response?.data?.message || fallback
}

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<CmsUser | null>(null)
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get<ApiResponse<CmsUser>>('/auth/me')
        if (res.data.success) {
          setUser(res.data.data)
          setForm(toProfileForm(res.data.data))
          localStorage.setItem('user', JSON.stringify(res.data.data))
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Could not load your profile'))
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const previewAuthor = useMemo(() => ({
    id: user?.id || '',
    username: user?.username || '',
    firstName: form.firstName,
    lastName: form.lastName,
    avatar: form.avatar,
    bio: form.bio,
  }), [form, user])

  const authorName = getAuthorName(previewAuthor, 'PulseToob Author')
  const avatarUrl = getAuthorAvatarUrl(previewAuthor)

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'authors')
      formData.append('collection', 'author-profiles')
      formData.append('altText', `${authorName} profile photo`)
      formData.append('title', `${authorName} portrait`)

      const res = await api.post<ApiResponse<MediaAsset>>('/media/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const asset = res.data.data
      setForm((current) => ({
        ...current,
        avatar: {
          url: asset.url,
          thumbnailUrl: asset.thumbnailUrl || asset.thumbnailMedium || asset.url,
          thumbnailSmall: asset.thumbnailSmall,
          thumbnailMedium: asset.thumbnailMedium,
          thumbnailLarge: asset.thumbnailLarge,
          altText: asset.altText || `${authorName} profile photo`,
        },
      }))
      toast.success('Profile picture uploaded')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Profile picture upload failed'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar,
        socialLinks: cleanSocialLinks(form.socialLinks),
      }

      const res = await api.patch<ApiResponse<CmsUser>>('/auth/profile', payload)
      if (res.data.success) {
        setUser(res.data.data)
        setForm(toProfileForm(res.data.data))
        localStorage.setItem('user', JSON.stringify(res.data.data))
        toast.success('Author profile saved')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save profile'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading profile...</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Author Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage the name, summary, portrait, and links readers see on your byline page.</p>
        </div>
        {user?.id && (
          <Link
            href={`/author/${user.id}`}
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
          >
            View Public Page
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border border-green-100 bg-green-50">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${authorName} profile`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-green-700">
                  {getAuthorInitials(previewAuthor, 'PT')}
                </div>
              )}
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-gray-950">{authorName}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {form.bio || 'Add a short profile summary so readers know the person behind the story.'}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {Object.entries(form.socialLinks).filter(([, value]) => value.trim()).map(([key]) => (
                <span key={key} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
                  {key}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-5">
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">Public Name</h2>
              <p className="mt-1 text-xs text-gray-500">This becomes the clickable byline on published articles.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700">
                First name
                <input
                  value={form.firstName}
                  onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-green-500"
                />
              </label>
              <label className="text-sm font-semibold text-gray-700">
                Last name
                <input
                  value={form.lastName}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-green-500"
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-5">
            <div>
              <h2 className="text-base font-bold text-gray-950">Profile Picture</h2>
              <p className="mt-1 text-xs text-gray-500">Use a clear headshot or publication-approved portrait.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="author-avatar-upload" />
              <label
                htmlFor="author-avatar-upload"
                className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                {uploading ? 'Uploading...' : 'Upload Picture'}
              </label>
              {form.avatar && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, avatar: null })}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Remove Picture
                </button>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-5">
            <div>
              <h2 className="text-base font-bold text-gray-950">Profile Summary</h2>
              <p className="mt-1 text-xs text-gray-500">A concise bio appears on your author page and below reader-facing profile metadata.</p>
            </div>
            <label className="block text-sm font-semibold text-gray-700">
              Bio
              <textarea
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                rows={5}
                maxLength={700}
                className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 text-sm leading-relaxed outline-none focus:border-green-500"
              />
            </label>
            <p className="text-right text-xs text-gray-400">{form.bio.length}/700</p>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-5">
            <div>
              <h2 className="text-base font-bold text-gray-950">Profile Links</h2>
              <p className="mt-1 text-xs text-gray-500">Optional links appear on your public author page.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(['website', 'twitter', 'linkedin', 'facebook', 'instagram'] as const).map((key) => (
                <label key={key} className="text-sm font-semibold capitalize text-gray-700">
                  {key}
                  <input
                    type="url"
                    value={form.socialLinks[key] || ''}
                    onChange={(event) => setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, [key]: event.target.value },
                    })}
                    placeholder="https://"
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 text-sm normal-case outline-none focus:border-green-500"
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
