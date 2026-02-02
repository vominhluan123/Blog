// components/PostContentPreview.tsx
import DOMPurify from 'dompurify'
import 'react-quill-new/dist/quill.snow.css' // Import CSS Quill để style giống editor

interface PostContentPreviewProps {
  content: string
  maxLength?: number // default 200
  className?: string
}

export function PostContentPreview({ content, maxLength = 200, className = '' }: PostContentPreviewProps) {
  // Lấy plain text để preview (không tag)
  const plainText = (() => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content || ''
    return (tempDiv.textContent || tempDiv.innerText || '').trim()
  })()

  const previewText = plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText

  // Nếu muốn preview giữ format nhẹ (hiển thị HTML sanitized nhưng giới hạn)
  // const sanitized = DOMPurify.sanitize(content || '');
  // Nhưng cho preview feed → dùng plain text đơn giản hơn, tránh bể layout

  return (
    <p className={`text-muted-foreground mb-4 line-clamp-3 ${className}`}>{previewText || 'Không có nội dung...'}</p>
  )
}
