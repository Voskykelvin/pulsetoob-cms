export function getApiBaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  const baseUrl = rawUrl.replace(/\/+$/, '')
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
}
