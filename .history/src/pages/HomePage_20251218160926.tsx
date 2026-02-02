import LeftSidebar from '@/components/layout/LeftSidebar'
import MainFeed from '@/components/layout/MainFeed'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { useTitle } from '@/hooks/useTitle'
import { Link } from 'react-router'

const HomePage = () => {
  useTitle('Trang chủ')

  return (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* Left sidebar */}
        <LeftSidebar />
        {/* Main feed */}
        <MainFeed />
        {/* Right sidebar */}
      <Ri
      </div>
    </>
  )
}

export default HomePage
