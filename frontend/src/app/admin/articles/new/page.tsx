'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import dynamic from 'next/dynamic'
import SeoPanel from '@/components/editor/SeoPanel'

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] flex items-center justify-center border border-gray-200 rounded-xl bg-gray-50 text-gray-400">
      Loading content editor...
    </div>
  )
})

interface Category {
  id: string;
  name: string;
  color?: string;
}

const previewStyles = `
  .ProseMirror-preview ul {
    list-style-type: disc !important;
    padding-left: 2rem !important;
    margin-bottom: 1rem;
  }
  .ProseMirror-preview ol {
    list-style-type: decimal !important;
    padding-left: 2rem !important;
    margin-bottom: 1rem;
  }
  .ProseMirror-preview li {
    margin-bottom: 0.25rem;
  }
  .ProseMirror-preview blockquote {
    border-left: 4px solid #16a34a;
    background-color: #f0fdf4;
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: #166534;
    border-radius: 0 6px 6px 0;
  }
  .ProseMirror-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.5rem auto;
    display: block;
  }
  .ProseMirror-preview pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 1rem;
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.9rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }
  .ProseMirror-preview h1 { font-size: 2.25rem; font-weight: 800; margin-top: 1.75rem; margin-bottom: 0.75rem; }
  .ProseMirror-preview h2 { font-size: 1.8rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; }
  .ProseMirror-preview h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
  .ProseMirror-preview h4 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
`

