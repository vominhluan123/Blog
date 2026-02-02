import LeftSidebar from '@/components/layouts/user/LeftSidebar'
import MainFeed from '@/components/layouts/user/MainFeed'
import RightSidebar from '@/components/layouts/user/RightSidebar'
import { useTitle } from '@/hooks/useTitle'

const HomePage = () => {
  useTitle('Trang chủ • Blog')

  return (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* Left sidebar */}
        <LeftSidebar />
        {/* Main feed */}
        <MainFeed />
        {/* Right sidebar */}
        <RightSidebar />
      </div>
    </>
  )
}

export default HomePage
