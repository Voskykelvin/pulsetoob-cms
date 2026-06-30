export function parseMetaKeywords(value: string) {
  return value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

export function parseTagNames(value: string) {
  return Array.from(new Set(
    value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  ))
}

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

export function toIsoDateTime(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
