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

export function renderArticleContent(html?: string | null) {
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

  return output
}
