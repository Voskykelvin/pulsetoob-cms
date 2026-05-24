import type { ArticleStatus } from '@/types/cms'

const statusStyles: Record<ArticleStatus, { label: string; bg: string; color: string; border: string }> = {
  draft: { label: 'Draft', bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  published: { label: 'Published', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  scheduled: { label: 'Scheduled', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  archived: { label: 'Archived', bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
}

interface StatusBadgeProps {
  status: ArticleStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.draft

  return (
    <span
      style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 500,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  )
}
