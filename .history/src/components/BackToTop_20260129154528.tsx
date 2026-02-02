// components/BackToTop.tsx (sau khi đổi tên)
import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300) // ngắn gọn hơn
    }

    window.addEventListener('scroll', toggleVisibility)
    // Chạy lần đầu để check ngay nếu trang load mà đã cuộn sẵn
    toggleVisibility()

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isVisible) return null // Cách này sạch hơn opacity + pointer-events-none

  return (
    <button
      onClick={scrollToTop}
      className='
        fixed bottom-6 right-6 z-100
        flex h-12 w-12 items-center justify-center 
        rounded-full bg-primary text-primary-foreground 
        shadow-xl transition-all duration-300 
        hover:bg-primary/90 hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      '
      aria-label='Cuộn lên đầu trang'
      title='Cuộn lên đầu trang'
    >
      <ArrowUp className='h-6 w-6' />
    </button>
  )
}
