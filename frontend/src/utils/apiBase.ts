export function getApiBaseUrl() {
  const defaultUrl = process.env.NODE_ENV === 'production'
    ? 'https://pulsetoob-cms.onrender.com/api'
    : 'http://localhost:5000/api'
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || defaultUrl
  const baseUrl = rawUrl.replace(/\/+$/, '')
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
}
