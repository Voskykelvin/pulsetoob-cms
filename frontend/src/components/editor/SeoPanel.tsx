'use client'

interface SeoPanelProps {
  title: string
  content: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  featuredImageUrl?: string | null
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pulsetoob.com'

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export default function SeoPanel({ title, content, excerpt, metaTitle, metaDescription, metaKeywords, featuredImageUrl }: SeoPanelProps) {
  const finalTitle = metaTitle || title || 'Untitled Article'
  const finalDescription = metaDescription || excerpt || 'Write a meta description or summary to preview how this post will appear in search results.'
  const slug = slugify(title || 'your-slug-url')
  const canonicalUrl = `${SITE_URL}/article/${slug}`
  const plainText = stripHtml(content)
  const wordCount = plainText ? plainText.split(/\s+/).length : 0
  const keywords = metaKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean)

  const checks = [
    { label: 'Title length', ok: finalTitle.length >= 40 && finalTitle.length <= 70, detail: `${finalTitle.length}/70` },
    { label: 'Meta description', ok: finalDescription.length >= 120 && finalDescription.length <= 160, detail: `${finalDescription.length}/160` },
    { label: 'Content depth', ok: wordCount >= 500, detail: `${wordCount} words` },
    { label: 'Featured image', ok: Boolean(featuredImageUrl), detail: featuredImageUrl ? 'Ready' : 'Missing' },
    { label: 'Canonical URL', ok: canonicalUrl.length < 120, detail: canonicalUrl },
    { label: 'Schema basics', ok: Boolean(title && finalDescription && wordCount), detail: title ? 'Article schema ready' : 'Needs title' },
  ]

  const score = Math.round((checks.filter((check) => check.ok).length / checks.length) * 100)

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">SEO & Publishing Health</h3>
          <p className="text-xs text-gray-500">Search preview, social preview, schema readiness, and editorial checks.</p>
        </div>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold border ${score >= 80 ? 'bg-green-50 text-green-700 border-green-200' : score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {score}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checks.map((check) => (
          <div key={check.label} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
            <div className={`text-xs font-bold ${check.ok ? 'text-green-700' : 'text-amber-700'}`}>{check.ok ? 'Good' : 'Review'}: {check.label}</div>
            <div className="text-xs text-gray-500 mt-1 truncate">{check.detail}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
        <span className="text-xs font-semibold text-gray-500 uppercase">Search Preview</span>
        <div className="mt-3 max-w-[600px]">
          <div className="text-[14px] text-gray-600 truncate">{canonicalUrl}</div>
          <div className="text-[#1a0dab] text-xl line-clamp-1 mt-1 font-medium">{finalTitle}</div>
          <div className="text-[#4d5156] text-sm line-clamp-2 mt-1 leading-snug">{finalDescription}</div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-gray-200 bg-white">
        <span className="text-xs font-semibold text-gray-500 uppercase">Social Preview</span>
        <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden max-w-md">
          <div className="h-32 bg-gray-100">
            {featuredImageUrl ? <img src={featuredImageUrl} alt="" className="w-full h-full object-cover" /> : null}
          </div>
          <div className="p-3">
            <div className="text-sm font-bold text-gray-900 line-clamp-2">{finalTitle}</div>
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{finalDescription}</div>
            <div className="text-[11px] text-gray-400 mt-2">{SITE_URL.replace(/^https?:\/\//, '')}</div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Internal link prompt: add 2-3 links to related PulseToob stories before publishing.
        {keywords.length > 0 && <span> Target keywords: {keywords.join(', ')}.</span>}
      </div>
    </div>
  )
}
