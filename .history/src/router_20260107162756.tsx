// RootLayout.tsx (giả sử bạn có file này)
import { Outlet } from 'react-router-dom'
import Header from '../components/Header' // Header của bạn
import Footer from '../components/Footer' // nếu có
import ScrollToTop from '../components/ScrollToTop' // import vừa tạo

export default function RootLayout() {
  return (
    <>
      <ScrollToTop /> {/* <-- Đặt ở đây, nó sẽ theo dõi mọi route con */}
      <Header />
      <main className='min-h-screen'>
        <Outlet /> {/* Các trang như Home, Profile, PostDetail, ... render ở đây */}
      </main>
      <Footer /> {/* nếu có */}
    </>
  )
}
