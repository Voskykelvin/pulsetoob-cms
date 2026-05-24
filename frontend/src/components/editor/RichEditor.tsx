'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useRef, useEffect } from 'react'
import api from '@/lib/api'

// CSS Styles to ensure lists, headers, and spacing display correctly inside Tiptap's clean canvas
const editorStyles = `
  .ProseMirror {
    min-height: 400px;
    padding: 1.5rem;
    outline: none;
    font-family: Georgia, serif;
    font-size: 1.1rem;
    line-height: 1.8;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #9ca3af;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
  .ProseMirror ul {
    list-style-type: disc !important;
    padding-left: 2rem !important;
    margin-bottom: 1rem;
  }
  .ProseMirror ol {
    list-style-type: decimal !important;
    padding-left: 2rem !important;
    margin-bottom: 1rem;
  }
  .ProseMirror li {
    margin-bottom: 0.25rem;
  }
  .ProseMirror blockquote {
    border-left: 4px solid #3b82f6;
    background-color: #f9fafb;
    padding: 0.75rem 1rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: #4b5563;
    border-radius: 0 4px 4px 0;
  }
  .ProseMirror img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.5rem auto;
    display: block;
  }
  .ProseMirror pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 1rem;
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.9rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }
  .ProseMirror h1 { font-size: 2.25rem; font-weight: 800; margin-top: 1.75rem; margin-bottom: 0.75rem; }
  .ProseMirror h2 { font-size: 1.8rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; }
  .ProseMirror h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
  .ProseMirror h4 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
`

function MenuBar({ editor }: { editor: any }) {
  if (!editor) return null

  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/media/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.success) {
        editor.chain().focus().setImage({ src: res.data.data.url, alt: res.data.data.altText || file.name }).run()
      }
    } catch (err) {
      alert('Image upload failed')
    }
    e.target.value = ''
  }

  const addImageUrl = () => {
    const url = prompt('Enter image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const baseClass = "p-1.5 rounded transition duration-150 text-sm flex items-center justify-center min-w-[32px] h-[32px]"
  const activeClass = "bg-green-100 text-green-700 font-bold"
  const inactiveClass = "text-gray-600 hover:bg-gray-100 hover:text-gray-900"

  const btnStyle = (active: boolean) => `${baseClass} ${active ? activeClass : inactiveClass}`

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      {/* Dropdown for Headers */}
      <select
        onChange={(e) => {
          const val = e.target.value
          if (val === 'p') editor.chain().focus().setParagraph().run()
          else editor.chain().focus().toggleHeading({ level: parseInt(val) as any }).run()
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? '1' :
          editor.isActive('heading', { level: 2 }) ? '2' :
          editor.isActive('heading', { level: 3 }) ? '3' :
          editor.isActive('heading', { level: 4 }) ? '4' : 'p'
        }
        className="px-2 py-1.5 border border-gray-200 rounded-md text-sm bg-white cursor-pointer min-w-[120px] focus:outline-none focus:border-green-500 text-black"
      >
        <option value="p">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
      </select>

      <div className="w-[1px] h-6 bg-gray-200 mx-1" />

      {/* Basic Marks */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnStyle(editor.isActive('bold'))}
        title="Bold"
      >
        <span className="font-bold text-base">B</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnStyle(editor.isActive('italic'))}
        title="Italic"
      >
        <span className="italic font-serif text-base">I</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnStyle(editor.isActive('underline'))}
        title="Underline"
      >
        <span className="underline text-base">U</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnStyle(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <span className="line-through text-base">S</span>
      </button>

      <div className="w-[1px] h-6 bg-gray-200 mx-1" />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btnStyle(editor.isActive({ textAlign: 'left' }))}
        title="Align Left"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btnStyle(editor.isActive({ textAlign: 'center' }))}
        title="Align Center"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h14" /></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={btnStyle(editor.isActive({ textAlign: 'right' }))}
        title="Align Right"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M8 12h12M13 18h7" /></svg>
      </button>

      <div className="w-[1px] h-6 bg-gray-200 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnStyle(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16M2 6h.01M2 12h.01M2 18h.01" /></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnStyle(editor.isActive('orderedList'))}
        title="Ordered List"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 6h13M7 12h13M7 18h13M3 5h2v3M3 11h3v3M3 17h3v3" /></svg>
      </button>

      <div className="w-[1px] h-6 bg-gray-200 mx-1" />

      {/* Formatting & Elements */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnStyle(editor.isActive('blockquote'))}
        title="Blockquote"
      >
        <span className="font-serif font-bold text-lg">“</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btnStyle(editor.isActive('codeBlock'))}
        title="Code Block"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btnStyle(false)}
        title="Horizontal Rule"
      >
        <span className="text-base">—</span>
      </button>

      <div className="w-[1px] h-6 bg-gray-200 mx-1" />

      {/* Links */}
      {showLinkInput ? (
        <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200 shadow-sm">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => { if (e.key === 'Enter') addLink() }}
            className="px-2 py-0.5 text-xs focus:outline-none border-none w-36 text-black"
            autoFocus
          />
          <button type="button" onClick={addLink} className="px-2 py-0.5 text-xs bg-green-600 text-white rounded">Add</button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600">×</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run()
            } else {
              setShowLinkInput(true)
            }
          }}
          className={btnStyle(editor.isActive('link'))}
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </button>
      )}

      {/* Images */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={btnStyle(false)}
        title="Upload Image"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      <button
        type="button"
        onClick={addImageUrl}
        className={btnStyle(false)}
        title="Image URL"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </button>

      <div className="w-[1px] h-6 bg-gray-200 mx-1" />

      {/* Undo/Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={`${btnStyle(false)} disabled:opacity-30`}
        title="Undo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={`${btnStyle(false)} disabled:opacity-30`}
        title="Redo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" /></svg>
      </button>
    </div>
  )
}

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichEditor({ content, onChange, placeholder }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing your article...' }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      if (onChange) onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none'
      }
    }
  })

  // Keep editor state synced with external updates (like Draft Restore)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  const wordCount = editor ? editor.state.doc.textContent.split(/\s+/).filter(w => w.length > 0).length : 0

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
      <MenuBar editor={editor} />
      <div className="bg-white min-h-[400px]">
        <EditorContent editor={editor} />
      </div>
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-gray-150 text-xs text-gray-500 rounded-b-xl">
        <span>{wordCount} words</span>
        <span>{Math.ceil(wordCount / 200)} min read</span>
      </div>
    </div>
  )
}
