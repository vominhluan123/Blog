import LeftSidebar from '@/components/layouts/LeftSidebar'
import MainFeed from '@/components/layouts/MainFeed'
import RightSidebar from '@/components/layouts/RightSidebar'
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
