export function parseMetaKeywords(value: string) {
  return value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}