export default function NewArticlePage() {
  const router = useRouter()
  const featuredImageInputRef = useRef<HTMLInputElement>(null)
  
  const [saving, setSaving] = useState(false)
  const [uploadingFeatured, setUploadingFeatured] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  
  // Isolated State: Keeping the featured image object completely safe from form edits
  const [featuredImage, setFeaturedImage] = useState<any>(null)

  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    categoryIds: [] as string[],
    isFeatured: false,
    isBreaking: false,
    rssIncluded: true,
    section: ''
  })

  // Load categories and check for Auth Token
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login')
      return
    }
    api.get('/categories?flat=true&active=true')
      .then(res => {
        if (res.data.success) setCategories(res.data.data)
      })
      .catch((err) => console.error("Failed to load categories", err))

    // Check and restore draft
    const savedDraft = localStorage.getItem('pulse_article_draft')
    const savedImage = localStorage.getItem('pulse_article_draft_image')
    if (savedDraft) {
      const confirmRestore = window.confirm('An unsaved draft was found. Would you like to restore it?')
      if (confirmRestore) {
        try {
          setForm(JSON.parse(savedDraft))
          if (savedImage) setFeaturedImage(JSON.parse(savedImage))
        } catch (e) {
          localStorage.removeItem('pulse_article_draft')
          localStorage.removeItem('pulse_article_draft_image')
        }
      } else {
        localStorage.removeItem('pulse_article_draft')
        localStorage.removeItem('pulse_article_draft_image')
      }
    }
  }, [router])

  // Save Progress as Local Backup on Change
  useEffect(() => {
    if (form.title || form.content || form.excerpt) {
      localStorage.setItem('pulse_article_draft', JSON.stringify(form))
    }
  }, [form])

  useEffect(() => {
    if (featuredImage) {
      localStorage.setItem('pulse_article_draft_image', JSON.stringify(featuredImage))
    } else {
      localStorage.removeItem('pulse_article_draft_image')
    }
  }, [featuredImage])

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFeatured(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/media/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.success) {
        setFeaturedImage(res.data.data) // Store the entire Media object safely
      }
    } catch (err) {
      alert('Featured image upload failed')
    } finally {
      setUploadingFeatured(false)
    }
  }

  const saveFeaturedImageMetadata = async () => {
    if (!featuredImage?.id) return
    await api.put(`/media/${featuredImage.id}`, {
      altText: featuredImage.altText || '',
      caption: featuredImage.caption || ''
    })
  }

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!form.title.trim()) return alert('Title is required')
    if (!form.content.trim()) return alert('Content is required')
    setSaving(true)
    try {
      await saveFeaturedImageMetadata()
      // Package payload dynamically accessing the isolated image ID at submit time
      const payload = {
        ...form,
        status,
        featuredImageId: featuredImage?.id || null, 
        metaKeywords: form.metaKeywords ? form.metaKeywords.split(',').map(k => k.trim()) : []
      }
      const res = await api.post('/articles', payload)
      if (res.data.success) {
        localStorage.removeItem('pulse_article_draft')
        localStorage.removeItem('pulse_article_draft_image')
        alert(status === 'published' ? 'Article published!' : 'Article saved as draft!')
        router.push('/admin/articles')
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save article')
    } finally {
      setSaving(false)
    }
  }

  const slugifiedUrl = form.title
    ? `https://pulsetoob.com/articles/${form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
    : 'https://pulsetoob.com/articles/your-slug-url'

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800 font-sans">
      <style dangerouslySetInnerHTML={{ __html: previewStyles }} />
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>PulseToob</span>
            <span>/</span>
            <span>Articles</span>
            <span>/</span>
            <span className="text-gray-800 font-medium">New Article</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Create New Article</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150 text-sm font-medium bg-white text-gray-700 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 transition duration-150 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50"
          >
            {saving ? 'Publishing...' : 'Publish Now'}
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-lg p-1 max-w-fit shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-5 py-2 font-semibold text-sm rounded-md transition-all ${
            activeTab === 'edit'
              ? 'bg-green-600 text-white shadow'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Write & Edit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-5 py-2 font-semibold text-sm rounded-md transition-all ${
            activeTab === 'preview'
              ? 'bg-green-600 text-white shadow'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Reader Preview Mode
        </button>
      </div>

      {activeTab === 'preview' ? (
        /* PREVIEW MODE */
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 font-serif">
          {form.section && (
            <span className="text-xs font-bold text-green-600 tracking-widest uppercase font-sans">
              {form.section}
            </span>
          )}
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-950 mt-2 leading-tight font-sans">
            {form.title || 'Untitled Article'}
          </h1>
          
          <div className="flex items-center gap-3 text-sm text-gray-500 my-5 pb-5 border-b border-gray-150 font-sans">
            <span className="font-semibold text-gray-800">PulseToob Editorial</span>
            <span>|</span>
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {featuredImage?.url ? (
            <figure className="my-6">
              <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <img src={featuredImage.url} alt={featuredImage.altText || form.title || 'Featured image'} className="w-full h-[380px] object-cover" />
              </div>
              {featuredImage.caption && (
                <figcaption className="mt-2 text-xs text-gray-500 font-sans">
                  {featuredImage.caption}
                </figcaption>
              )}
            </figure>
          ) : (
            <div className="w-full h-[180px] bg-gray-50 rounded-xl my-6 flex flex-col items-center justify-center text-gray-400 font-sans italic border border-dashed border-gray-200">
              <span>Featured image placeholder</span>
              <span className="mt-1 text-xs not-italic">Upload an image to preview the story artwork.</span>
            </div>
          )}

          <div 
            className="ProseMirror-preview max-w-none text-gray-800 leading-relaxed text-base md:text-lg"
            dangerouslySetInnerHTML={{ __html: form.content || '<p class="text-gray-400 italic">No content written yet...</p>' }}
          />
        </div>
      ) : (
        /* EDIT MODE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <input
              type="text"
              placeholder="Article Title"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-4 border border-gray-200 rounded-xl text-2xl font-bold bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <RichEditor
              content={form.content}
              onChange={(html) => setForm(prev => ({ ...prev, content: html }))}
              placeholder="Write the core story of your article here..."
            />

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Excerpt (Brief Summary)</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                placeholder="Provide a quick summary of the article to show in post list cards..."
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              />
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800">SEO Settings</h3>
                <p className="text-xs text-gray-500">Add metadata tags to improve how this article indexes on Google.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <label className="font-semibold text-gray-700">Meta Title</label>
                    <span className={`text-xs ${form.metaTitle.length > 60 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {form.metaTitle.length}/60 recommendations
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={70}
                    value={form.metaTitle}
                    onChange={(e) => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="Focus SEO headline..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <label className="font-semibold text-gray-700">Meta Description</label>
                    <span className={`text-xs ${form.metaDescription.length > 155 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {form.metaDescription.length}/155 recommendations
                    </span>
                  </div>
                  <textarea
                    maxLength={160}
                    rows={3}
                    value={form.metaDescription}
                    onChange={(e) => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="Write a highly clickable meta summary..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                  <input
                    type="text"
                    value={form.metaKeywords}
                    onChange={(e) => setForm(prev => ({ ...prev, metaKeywords: e.target.value }))}
                    placeholder="news, sports, technology (separate with commas)"
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  />
                </div>
              </div>

              <SeoPanel
                title={form.title}
                content={form.content}
                excerpt={form.excerpt}
                metaTitle={form.metaTitle}
                metaDescription={form.metaDescription}
                metaKeywords={form.metaKeywords}
                featuredImageUrl={featuredImage?.url}
              />
            </div>
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Featured Image</h3>
              {featuredImage?.url ? (
                <div className="relative group rounded-lg overflow-hidden border border-gray-200">
                  <img src={featuredImage.url} alt="Featured Preview" className="w-full h-36 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setFeaturedImage(null)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium"
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => featuredImageInputRef.current?.click()}
                  disabled={uploadingFeatured}
                  className="w-full h-36 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-gray-50 transition text-gray-500 bg-white"
                >
                  {uploadingFeatured ? (
                    <span className="text-xs font-medium">Uploading image...</span>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold">Upload Featured Image</span>
                    </>
                  )}
                </button>
              )}
              <input
                type="file"
                ref={featuredImageInputRef}
                onChange={handleFeaturedImageUpload}
                accept="image/*"
                className="hidden"
              />
              {featuredImage?.url ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-gray-700">
                    Alt text
                    <input
                      type="text"
                      value={featuredImage.altText || ''}
                      onChange={(e) => setFeaturedImage((prev: any) => ({ ...prev, altText: e.target.value }))}
                      maxLength={300}
                      placeholder="Describe what is visible in this image."
                      className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-gray-700">
                    Image credit
                    <textarea
                      value={featuredImage.caption || ''}
                      onChange={(e) => setFeaturedImage((prev: any) => ({ ...prev, caption: e.target.value }))}
                      rows={2}
                      placeholder="Credit the photographer, agency, or source."
                      className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </label>
                </div>
              ) : (
                <p className="mt-3 text-xs text-gray-400">
                  Image alt text and credit fields will appear after upload.
                </p>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Editorial Section</h3>
              <select
                value={form.section}
                onChange={(e) => setForm(prev => ({ ...prev, section: e.target.value }))}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none text-black cursor-pointer"
              >
                <option value="">Select a Section...</option>
                <option value="News">News</option>
                <option value="Technology">Technology</option>
                <option value="Opinion">Opinion</option>
                <option value="Business">Business</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Distribution Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                    checked={form.isFeatured}
                    onChange={(e) => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  />
                  <span>Set as Featured Article</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                    checked={form.isBreaking}
                    onChange={(e) => setForm(prev => ({ ...prev, isBreaking: e.target.checked }))}
                  />
                  <span>Set as Breaking News</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                    checked={form.rssIncluded}
                    onChange={(e) => setForm(prev => ({ ...prev, rssIncluded: e.target.checked }))}
                  />
                  <span>Include in Global RSS Feeds</span>
                </label>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Categories</h3>
              {categories.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No active categories. <a href="/admin/categories" className="text-green-600 underline">Add one now</a>.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition cursor-pointer text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                        checked={form.categoryIds.includes(cat.id)}
                        onChange={(e) =>
                          setForm(prev => ({
                            ...prev,
                            categoryIds: e.target.checked
                              ? [...prev.categoryIds, cat.id]
                              : prev.categoryIds.filter((id) => id !== cat.id)
                          }))
                        }
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color || '#16a34a' }}
                      />
                      <span className="font-medium">{cat.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-green-50 p-5 rounded-xl border border-green-200 shadow-sm">
              <h3 className="text-sm font-bold text-green-800 mb-2 font-sans">CMS Writing Guide</h3>
              <ul className="text-xs text-green-900 space-y-2 list-disc pl-4 leading-relaxed font-sans">
                <li>Keep headers hierarchically styled (H1, H2, H3).</li>
                <li>Upload images directly within the text area.</li>
                <li>Aim for 400+ words to improve search rankings.</li>
                <li>Add internal hyperlinks to keep bounce rates low.</li>
                <li>Autosave is active. Feel free to draft at your own pace.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
