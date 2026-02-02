// components/BackToTop.tsx (sau khi đổi tên)
import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', toggleVisibility)
    toggleVisibility()
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])
  const scrollToTop = () => {
    const duration = 1500 // ← thử chỉnh 1000 → 2000 để xem tốc độ ưng ý
    const start = window.pageYOffset || document.documentElement.scrollTop
    const startTime = performance.now ? performance.now() : Date.now()

    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    function animateScroll(currentTime: number) {
      const timeElapsed = currentTime - startTime
      const progress = Math.min(timeElapsed / duration, 1)
      const easedProgress = easeInOutCubic(progress)

      const newPosition = start * (1 - easedProgress)

      window.scrollTo(0, newPosition)

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }
  if (!isVisible) return null

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
        cursor-pointer
      '
      aria-label='Cuộn lên đầu trang'
      title='Cuộn lên đầu trang'
    >
      <ArrowUp className='h-6 w-6' />
    </button>
  )
}
