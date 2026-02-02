import { cn } from '@/lib/utils'
import DOMPurify from 'dompurify'
import { useMemo } from 'react'

type QuillPreviewProps = {
  html?: string
  className?: string
}

function normalizeQuillHtml(html: string) {
  return html.replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ')
}

export default function QuillPreview({ html = '', className }: QuillPreviewProps) {
  const cleanHtml = useMemo(() => {
    const normalized = normalizeQuillHtml(html)
    return DOMPurify.sanitize(normalized)
  }, [html])

  if (!cleanHtml) return null

  return <div className={cn('ql-editor quill-preview', className)} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
}
