import ScrollToTop from '@/components/ScrollToTop'
import { Outlet } from 'react-router'
import Footer from './Footer'
import Header from './Header'

const RootLayout = () => {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <ScrollToTop />
      {/* Header */}
      <Header />

      <main className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <Outlet />
      </main>
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default RootLayout
