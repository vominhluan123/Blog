// RootLayout.tsx
import LeftSidebar from '@/components/layouts/user/LeftSidebar'
import RightSidebar from '@/components/layouts/user/RightSidebar'
import ScrollToTop from '@/components/ScrollToTop'
import { Outlet, useLocation } from 'react-router'
import Footer from './Footer'
import Header from './Header'
import BackToTop from '@/components/BackToTop'
export default function RootLayout() {
  const location = useLocation()

  // Ẩn sidebar ở một số trang nếu cần (login, admin, write, post detail...)
  const hideSidebars =
    location.pathname === '/contact' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/forgot-password') ||
    location.pathname.startsWith('/verify-email') ||
    location.pathname.startsWith('/post/') ||
    location.pathname.startsWith('/write') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/my-post') ||
    location.pathname.startsWith('/author')

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <ScrollToTop />

      <Header />

      <main className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12'>
        {hideSidebars ? (
          // Trang đặc biệt: full width, không sidebar
          <div className='w-full'>
            <Outlet />
          </div>
        ) : (
          // Trang có sidebar (home, categories, profile...)
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8'>
            {/* Left Sidebar - ẩn trên mobile, hiện lg+ */}
            <div className='hidden lg:block lg:col-span-3 xl:col-span-3'>
              <LeftSidebar />
            </div>

            {/* Nội dung chính - full trên mobile, 6 cột trên lg */}
            <div className='col-span-1 lg:col-span-6 xl:col-span-6'>
              <Outlet />
            </div>

            {/* Right Sidebar - ẩn trên lg, hiện xl+ (rộng hơn) */}
            <div className='hidden xl:block xl:col-span-3'>
              <RightSidebar />
            </div>
          </div>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}
