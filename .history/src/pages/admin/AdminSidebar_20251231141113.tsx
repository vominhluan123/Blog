import { Button } from '@/components/ui/button'
import { FileText, Users, Settings } from 'lucide-react'
import { Link } from 'react-router'

const AdminSidebar = () => {
  return (
    <div className='w-64 bg-card border-r border-border p-4 flex flex-col gap-4'>
      <h2 className='text-xl font-bold mb-6'>Admin Panel</h2>
      <nav className='space-y-2'>
        <Button variant='ghost' className='w-full justify-start' asChild>
          <Link to='/admin/posts'>
            <FileText className='h-5 w-5 mr-3' />
            Quản lý bài viết
          </Link>
        </Button>
        <Button variant='ghost' className='w-full justify-start' asChild>
          <Link to='/admin/users'>
            <Users className='h-5 w-5 mr-3' />
            Quản lý người dùng
          </Link>
        </Button>
        <Button variant='ghost' className='w-full justify-start' asChild>
          <Link to='/admin/settings'>
            <Settings className='h-5 w-5 mr-3' />
            Cài đặt
          </Link>
        </Button>
      </nav>
    </div>
  )
}

export default AdminSidebar
