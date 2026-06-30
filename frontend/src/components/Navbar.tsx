'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', textDecoration: 'none' }}>
          PulseToob
        </Link>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }} className="desktop-nav">
            <Link href="/" style={{ color: '#374151', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Home</Link>
            <Link href="/blog" style={{ color: '#374151', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Stories</Link>
            <Link href="/about" style={{ color: '#374151', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>About</Link>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center' }}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{ background: 'white', borderTop: '1px solid #e5e7eb', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/" onClick={() => setIsOpen(false)} style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Home</Link>
          <Link href="/blog" onClick={() => setIsOpen(false)} style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Stories</Link>
          <Link href="/about" onClick={() => setIsOpen(false)} style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>About</Link>
        </div>
      )}
    </nav>
  )
}
