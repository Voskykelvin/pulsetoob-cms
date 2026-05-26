export function renderArticleContent(html?: string | null) {
  if (!html) return ''
  if (typeof document === 'undefined') return html

  const template = document.createElement('template')
  template.innerHTML = html

  template.content.querySelectorAll('img').forEach((image) => {
    const credit = image.getAttribute('title')?.trim()
    if (!credit) return

    const parent = image.parentElement
    if (parent?.tagName.toLowerCase() === 'figure') {
      if (!parent.querySelector('figcaption')) {
        const caption = document.createElement('figcaption')
        caption.textContent = credit
        parent.appendChild(caption)
      }
      return
    }

    const figure = document.createElement('figure')
    figure.className = 'content-image'

    const caption = document.createElement('figcaption')
    caption.textContent = credit

    const imageOnlyParagraph =
      parent?.tagName.toLowerCase() === 'p' &&
      parent.textContent?.trim() === '' &&
      parent.children.length === 1

    if (imageOnlyParagraph) {
      parent.replaceWith(figure)
    } else {
      image.replaceWith(figure)
    }

    figure.appendChild(image)
    figure.appendChild(caption)
  })

  return template.innerHTML
}
