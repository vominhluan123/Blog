// components/ScrollToTop.tsx
import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react' // hoặc dùng icon khác (heroicons, font-awesome...)

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Hiện nút khi cuộn xuống > 300px (có thể chỉnh thành 100 hoặc 500 tùy thích)
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    // Cleanup
    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50 
        flex h-12 w-12 items-center justify-center 
        rounded-full bg-primary text-primary-foreground 
        shadow-lg transition-all duration-300 hover:bg-primary/90 
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
      `}
      aria-label='Cuộn lên đầu trang'
      title='Cuộn lên đầu trang'
    >
      <ArrowUp className='h-6 w-6' />
    </button>
  )
}
