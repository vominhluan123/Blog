import LeftSidebar from '@/components/layout/LeftSidebar'
import MainFeed from '@/components/layout/MainFeed'
import RightSidebar from '@/components/layout/RightSidebar'
import { useAuth } from '@/contexts/useAuth'
import { useTitle } from '@/hooks/useTitle'

const HomePage = () => {
  useTitle('Trang chủ')
  const { user } = useAuth
  console.log("🚀 ~ HomePage ~ user:", user)
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
