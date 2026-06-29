'use client'

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { ApiResponse, MediaAsset } from '@/types/cms'

interface ApiError {
  error?: string
  message?: string
}

interface MediaForm {
  title: string
  altText: string
  caption: string
  folder: string
  collection: string
  tags: string
  focalPointX: number
  focalPointY: number
}

const emptyForm: MediaForm = {
  title: '',
  altText: '',
  caption: '',
  folder: 'images',
  collection: '',
  tags: '',
  focalPointX: 0.5,
  focalPointY: 0.5,
}

export default function MediaPage() {
  const router = useRouter()
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('')
  const [folder, setFolder] = useState('')
  const [unusedOnly, setUnusedOnly] = useState(false)
  const [editing, setEditing] = useState<MediaAsset | null>(null)
  const [form, setForm] = useState<MediaForm>(emptyForm)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchMedia()
  }, [filter, folder, unusedOnly, router])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const params: { limit: number; type?: string; folder?: string; unused?: string } = { limit: 48 }
      if (filter) params.type = filter
      if (folder) params.folder = folder
      if (unusedOnly) params.unused = 'true'
      const res = await api.get<ApiResponse<MediaAsset[]>>('/media', { params })
      if (res.data.success) setMedia(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        formData.append('folder', folder || 'images')
        const isVideo = files[i].type.startsWith('video/')
        await api.post('/media/upload/' + (isVideo ? 'video' : 'image'), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      toast.success(files.length === 1 ? 'File uploaded' : `${files.length} files uploaded`)
      fetchMedia()
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const openEdit = (item: MediaAsset) => {
    setEditing(item)
    setForm({
      title: item.title || item.originalName || '',
      altText: item.altText || '',
      caption: item.caption || '',
      folder: item.folder || 'images',
      collection: item.collection || '',
      tags: item.tags?.join(', ') || '',
      focalPointX: item.focalPointX ?? 0.5,
      focalPointY: item.focalPointY ?? 0.5,
    })
  }

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editing) return

    try {
      const res = await api.put<ApiResponse<MediaAsset>>(`/media/${editing.id}`, form)
      if (res.data.success) {
        setEditing(null)
        toast.success('Media metadata saved')
        fetchMedia()
      }
    } catch (err) {
      const error = err as AxiosError<ApiError>
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Update failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media item?')) return
    try {
      await api.delete('/media/' + id)
      toast.success('Media deleted')
      fetchMedia()
    } catch (err) {
      const error = err as AxiosError<ApiError>
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Delete failed')
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500 mt-1">Manage folders, alt text, focal points, optimized variants, and unused assets.</p>
        </div>
        <div>
          <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" id="media-upload" />
          <label htmlFor="media-upload" className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium cursor-pointer transition-colors inline-block text-sm shadow-sm">
            {uploading ? 'Uploading...' : 'Upload Files'}
          </label>
        </div>
      </div>

      <div className="flex gap-3 border-b border-gray-200 pb-4 flex-wrap">
        {[
          { value: '', label: 'All Files' },
          { value: 'image', label: 'Images' },
          { value: 'video', label: 'Videos' },
        ].map((item) => (
          <button key={item.value} onClick={() => setFilter(item.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === item.value ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
            {item.label}
          </button>
        ))}
        <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Filter by folder" className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
        <label className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
          <input type="checkbox" checked={unusedOnly} onChange={(e) => setUnusedOnly(e.target.checked)} />
          Unused only
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No media files found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {media.map((item) => (
            <div key={item.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="aspect-square w-full bg-gray-50 relative flex items-center justify-center overflow-hidden">
                {item.type === 'image' ? (
                  <img src={item.thumbnailMedium || item.thumbnailUrl || item.url} alt={item.altText || item.originalName || ''} className="object-cover w-full h-full" style={{ objectPosition: `${(item.focalPointX ?? 0.5) * 100}% ${(item.focalPointY ?? 0.5) * 100}%` }} />
                ) : (
                  <div className="text-sm text-gray-500 font-semibold">Video</div>
                )}
                {item.needsAltText && <span className="absolute top-2 left-2 px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">Alt needed</span>}
                {item.usageCount === 0 && <span className="absolute top-2 right-2 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-bold">Unused</span>}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(item)} className="px-3 py-1 bg-white rounded-md text-gray-700 hover:bg-gray-100 text-xs font-semibold">Edit</button>
                  <button onClick={() => copyToClipboard(item.url)} className="px-3 py-1 bg-white rounded-md text-gray-700 hover:bg-gray-100 text-xs font-semibold">Copy</button>
                  <button onClick={() => handleDelete(item.id)} className="px-3 py-1 bg-red-600 rounded-md text-white hover:bg-red-700 text-xs font-semibold">Delete</button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-800 truncate" title={item.originalName}>{item.title || item.originalName}</p>
                <p className="text-[10px] text-gray-400 mt-1">{item.folder || 'images'} | {formatSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Media Metadata</h2>
              <button onClick={() => setEditing(null)} className="text-gray-500 text-xl">x</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-semibold text-gray-700">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full p-2 border rounded-lg" /></label>
                <label className="text-sm font-semibold text-gray-700">Alt text<input value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} className="mt-1 w-full p-2 border rounded-lg" /></label>
                <label className="text-sm font-semibold text-gray-700">Folder<input value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })} className="mt-1 w-full p-2 border rounded-lg" /></label>
                <label className="text-sm font-semibold text-gray-700">Collection<input value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })} className="mt-1 w-full p-2 border rounded-lg" /></label>
                <label className="text-sm font-semibold text-gray-700">Focal X<input type="number" min={0} max={1} step={0.01} value={form.focalPointX} onChange={(e) => setForm({ ...form, focalPointX: Number(e.target.value) })} className="mt-1 w-full p-2 border rounded-lg" /></label>
                <label className="text-sm font-semibold text-gray-700">Focal Y<input type="number" min={0} max={1} step={0.01} value={form.focalPointY} onChange={(e) => setForm({ ...form, focalPointY: Number(e.target.value) })} className="mt-1 w-full p-2 border rounded-lg" /></label>
              </div>
              <label className="block text-sm font-semibold text-gray-700">Caption<textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} rows={3} className="mt-1 w-full p-2 border rounded-lg" /></label>
              <label className="block text-sm font-semibold text-gray-700">Tags<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="mt-1 w-full p-2 border rounded-lg" placeholder="news, politics, homepage" /></label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">Save Metadata</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
