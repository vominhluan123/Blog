// components/PostContentPreview.tsx
import DOMPurify from 'dompurify'

interface PostContentPreviewProps {
  content: string
  maxLength?: number
  className?: string
}

export function PostContentPreview({ content, maxLength = 200, className = '' }: PostContentPreviewProps) {
  // Strip HTML và làm sạch text
  const getCleanPlainText = (html: string): string => {
    const div = document.createElement('div')
    div.innerHTML = DOMPurify.sanitize(html || '') // sanitize trước khi strip
    let text = (div.textContent || div.innerText || '').trim()

    // Thay nhiều khoảng trắng liên tiếp bằng 1 space
    text = text.replace(/\s+/g, ' ')

    // Loại bỏ ký tự đặc biệt thừa nếu cần (tùy chọn)
    // text = text.replace(/[^\w\s.,!?'-]/g, '');

    return text
  }

  const plainText = getCleanPlainText(content)
  const preview = plainText.length > maxLength ? plainText.slice(0, maxLength).trim() + '...' : plainText

  return (
    <p
      className={`
        text-muted-foreground 
        line-clamp-3 
        overflow-hidden 
        text-ellipsis 
        break-words
        ${className}
      `}
    >
      {preview || 'Không có nội dung...'}
    </p>
  )
}
