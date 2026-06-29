'use client'

import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          color: '#111827',
          fontSize: '0.875rem',
        },
        success: {
          iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
        },
        error: {
          iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
        },
      }}
    />
  )
}
