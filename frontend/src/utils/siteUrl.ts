const DEFAULT_SITE_URL = 'https://www.pulsetoob.com'

const PREFERRED_HOSTS: Record<string, string> = {
  'pulsetoob.com': 'www.pulsetoob.com',
}

export function normalizeSiteUrl(value?: string | null) {
  const rawValue = value?.trim() || DEFAULT_SITE_URL
  const withProtocol = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`

  try {
    const url = new URL(withProtocol)
    const preferredHost = PREFERRED_HOSTS[url.hostname.toLowerCase()]

    if (preferredHost) {
      url.hostname = preferredHost
    }

    url.pathname = ''
    url.search = ''
    url.hash = ''

    return url.toString().replace(/\/+$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function getSiteUrl() {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
}
