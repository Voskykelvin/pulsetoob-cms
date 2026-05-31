import { getApiBaseUrl } from './apiBase'

export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const baseUrl = getApiBaseUrl().replace(/\/api$/, '')
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}
