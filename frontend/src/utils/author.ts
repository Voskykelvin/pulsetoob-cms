import { getImageUrl } from './imageUrl'
import type { UserAvatar } from '@/types/cms'

export interface AuthorNameSource {
  username?: string | null
  firstName?: string | null
  lastName?: string | null
}

export interface AuthorAvatarSource {
  avatar?: UserAvatar | string | null
}

export function cleanAuthorName(value?: string | null) {
  const name = value?.trim()
  if (!name) return ''

  return name
    .replace(/\s*@pulsetoob(?:\.com)?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getAuthorName(author?: AuthorNameSource | null, fallback = 'PulseToob') {
  const fullName = cleanAuthorName([author?.firstName, author?.lastName].filter(Boolean).join(' '))
  const username = cleanAuthorName(author?.username)

  return fullName || username || fallback
}

export function getAuthorInitials(author?: AuthorNameSource | null, fallback = 'PT') {
  const name = getAuthorName(author, fallback)
  const words = name.split(/\s+/).filter(Boolean)
  const initials = words.length > 1 ? `${words[0][0]}${words[1][0]}` : name.slice(0, 2)

  return initials.toUpperCase()
}

export function getAuthorAvatarUrl(author?: AuthorAvatarSource | null) {
  const avatar = author?.avatar
  if (!avatar) return null

  if (typeof avatar === 'string') return getImageUrl(avatar)

  return getImageUrl(
    avatar.thumbnailUrl ||
    avatar.thumbnailMedium ||
    avatar.thumbnailSmall ||
    avatar.thumbnailLarge ||
    avatar.url ||
    null
  )
}
