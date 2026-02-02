// HomePage.tsx
import MainFeed from '@/components/layouts/user/MainFeed'
import { useTitle } from '@/hooks/useTitle'

export default function HomePage() {
  useTitle('Trang chủ • Blog Game')

  return (
    <div className='space-y-10'>
      <h1 className='text-4xl md:text-5xl font-extrabold text-primary tracking-tight'>
        Blog Game - Tips, Review & Hướng dẫn
      </h1>

      <MainFeed />
    </div>
  )
}
