// src/components/ScrollToTop.tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // Force scroll lên đầu mỗi khi route thay đổi (navigate hoặc reload)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // instant để nhanh, hoặc 'smooth' nếu muốn mượt
    })
  }, [pathname]) // Chạy lại mỗi khi pathname thay đổi

  return null
}

export default ScrollToTop
