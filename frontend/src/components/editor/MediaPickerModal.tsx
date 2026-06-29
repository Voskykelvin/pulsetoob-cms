'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/utils/apiError'
import type { ApiResponse, MediaAsset } from '@/types/cms'

interface MediaPickerModalProps {
  title?: string
  onClose: () => void
  onSelect: (asset: MediaAsset) => void
}

export default function MediaPickerModal({
  title = 'Choose Image',
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchMedia = async () => {
      try {
        setLoading(true)
        const res = await api.get<ApiResponse<MediaAsset[]>>('/media', {
          params: {
            type: 'image',
            limit: 48,
            search: search || undefined,
          },
        })
        if (!cancelled && res.data.success) setMedia(res.data.data)
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, 'Could not load media library'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const timer = window.setTimeout(fetchMedia, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [search])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-950">{title}</h2>
            <p className="text-xs text-gray-500">Reuse an existing image from the PulseToob media library.</p>
          </div>
          <div className="flex gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search media..."
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-green-600"
            />
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[66vh] overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="aspect-square animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No images found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {media.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelect(asset)}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm transition hover:border-green-400 hover:shadow"
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={asset.thumbnailMedium || asset.thumbnailUrl || asset.url}
                      alt={asset.altText || asset.title || asset.originalName || ''}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `${(asset.focalPointX ?? 0.5) * 100}% ${(asset.focalPointY ?? 0.5) * 100}%` }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-bold text-gray-800">{asset.title || asset.originalName || 'Untitled image'}</p>
                    <p className="mt-1 truncate text-[10px] text-gray-400">{asset.altText || 'Alt text missing'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
