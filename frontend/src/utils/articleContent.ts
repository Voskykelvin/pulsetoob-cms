function decodeAttributeValue(value: string) {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#039;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface ContentBacklink {
  id?: string
  url?: string | null
  anchorText?: string | null
  targetUrl?: string | null
  type?: string | null
  relationship?: string | null
  position?: string | null
  isActive?: boolean
}

interface NormalizedBacklink {
  id?: string
  href: string
  anchorText: string
  type?: string | null
  relationship?: string | null
}

const SKIP_LINKING_TAGS = new Set(['a', 'script', 'style', 'code', 'pre', 'textarea', 'button'])

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isSafeHref(href: string) {
  if (href.startsWith('/') || href.startsWith('#')) return true

  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeContentBacklinks(backlinks?: ContentBacklink[] | null) {
  const seen = new Set<string>()
  const normalized: NormalizedBacklink[] = []

  for (const backlink of backlinks || []) {
    if (backlink.isActive === false) continue
    if (backlink.position && backlink.position !== 'content') continue

    const anchorText = backlink.anchorText?.trim()
    const href = (backlink.targetUrl || backlink.url || '').trim()
    if (!anchorText || anchorText.length < 2 || !href) continue
    if (!isSafeHref(href)) continue

    const key = `${anchorText.toLowerCase()}|${href}`
    if (seen.has(key)) continue
    seen.add(key)

    normalized.push({
      id: backlink.id,
      href,
      anchorText,
      type: backlink.type,
      relationship: backlink.relationship,
    })
  }

  return normalized.sort((a, b) => b.anchorText.length - a.anchorText.length)
}

function getRelAttribute(backlink: NormalizedBacklink) {
  const rel = new Set(['noopener', 'noreferrer'])

  if (backlink.relationship && backlink.relationship !== 'dofollow') {
    rel.add(backlink.relationship)
  }

  if (backlink.type === 'sponsored' || backlink.type === 'affiliate') {
    rel.add('sponsored')
  }

  return Array.from(rel).join(' ')
}

function isInternalHref(href: string, type?: string | null) {
  return type === 'internal' || href.startsWith('/') || href.startsWith('#')
}

function renderBacklinkAnchor(text: string, backlink: NormalizedBacklink) {
  const target = isInternalHref(backlink.href, backlink.type) ? '' : ' target="_blank"'
  const dataId = backlink.id ? ` data-backlink-id="${escapeHtml(backlink.id)}"` : ''

  return `<a href="${escapeHtml(backlink.href)}" class="backlink-highlight" rel="${getRelAttribute(backlink)}"${target}${dataId}>${text}</a>`
}

function replaceBacklinkText(text: string, backlinks: NormalizedBacklink[], linkedBacklinks: Set<string>) {
  let output = text

  for (const backlink of backlinks) {
    const linkKey = backlink.id || `${backlink.anchorText}|${backlink.href}`
    if (linkedBacklinks.has(linkKey)) continue

    const pattern = new RegExp(`(^|[^A-Za-z0-9_])(${escapeRegExp(backlink.anchorText)})(?=$|[^A-Za-z0-9_])`, 'i')

    output = output.replace(pattern, (match, prefix: string, linkedText: string) => {
      linkedBacklinks.add(linkKey)
      return `${prefix}${renderBacklinkAnchor(linkedText, backlink)}`
    })
  }

  return output
}

function getTagName(tagHtml: string) {
  return tagHtml.match(/^<\/?\s*([a-z0-9-]+)/i)?.[1]?.toLowerCase() || null
}

function tagIsClosing(tagHtml: string) {
  return /^<\//.test(tagHtml)
}

function tagIsSelfClosing(tagHtml: string) {
  return /\/\s*>$/.test(tagHtml) || /^<(br|hr|img|input|meta|link|source|track|wbr)\b/i.test(tagHtml)
}

function addBacklinkHighlights(html: string, backlinks?: ContentBacklink[] | null) {
  const normalizedBacklinks = normalizeContentBacklinks(backlinks)
  if (normalizedBacklinks.length === 0) return html

  const linkedBacklinks = new Set<string>()
  let output = ''
  let cursor = 0
  let skipDepth = 0
  const tagPattern = /<[^>]+>/g
  let match: RegExpExecArray | null

  while ((match = tagPattern.exec(html)) !== null) {
    const textBeforeTag = html.slice(cursor, match.index)
    output += skipDepth > 0 ? textBeforeTag : replaceBacklinkText(textBeforeTag, normalizedBacklinks, linkedBacklinks)

    const tagHtml = match[0]
    const tagName = getTagName(tagHtml)

    if (tagName && SKIP_LINKING_TAGS.has(tagName)) {
      if (tagIsClosing(tagHtml)) {
        skipDepth = Math.max(0, skipDepth - 1)
      } else if (!tagIsSelfClosing(tagHtml)) {
        skipDepth += 1
      }
    }

    output += tagHtml
    cursor = match.index + tagHtml.length
  }

  const trailingText = html.slice(cursor)
  output += skipDepth > 0 ? trailingText : replaceBacklinkText(trailingText, normalizedBacklinks, linkedBacklinks)

  return output
}

function getImageCaption(imageHtml: string) {
  const titleMatch = imageHtml.match(/\stitle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
  const rawCaption = titleMatch?.[1] ?? titleMatch?.[2] ?? titleMatch?.[3] ?? ''
  return decodeAttributeValue(rawCaption).trim()
}

function addContentImageClass(figureHtml: string) {
  const openingTagMatch = figureHtml.match(/^<figure\b[^>]*>/i)
  if (!openingTagMatch) return figureHtml

  const openingTag = openingTagMatch[0]
  if (/\sclass\s*=/i.test(openingTag)) {
    const updatedOpeningTag = openingTag.replace(
      /\sclass\s*=\s*(["'])(.*?)\1/i,
      (match, quote: string, className: string) => {
        if (className.split(/\s+/).includes('content-image')) return match
        return ` class=${quote}${className} content-image${quote}`
      },
    )

    return figureHtml.replace(openingTag, updatedOpeningTag)
  }

  return figureHtml.replace(/^<figure\b/i, '<figure class="content-image"')
}

function renderCaption(caption: string) {
  return `<figcaption>${escapeHtml(caption)}</figcaption>`
}

function renderImageFigure(imageHtml: string, caption: string) {
  return `<figure class="content-image">${imageHtml}${renderCaption(caption)}</figure>`
}

function imageAppearsInsideFigure(source: string, offset: number, imageLength: number) {
  const before = source.slice(Math.max(0, offset - 500), offset).toLowerCase()
  const after = source.slice(offset + imageLength, offset + imageLength + 500).toLowerCase()
  return before.lastIndexOf('<figure') > before.lastIndexOf('</figure') && after.includes('</figure>')
}

export function renderArticleContent(html?: string | null, backlinks?: ContentBacklink[] | null) {
  if (!html) return ''

  let output = html.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, (figureHtml) => {
    const figureWithClass = addContentImageClass(figureHtml)
    if (/<figcaption\b/i.test(figureWithClass)) return figureWithClass

    const imageMatch = figureWithClass.match(/<img\b[^>]*>/i)
    const caption = imageMatch ? getImageCaption(imageMatch[0]) : ''
    if (!caption) return figureWithClass

    return figureWithClass.replace(/<\/figure\s*>/i, `${renderCaption(caption)}</figure>`)
  })

  output = output.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/gi, (match, imageHtml: string) => {
    const caption = getImageCaption(imageHtml)
    return caption ? renderImageFigure(imageHtml, caption) : match
  })

  output = output.replace(/<img\b[^>]*>/gi, (imageHtml, offset: number, source: string) => {
    if (imageAppearsInsideFigure(source, offset, imageHtml.length)) return imageHtml

    const caption = getImageCaption(imageHtml)
    return caption ? renderImageFigure(imageHtml, caption) : imageHtml
  })

  return addBacklinkHighlights(output, backlinks)
}
